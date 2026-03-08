"use strict";
// src/modules/payments/payments.controller.ts
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.stripeWebhook = exports.stripeCreateIntent = exports.mpesaCallback = exports.mpesaStatus = exports.mpesaStkPush = void 0;
const stripe_1 = __importDefault(require("stripe"));
const db_1 = require("../../config/db");
const mpesa_service_1 = require("./mpesa.service");
const sendEmail_1 = require("../../utils/sendEmail");
const stripe = new stripe_1.default(process.env.STRIPE_SECRET_KEY, {
    apiVersion: "2026-02-25.clover",
});
// ── M-PESA: Initiate STK Push ─────────────────────────────────────────────
const mpesaStkPush = async (req, res) => {
    const { phone, amount, bookingRef, bookingId } = req.body;
    if (!phone || !amount || !bookingRef || !bookingId) {
        return res.status(400).json({ error: "Missing required fields" });
    }
    try {
        const result = await (0, mpesa_service_1.initiateStkPush)({ phone, amount, bookingRef });
        await db_1.pool.query(`INSERT INTO payments
        (booking_id, method, amount, currency, status, mpesa_phone, mpesa_checkout_id)
       VALUES ($1, 'mpesa', $2, 'KES', 'pending', $3, $4)`, [bookingId, amount, phone, result.CheckoutRequestID]);
        res.json({
            checkoutRequestId: result.CheckoutRequestID,
            message: "STK Push sent. Waiting for user to confirm.",
        });
    }
    catch (error) {
        console.error("STK Push error:", error);
        res.status(500).json({ error: "Failed to initiate M-Pesa payment" });
    }
};
exports.mpesaStkPush = mpesaStkPush;
// ── M-PESA: Poll payment status (frontend calls every 3s) ─────────────────
const mpesaStatus = async (req, res) => {
    // Fix: convert param to string to avoid string | string[] type error
    const checkoutRequestId = String(req.params.checkoutRequestId);
    try {
        const { rows } = await db_1.pool.query(`SELECT status FROM payments WHERE mpesa_checkout_id = $1`, [checkoutRequestId]);
        if (rows.length === 0) {
            return res.status(404).json({ error: "Payment not found" });
        }
        // Already resolved by Safaricom callback — return immediately
        if (rows[0].status === "success" || rows[0].status === "failed") {
            return res.json({ status: rows[0].status });
        }
        // Still pending — query Safaricom directly
        const result = await (0, mpesa_service_1.queryStkStatus)(checkoutRequestId);
        if (result.ResultCode === "0") {
            return res.json({ status: "success" });
        }
        else if (result.ResultCode === "1032") {
            // 1032 = cancelled by user
            return res.json({ status: "failed" });
        }
        res.json({ status: "pending" });
    }
    catch {
        // Safaricom throws while still processing — treat as pending
        res.json({ status: "pending" });
    }
};
exports.mpesaStatus = mpesaStatus;
// ── M-PESA: Callback (Safaricom POSTs here automatically after payment) ───
const mpesaCallback = async (req, res) => {
    const body = req.body?.Body?.stkCallback;
    if (!body) {
        return res.status(400).json({ error: "Invalid callback body" });
    }
    const checkoutId = body.CheckoutRequestID;
    const resultCode = body.ResultCode; // 0 = success
    try {
        if (resultCode === 0) {
            const items = body.CallbackMetadata?.Item || [];
            const receipt = items.find((i) => i.Name === "MpesaReceiptNumber")?.Value;
            // Mark payment successful
            await db_1.pool.query(`UPDATE payments
         SET status = 'success', mpesa_receipt = $1, updated_at = NOW()
         WHERE mpesa_checkout_id = $2`, [receipt, checkoutId]);
            // Get booking linked to this payment
            const { rows } = await db_1.pool.query(`SELECT b.* FROM bookings b
         JOIN payments p ON p.booking_id = b.id
         WHERE p.mpesa_checkout_id = $1`, [checkoutId]);
            if (rows.length > 0) {
                const booking = rows[0];
                // Confirm booking
                await db_1.pool.query(`UPDATE bookings SET status = 'confirmed' WHERE id = $1`, [booking.id]);
                // Send confirmation email with PDF invoice
                await (0, sendEmail_1.sendConfirmationEmail)(booking);
            }
        }
        else {
            // Payment failed or cancelled
            await db_1.pool.query(`UPDATE payments SET status = 'failed', updated_at = NOW()
         WHERE mpesa_checkout_id = $1`, [checkoutId]);
        }
    }
    catch (error) {
        console.error("M-Pesa callback error:", error);
    }
    // Safaricom REQUIRES a 200 response — always send this regardless
    res.status(200).json({ ResultCode: 0, ResultDesc: "Success" });
};
exports.mpesaCallback = mpesaCallback;
// ── STRIPE: Create Payment Intent ─────────────────────────────────────────
const stripeCreateIntent = async (req, res) => {
    const { amount, bookingId, bookingRef, customerEmail } = req.body;
    try {
        const paymentIntent = await stripe.paymentIntents.create({
            amount: Math.round(amount * 100), // Stripe uses cents
            currency: process.env.STRIPE_CURRENCY || "usd",
            metadata: { bookingId, bookingRef },
            receipt_email: customerEmail,
            description: `Wikima Safari — ${bookingRef}`,
        });
        await db_1.pool.query(`INSERT INTO payments
        (booking_id, method, amount, currency, status, stripe_payment_intent, stripe_client_secret)
       VALUES ($1, 'card', $2, $3, 'pending', $4, $5)`, [
            bookingId,
            amount,
            process.env.STRIPE_CURRENCY || "usd",
            paymentIntent.id,
            paymentIntent.client_secret,
        ]);
        res.json({
            clientSecret: paymentIntent.client_secret,
            paymentIntentId: paymentIntent.id,
        });
    }
    catch (error) {
        console.error("Stripe intent error:", error);
        res.status(500).json({ error: "Failed to create payment intent" });
    }
};
exports.stripeCreateIntent = stripeCreateIntent;
// ── STRIPE: Webhook ────────────────────────────────────────────────────────
// IMPORTANT: Route must use express.raw() in payments.routes.ts
const stripeWebhook = async (req, res) => {
    // Fix: handle string | string[] header type safely
    const rawSig = req.headers["stripe-signature"];
    if (!rawSig) {
        return res.status(400).send("Missing stripe-signature header");
    }
    const sig = Array.isArray(rawSig) ? rawSig[0] : rawSig;
    let event;
    try {
        event = stripe.webhooks.constructEvent(req.body, // raw Buffer — express.raw() must be used on this route
        sig, process.env.STRIPE_WEBHOOK_SECRET);
    }
    catch (err) {
        console.error("Stripe webhook signature failed:", err);
        return res.status(400).send(`Webhook error: ${err}`);
    }
    if (event.type === "payment_intent.succeeded") {
        const intent = event.data.object;
        const { bookingId } = intent.metadata;
        await db_1.pool.query(`UPDATE payments SET status = 'success', updated_at = NOW()
       WHERE stripe_payment_intent = $1`, [intent.id]);
        await db_1.pool.query(`UPDATE bookings SET status = 'confirmed' WHERE id = $1`, [bookingId]);
        const { rows } = await db_1.pool.query(`SELECT * FROM bookings WHERE id = $1`, [bookingId]);
        if (rows.length > 0) {
            await (0, sendEmail_1.sendConfirmationEmail)(rows[0]);
        }
    }
    if (event.type === "payment_intent.payment_failed") {
        const intent = event.data.object;
        await db_1.pool.query(`UPDATE payments SET status = 'failed', updated_at = NOW()
       WHERE stripe_payment_intent = $1`, [intent.id]);
    }
    res.json({ received: true });
};
exports.stripeWebhook = stripeWebhook;
