// src/routes/newsletter.ts
import { Router, Request, Response } from "express";

const router = Router();

router.post("/subscribe", async (req: Request, res: Response) => {
  const { email, name } = req.body;
  if (!email) return res.status(400).json({ error: "Email is required" });

  try {
    // ── Resend (if configured) ──────────────────────────────────────────
    const resendKey = process.env.RESEND_API_KEY;
    const fromEmail = process.env.FROM_EMAIL || "info@wikimasafari.com";
    const adminEmail = process.env.ADMIN_EMAIL || "munenecaleb007@gmail.com";

    if (resendKey) {
      await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${resendKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          from: fromEmail,
          to:   adminEmail,
          subject: `New Newsletter Subscriber — ${email}`,
          text: `Name: ${name || "N/A"}\nEmail: ${email}`,
        }),
      });
    }

    // Always return success — email is optional
    return res.status(200).json({ success: true, message: "Subscribed successfully" });

  } catch (error) {
    console.error("Newsletter error:", error);
    // Still return 200 — don't fail the user because email failed
    return res.status(200).json({ success: true, message: "Subscribed successfully" });
  }
});

export default router;
