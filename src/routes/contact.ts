// src/routes/contact.ts
import { Router, Request, Response } from "express";
import { pool } from "../config/db";

const router = Router();

// ── POST /api/contact ─────────────────────────────────────────────────────
router.post("/", async (req: Request, res: Response) => {
  const {
    name, email, phone, package: pkg,
    destinations, travelDate,
    adults, children, duration, budget,
    interests, hearAboutUs, message,
  } = req.body;

  if (!name || !email) {
    return res.status(400).json({ error: "Name and email are required" });
  }

  try {
    // ── Save to Supabase ────────────────────────────────────────────────
    await pool.query(`
      CREATE TABLE IF NOT EXISTS enquiries (
        id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        name         VARCHAR(120) NOT NULL,
        email        VARCHAR(255) NOT NULL,
        phone        VARCHAR(30),
        package      VARCHAR(50),
        destinations TEXT,
        travel_date  DATE,
        adults       INTEGER,
        children     INTEGER,
        duration     INTEGER,
        budget       VARCHAR(50),
        interests    TEXT,
        hear_about   VARCHAR(100),
        message      TEXT,
        created_at   TIMESTAMPTZ DEFAULT NOW()
      )
    `);

    await pool.query(
      `INSERT INTO enquiries
        (name, email, phone, package, destinations, travel_date,
         adults, children, duration, budget, interests, hear_about, message)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13)`,
      [
        name, email,
        phone        ?? null,
        pkg          ?? null,
        destinations ?? null,
        travelDate   || null,
        adults   ? Number(adults)   : null,
        children ? Number(children) : null,
        duration ? Number(duration) : null,
        budget       ?? null,
        Array.isArray(interests) ? interests.join(", ") : (interests ?? null),
        hearAboutUs  ?? null,
        message      ?? null,
      ]
    );

    console.log(`📩 New enquiry from ${name} <${email}>`);

    // ── Send email via Resend (optional — skipped if key not set) ───────
    const resendKey  = process.env.RESEND_API_KEY;
    const fromEmail  = process.env.FROM_EMAIL  || "info@wikimasafari.com";
    const adminEmail = process.env.ADMIN_EMAIL || "munenecaleb007@gmail.com";

    if (resendKey) {
      const interestsList = Array.isArray(interests)
        ? interests.join(", ")
        : (interests || "—");

      // Email to admin
      await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${resendKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          from:    fromEmail,
          to:      adminEmail,
          subject: `🦁 New Safari Enquiry from ${name}`,
          html: `
            <div style="font-family:Georgia,serif;max-width:560px;margin:0 auto;padding:32px;color:#2d3a10;">
              <h2 style="color:#4B5320;border-bottom:2px solid #e8e0d0;padding-bottom:12px;">New Safari Enquiry</h2>
              <table style="width:100%;font-size:14px;border-collapse:collapse;">
                <tr><td style="padding:6px 0;color:#8a7a60;width:130px;">Name</td><td style="font-weight:600;">${name}</td></tr>
                <tr><td style="padding:6px 0;color:#8a7a60;">Email</td><td><a href="mailto:${email}">${email}</a></td></tr>
                <tr><td style="padding:6px 0;color:#8a7a60;">Phone</td><td>${phone || "—"}</td></tr>
                <tr><td style="padding:6px 0;color:#8a7a60;">Package</td><td>${pkg || "—"}</td></tr>
                <tr><td style="padding:6px 0;color:#8a7a60;">Destinations</td><td>${destinations || "—"}</td></tr>
                <tr><td style="padding:6px 0;color:#8a7a60;">Travel Date</td><td>${travelDate || "—"}</td></tr>
                <tr><td style="padding:6px 0;color:#8a7a60;">Guests</td><td>${adults || 2} adults, ${children || 0} children</td></tr>
                <tr><td style="padding:6px 0;color:#8a7a60;">Duration</td><td>${duration || "—"} days</td></tr>
                <tr><td style="padding:6px 0;color:#8a7a60;">Budget</td><td>${budget || "—"}</td></tr>
                <tr><td style="padding:6px 0;color:#8a7a60;">Interests</td><td>${interestsList}</td></tr>
                <tr><td style="padding:6px 0;color:#8a7a60;">Heard via</td><td>${hearAboutUs || "—"}</td></tr>
                <tr><td style="padding:6px 0;color:#8a7a60;vertical-align:top;">Message</td><td>${message || "—"}</td></tr>
              </table>
            </div>
          `,
        }),
      });

      // Auto-reply to guest
      await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${resendKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          from:    fromEmail,
          to:      email,
          subject: "We received your safari enquiry — Wikima Safari 🦁",
          html: `
            <div style="font-family:Georgia,serif;max-width:560px;margin:0 auto;padding:32px;color:#2d3a10;">
              <h2 style="color:#4B5320;">Thank you, ${name}!</h2>
              <p style="font-size:14px;line-height:1.7;color:#5a5040;">
                We've received your safari enquiry and our team will get back to you within <strong>24 hours</strong>.
              </p>
              <p style="font-size:14px;line-height:1.7;color:#5a5040;">
                Explore our tours at <a href="https://wikimasafari.com/tours" style="color:#4B5320;">wikimasafari.com/tours</a>
              </p>
              <div style="margin-top:24px;padding:16px;background:#f0f5e8;border-radius:8px;font-size:13px;color:#4B5320;">
                <strong>Wikima Safari Expeditions</strong><br/>
                info@wikimasafari.com · +254 720 069 550<br/>
                Nairobi, Kenya · wikimasafari.com
              </div>
            </div>
          `,
        }),
      });
    }

    return res.status(201).json({
      success: true,
      message: "Enquiry received. Our team will contact you within 24 hours.",
    });

  } catch (error) {
    console.error("Contact route error:", error);
    return res.status(500).json({ error: "Failed to save enquiry" });
  }
});

// ── GET /api/contact (admin) ──────────────────────────────────────────────
router.get("/", async (_req: Request, res: Response) => {
  try {
    const { rows } = await pool.query(
      "SELECT * FROM enquiries ORDER BY created_at DESC"
    );
    res.json({ enquiries: rows, total: rows.length });
  } catch (error) {
    console.error("Get enquiries error:", error);
    res.status(500).json({ error: "Could not fetch enquiries" });
  }
});

export default router;
