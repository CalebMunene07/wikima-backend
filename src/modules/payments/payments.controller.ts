// src/modules/payments/payments.controller.ts

import { Request, Response } from "express";
import axios from "axios";
import { pool } from "../../config/db";
import { initiateStkPush, queryStkStatus } from "./mpesa.service";
import { sendConfirmationEmail } from "../../utils/sendEmail";

const PAYSTACK_SECRET = process.env.PAYSTACK_SECRET_KEY!;
const PAYSTACK_BASE   = "https://api.paystack.co";

// ── M-PESA: Initiate STK Push ─────────────────────────────────────────────
export const mpesaStkPush = async (req: Request, res: Response) => {
  const { phone, amount, bookingRef, bookingId } = req.body;

  if (!phone || !amount || !bookingRef || !bookingId) {
    return res.status(400).json({ error: "Missing required fields" });
  }

  try {
    const result = await initiateStkPush({ phone, amount, bookingRef });

    await pool.query(
      `INSERT INTO payments
        (booking_id, method, amount, currency, status, mpesa_phone, mpesa_checkout_id)
       VALUES ($1, 'mpesa', $2, 'KES', 'pending', $3, $4)`,
      [bookingId, amount, phone, result.CheckoutRequestID]
    );

    res.json({
      checkoutRequestId: result.CheckoutRequestID,
      message: "STK Push sent. Waiting for user to confirm.",
    });
  } catch (error) {
    console.error("STK Push error:", error);
    res.status(500).json({ error: "Failed to initiate M-Pesa payment" });
  }
};

// ── M-PESA: Poll payment status ───────────────────────────────────────────
export const mpesaStatus = async (req: Request, res: Response) => {
  const checkoutRequestId = String(req.params.checkoutRequestId);

  try {
    const { rows } = await pool.query(
      `SELECT status FROM payments WHERE mpesa_checkout_id = $1`,
      [checkoutRequestId]
    );

    if (rows.length === 0) {
      return res.status(404).json({ error: "Payment not found" });
    }

    if (rows[0].status === "success" || rows[0].status === "failed") {
      return res.json({ status: rows[0].status });
    }

    const result = await queryStkStatus(checkoutRequestId);

    if (result.ResultCode === "0") {
      return res.json({ status: "success" });
    } else if (result.ResultCode === "1032") {
      return res.json({ status: "failed" });
    }

    res.json({ status: "pending" });
  } catch {
    res.json({ status: "pending" });
  }
};

// ── M-PESA: Callback (Safaricom POSTs here) ───────────────────────────────
export const mpesaCallback = async (req: Request, res: Response) => {
  const body = req.body?.Body?.stkCallback;

  if (!body) {
    return res.status(400).json({ error: "Invalid callback body" });
  }

  const checkoutId = body.CheckoutRequestID;
  const resultCode = body.ResultCode;

  try {
    if (resultCode === 0) {
      const items = body.CallbackMetadata?.Item || [];
      const receipt = items.find(
        (i: { Name: string }) => i.Name === "MpesaReceiptNumber"
      )?.Value;

      await pool.query(
        `UPDATE payments
         SET status = 'success', mpesa_receipt = $1, updated_at = NOW()
         WHERE mpesa_checkout_id = $2`,
        [receipt, checkoutId]
      );

      const { rows } = await pool.query(
        `SELECT b.* FROM bookings b
         JOIN payments p ON p.booking_id = b.id
         WHERE p.mpesa_checkout_id = $1`,
        [checkoutId]
      );

      if (rows.length > 0) {
        const booking = rows[0];
        await pool.query(
          `UPDATE bookings SET status = 'confirmed' WHERE id = $1`,
          [booking.id]
        );
        await sendConfirmationEmail(booking);
      }
    } else {
      await pool.query(
        `UPDATE payments SET status = 'failed', updated_at = NOW()
         WHERE mpesa_checkout_id = $1`,
        [checkoutId]
      );
    }
  } catch (error) {
    console.error("M-Pesa callback error:", error);
  }

  // Safaricom REQUIRES a 200 response — always send this
  res.status(200).json({ ResultCode: 0, ResultDesc: "Success" });
};

// ── PAYSTACK: Initialize transaction ─────────────────────────────────────
export const paystackInitialize = async (req: Request, res: Response) => {
  const { amount, bookingId, bookingRef, customerEmail } = req.body;

  try {
    const response = await axios.post(
      `${PAYSTACK_BASE}/transaction/initialize`,
      {
        email:        customerEmail,
        amount:       Math.round(amount * 100), // Paystack uses smallest currency unit
        currency:     process.env.PAYSTACK_CURRENCY || "KES",
        reference:    bookingRef,
        metadata: {
          bookingId,
          bookingRef,
          cancel_action: process.env.FRONTEND_URL + "/booking/cancelled",
        },
        callback_url: process.env.FRONTEND_URL + `/booking/confirm?ref=${bookingRef}`,
      },
      {
        headers: {
          Authorization: `Bearer ${PAYSTACK_SECRET}`,
          "Content-Type": "application/json",
        },
      }
    );

    const { authorization_url, reference, access_code } = response.data.data;

    await pool.query(
      `INSERT INTO payments
        (booking_id, method, amount, currency, status, paystack_reference, paystack_access_code)
       VALUES ($1, 'card', $2, $3, 'pending', $4, $5)`,
      [
        bookingId,
        amount,
        process.env.PAYSTACK_CURRENCY || "KES",
        reference,
        access_code,
      ]
    );

    res.json({ authorizationUrl: authorization_url, reference });
  } catch (error) {
    console.error("Paystack initialize error:", error);
    res.status(500).json({ error: "Failed to initialize Paystack payment" });
  }
};

// ── PAYSTACK: Verify transaction (frontend calls after redirect back) ─────
export const paystackVerify = async (req: Request, res: Response) => {
  const reference = String(req.params.reference);

  try {
    const response = await axios.get(
      `${PAYSTACK_BASE}/transaction/verify/${reference}`,
      {
        headers: { Authorization: `Bearer ${PAYSTACK_SECRET}` },
      }
    );

    const txn = response.data.data;

    if (txn.status === "success") {
      await pool.query(
        `UPDATE payments
         SET status = 'success', updated_at = NOW()
         WHERE paystack_reference = $1`,
        [reference]
      );

      const bookingRes = await pool.query(
        `SELECT b.* FROM bookings b
         JOIN payments p ON p.booking_id = b.id
         WHERE p.paystack_reference = $1`,
        [reference]
      );

      if (bookingRes.rows.length > 0) {
        const booking = bookingRes.rows[0];
        await pool.query(
          `UPDATE bookings SET status = 'confirmed' WHERE id = $1`,
          [booking.id]
        );
        await sendConfirmationEmail(booking);
      }

      return res.json({ status: "success" });
    }

    res.json({ status: txn.status });
  } catch (error) {
    console.error("Paystack verify error:", error);
    res.status(500).json({ error: "Failed to verify payment" });
  }
};

// ── PAYSTACK: Webhook (Paystack POSTs here after charge events) ───────────
export const paystackWebhook = async (req: Request, res: Response) => {
  const crypto = await import("crypto");

  const hash = crypto
    .createHmac("sha512", PAYSTACK_SECRET)
    .update(JSON.stringify(req.body))
    .digest("hex");

  if (hash !== req.headers["x-paystack-signature"]) {
    return res.status(401).send("Invalid signature");
  }

  const { event, data } = req.body;

  if (event === "charge.success") {
    const reference = data.reference;
    const bookingId = data.metadata?.bookingId;

    await pool.query(
      `UPDATE payments SET status = 'success', updated_at = NOW()
       WHERE paystack_reference = $1`,
      [reference]
    );

    if (bookingId) {
      await pool.query(
        `UPDATE bookings SET status = 'confirmed' WHERE id = $1`,
        [bookingId]
      );

      const { rows } = await pool.query(
        `SELECT * FROM bookings WHERE id = $1`,
        [bookingId]
      );
      if (rows.length > 0) {
        await sendConfirmationEmail(rows[0]);
      }
    }
  }

  if (event === "charge.failed") {
    await pool.query(
      `UPDATE payments SET status = 'failed', updated_at = NOW()
       WHERE paystack_reference = $1`,
      [data.reference]
    );
  }

  // Paystack requires a 200 response
  res.status(200).json({ received: true });
};
