// src/modules/bookings/bookings.controller.ts
import { Request, Response } from "express";
import { pool } from "../../config/db";
import { generateRef } from "../../utils/generateRef";

const PRICES: Record<string, number> = {
  Standard: 890,
  Premium:  1450,
  Luxury:   2800,
};

// ── POST /api/bookings ─────────────────────────────────────────
export const createBooking = async (req: Request, res: Response) => {
  const {
    tourTitle, tourId, guestName, guestEmail,
    guestPhone, travelDate, guests, package: pkg,
    specialRequests,
  } = req.body;

  if (!tourTitle || !guestName || !guestEmail || !travelDate || !guests || !pkg) {
    return res.status(400).json({ error: "Missing required booking fields" });
  }

  if (!PRICES[pkg]) {
    return res.status(400).json({ error: "Invalid package. Must be Standard, Premium or Luxury" });
  }

  try {
    const totalAmount   = PRICES[pkg] * Number(guests);
    const depositAmount = parseFloat((totalAmount * 0.30).toFixed(2));
    const reference     = generateRef();

    const { rows } = await pool.query(
      `INSERT INTO bookings
        (reference, tour_id, tour_title, guest_name, guest_email,
         guest_phone, travel_date, guests, package,
         total_amount, deposit_amount, special_requests, status)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,'pending')
       RETURNING *`,
      [
        reference, tourId ?? null, tourTitle,
        guestName, guestEmail, guestPhone ?? null,
        travelDate, Number(guests), pkg,
        totalAmount, depositAmount, specialRequests ?? null,
      ]
    );

    res.status(201).json({ booking: rows[0] });
  } catch (error) {
    console.error("CreateBooking error:", error);
    res.status(500).json({ error: "Could not create booking" });
  }
};

// ── GET /api/bookings/:id ──────────────────────────────────────
export const getBookingById = async (req: Request, res: Response) => {
  try {
    const { rows } = await pool.query(
      "SELECT * FROM bookings WHERE id = $1",
      [req.params.id]
    );

    if (rows.length === 0) {
      return res.status(404).json({ error: "Booking not found" });
    }

    res.json({ booking: rows[0] });
  } catch (error) {
    console.error("GetBookingById error:", error);
    res.status(500).json({ error: "Could not fetch booking" });
  }
};

// ── GET /api/bookings/ref/:ref ─────────────────────────────────
export const getBookingByRef = async (req: Request, res: Response) => {
  try {
    const { rows } = await pool.query(
      `SELECT b.*, p.status as payment_status, p.method as payment_method,
              p.mpesa_receipt, p.stripe_payment_intent
       FROM bookings b
       LEFT JOIN payments p ON p.booking_id = b.id
       WHERE b.reference = $1`,
      [String(req.params.ref).toUpperCase()]
    );

    if (rows.length === 0) {
      return res.status(404).json({ error: "Booking not found" });
    }

    res.json({ booking: rows[0] });
  } catch (error) {
    console.error("GetBookingByRef error:", error);
    res.status(500).json({ error: "Could not fetch booking" });
  }
};

// ── GET /api/bookings (admin) ──────────────────────────────────
export const getAllBookings = async (req: Request, res: Response) => {
  const { status, page = "1", limit = "20" } = req.query;

  const offset = (Number(page) - 1) * Number(limit);

  try {
    const conditions = status ? "WHERE b.status = $3" : "";
    const params     = status
      ? [Number(limit), offset, status]
      : [Number(limit), offset];

    const { rows } = await pool.query(
      `SELECT b.*, p.status as payment_status, p.method as payment_method
       FROM bookings b
       LEFT JOIN payments p ON p.booking_id = b.id
       ${conditions}
       ORDER BY b.created_at DESC
       LIMIT $1 OFFSET $2`,
      params
    );

    // Total count for pagination
    const countResult = await pool.query(
      `SELECT COUNT(*) FROM bookings ${status ? "WHERE status = $1" : ""}`,
      status ? [status] : []
    );

    res.json({
      bookings: rows,
      total:    Number(countResult.rows[0].count),
      page:     Number(page),
      limit:    Number(limit),
    });
  } catch (error) {
    console.error("GetAllBookings error:", error);
    res.status(500).json({ error: "Could not fetch bookings" });
  }
};

// ── PATCH /api/bookings/:id/status (admin) ─────────────────────
export const updateBookingStatus = async (req: Request, res: Response) => {
  const { status } = req.body;
  const validStatuses = ["pending", "confirmed", "cancelled", "completed"];

  if (!validStatuses.includes(status)) {
    return res.status(400).json({
      error: `Invalid status. Must be one of: ${validStatuses.join(", ")}`,
    });
  }

  try {
    const { rows } = await pool.query(
      "UPDATE bookings SET status = $1 WHERE id = $2 RETURNING *",
      [status, req.params.id]
    );

    if (rows.length === 0) {
      return res.status(404).json({ error: "Booking not found" });
    }

    res.json({ booking: rows[0] });
  } catch (error) {
    console.error("UpdateBookingStatus error:", error);
    res.status(500).json({ error: "Could not update booking status" });
  }
};