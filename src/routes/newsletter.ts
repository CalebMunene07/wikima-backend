import { Router, Request, Response } from "express";

const router = Router();

router.post("/subscribe", async (req: Request, res: Response) => {
  const { email, name } = req.body;
  if (!email) return res.status(400).json({ error: "Email is required" });

  try {
    const apiKey   = process.env.SENDGRID_API_KEY;
    const fromEmail = process.env.FROM_EMAIL || "";
    const adminEmail = process.env.ADMIN_EMAIL || fromEmail;

    if (apiKey && apiKey !== "SG.your_sendgrid_api_key_here" && fromEmail) {
      const sgMail = (await import("@sendgrid/mail")).default;
      sgMail.setApiKey(apiKey);
      await sgMail.send({ to: adminEmail, from: fromEmail, subject: `New Subscriber — ${email}`, text: `Name: ${name || "N/A"}\nEmail: ${email}` });
      await sgMail.send({ to: email, from: fromEmail, subject: "Welcome to Wikima Safari! 🦁", text: `Hi ${name || "there"},\n\nThank you for joining Wikima Safari. Adventures await!\n\nSee you in the wild.` });
    }

    return res.status(200).json({ success: true, message: "Subscribed successfully" });
  } catch (error) {
    console.error("Newsletter error:", error);
    return res.status(500).json({ error: "Failed to process subscription" });
  }
});

export default router;
