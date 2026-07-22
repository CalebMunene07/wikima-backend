// src/utils/sendEmail.ts
const RESEND_API_KEY = process.env.RESEND_API_KEY!;
const FROM_EMAIL    = process.env.FROM_EMAIL || "onboarding@resend.dev";
const ADMIN_EMAIL   = process.env.ADMIN_EMAIL || "munenecaleb007@gmail.com";
const SITE_URL       = process.env.SITE_URL || "https://www.wikimasafari.com";

async function sendEmail(to: string, subject: string, html: string) {
  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${RESEND_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ from: FROM_EMAIL, to, subject, html }),
  });
  if (!res.ok) {
    const err = await res.json();
    console.error("Resend error:", err);
  }
}

interface Booking {
  id: string;
  reference: string;
  tour_title: string;
  guest_name: string;
  guest_email: string;
  guest_phone?: string;
  travel_date: string;
  guests: number;
  adults?: number;
  children?: number;
  package: string;
  total_amount: number;
  deposit_amount: number;
  special_requests?: string;
  status: string;
}

export const sendConfirmationEmail = async (booking: Booking): Promise<void> => {
  const travelDate = new Date(booking.travel_date).toLocaleDateString("en-GB", {
    day: "numeric", month: "long", year: "numeric",
  });
  const balance = Number(booking.total_amount) - Number(booking.deposit_amount);

  const guestHtml = `
    <div style="font-family:Georgia,serif;max-width:600px;margin:0 auto;color:#2d3a10;">
      <div style="background:#07301d;padding:28px 32px;text-align:center;">
        <h1 style="color:#D4AF37;margin:0;font-size:22px;letter-spacing:2px;">WIKIMA SAFARI</h1>
        <p style="color:#a0c898;margin:6px 0 0;font-size:12px;letter-spacing:3px;text-transform:uppercase;">Booking Confirmation</p>
      </div>
      <div style="padding:32px;background:#fff;">
        <p style="font-size:16px;">Dear <strong>${booking.guest_name}</strong>,</p>
        <p style="color:#5a5040;line-height:1.7;">Your safari booking is confirmed! Here are your details:</p>
        <div style="background:#f6f9f2;border:1px solid #c8dfc0;border-radius:10px;padding:20px;margin:20px 0;">
          <table style="width:100%;border-collapse:collapse;font-size:14px;">
            <tr><td style="padding:7px 0;color:#7a8550;width:45%;">Booking Reference</td><td style="font-weight:700;color:#07301d;font-family:monospace;font-size:16px;">${booking.reference}</td></tr>
            <tr><td style="padding:7px 0;color:#7a8550;">Tour</td><td>${booking.tour_title}</td></tr>
            <tr><td style="padding:7px 0;color:#7a8550;">Package</td><td>${booking.package}</td></tr>
            <tr><td style="padding:7px 0;color:#7a8550;">Travel Date</td><td>${travelDate}</td></tr>
            <tr><td style="padding:7px 0;color:#7a8550;">Guests</td><td>${booking.adults ?? booking.guests} adult${(booking.adults ?? booking.guests) !== 1 ? "s" : ""}${booking.children ? `, ${booking.children} ${booking.children === 1 ? "child" : "children"}` : ""}</td></tr>
            <tr><td style="padding:7px 0;color:#7a8550;">Total Amount</td><td><strong>$${Number(booking.total_amount).toLocaleString()}</strong></td></tr>
            <tr><td style="padding:7px 0;color:#7a8550;">Deposit Paid (60%)</td><td style="color:#07301d;font-weight:700;">$${Number(booking.deposit_amount).toLocaleString()}</td></tr>
            <tr><td style="padding:7px 0;color:#7a8550;">Balance on Arrival</td><td>$${balance.toLocaleString()}</td></tr>
          </table>
        </div>
        ${booking.special_requests ? `
        <div style="background:#f6f8f0;border:1px solid #c8d09e;border-radius:8px;padding:14px;margin-bottom:20px;">
          <p style="font-size:11px;color:#7a8550;text-transform:uppercase;font-weight:600;margin:0 0 4px;">Special Requests</p>
          <p style="color:#2a2520;margin:0;font-size:14px;">${booking.special_requests}</p>
        </div>` : ""}
        <p style="color:#5a5040;font-size:14px;line-height:1.7;">
          Our team will contact you within <strong>24 hours</strong> to confirm your itinerary and arrange remaining logistics.
        </p>
        <div style="background:#f0f5e8;border:1px solid #c8d09e;border-radius:8px;padding:14px;margin-top:20px;">
          <p style="font-size:12px;color:#4B5320;font-weight:600;margin:0 0 4px;">📋 Cancellation Policy</p>
          <p style="font-size:12px;color:#6a7a40;margin:0;line-height:1.6;">
            Full refund up to 30 days before departure · 50% refund 15–29 days before · No refund within 14 days
          </p>
        </div>
        <div style="background:#fdfaf0;border:1px solid #e8dcae;border-radius:8px;padding:16px;margin-top:16px;">
          <p style="font-size:12px;color:#8a6d1a;font-weight:600;margin:0 0 6px;text-transform:uppercase;letter-spacing:0.05em;">🔗 Your Personal Referral Link</p>
          <p style="font-size:12px;color:#6a5a30;margin:0 0 10px;line-height:1.6;">
            Share this with friends and family. We'll know it was you who sent them our way — no discount
            or cash reward attached, just our thanks. Keep this email — it's the easiest way to find your
            link again later.
          </p>
          <p style="background:#fff;border:1px solid #e8dcae;border-radius:6px;padding:10px 12px;margin:0;font-family:monospace;font-size:12px;color:#4B5320;word-break:break-all;">
            ${SITE_URL}/?ref=${booking.reference}
          </p>
        </div>
        <div style="margin-top:24px;padding:14px;background:#f0f5e8;border-radius:8px;font-size:12px;color:#4B5320;text-align:center;">
          <strong>Wikima Safari Expeditions</strong><br/>
          info@wikimasafari.com · +254 720 069 550 · wikimasafari.com
        </div>
      </div>
    </div>`;

  const adminHtml = `
    <div style="font-family:Georgia,serif;max-width:560px;margin:0 auto;padding:24px;color:#2d3a10;">
      <h2 style="color:#07301d;border-bottom:2px solid #e8e0d0;padding-bottom:10px;">🦁 New Booking — ${booking.reference}</h2>
      <table style="width:100%;font-size:14px;border-collapse:collapse;">
        <tr><td style="padding:6px 0;color:#8a7a60;width:130px;">Guest</td><td><strong>${booking.guest_name}</strong></td></tr>
        <tr><td style="padding:6px 0;color:#8a7a60;">Email</td><td><a href="mailto:${booking.guest_email}">${booking.guest_email}</a></td></tr>
        <tr><td style="padding:6px 0;color:#8a7a60;">Phone</td><td>${booking.guest_phone || "—"}</td></tr>
        <tr><td style="padding:6px 0;color:#8a7a60;">Tour</td><td>${booking.tour_title}</td></tr>
        <tr><td style="padding:6px 0;color:#8a7a60;">Package</td><td>${booking.package}</td></tr>
        <tr><td style="padding:6px 0;color:#8a7a60;">Travel Date</td><td>${travelDate}</td></tr>
        <tr><td style="padding:6px 0;color:#8a7a60;">Adults</td><td>${booking.adults ?? booking.guests}</td></tr>
        <tr><td style="padding:6px 0;color:#8a7a60;">Children</td><td>${booking.children ?? 0}</td></tr>
        <tr><td style="padding:6px 0;color:#8a7a60;">Total</td><td><strong>$${Number(booking.total_amount).toLocaleString()}</strong></td></tr>
        <tr><td style="padding:6px 0;color:#8a7a60;">Deposit (60%)</td><td style="color:#07301d;font-weight:700;">$${Number(booking.deposit_amount).toLocaleString()}</td></tr>
        <tr><td style="padding:6px 0;color:#8a7a60;">Balance</td><td>$${balance.toLocaleString()}</td></tr>
        <tr><td style="padding:6px 0;color:#8a7a60;vertical-align:top;">Requests</td><td>${booking.special_requests || "—"}</td></tr>
      </table>
    </div>`;

  try {
    await Promise.all([
      sendEmail(
        booking.guest_email,
        `Booking Confirmed — ${booking.reference} | Wikima Safari 🦁`,
        guestHtml
      ),
      sendEmail(
        ADMIN_EMAIL,
        `🦁 New Booking from ${booking.guest_name} — ${booking.reference}`,
        adminHtml
      ),
    ]);
    console.log(`✅ Confirmation emails sent for ${booking.reference}`);
  } catch (error) {
    console.error("❌ Email send failed:", error);
  }
};

export const sendReferralNotification = async (params: {
  referrerEmail: string;
  referrerName: string;
  referralCode: string;
  newGuestName: string;
  newBookingReference: string;
}): Promise<void> => {
  const { referrerEmail, referrerName, referralCode, newGuestName, newBookingReference } = params;

  const html = `
    <div style="font-family:Georgia,serif;max-width:600px;margin:0 auto;color:#2d3a10;">
      <div style="background:#07301d;padding:28px 32px;text-align:center;">
        <h1 style="color:#D4AF37;margin:0;font-size:22px;letter-spacing:2px;">WIKIMA SAFARI</h1>
        <p style="color:#a0c898;margin:6px 0 0;font-size:12px;letter-spacing:3px;text-transform:uppercase;">Your Referral Was Used</p>
      </div>
      <div style="padding:32px;background:#fff;">
        <p style="font-size:16px;">Hi <strong>${referrerName}</strong>,</p>
        <p style="color:#5a5040;line-height:1.7;">
          Good news — someone just booked with us using your referral link! We thought you'd like to know.
        </p>
        <div style="background:#f6f9f2;border:1px solid #c8dfc0;border-radius:10px;padding:20px;margin:20px 0;">
          <table style="width:100%;border-collapse:collapse;font-size:14px;">
            <tr><td style="padding:7px 0;color:#7a8550;width:45%;">Your Referral Code</td><td style="font-weight:700;color:#07301d;font-family:monospace;font-size:16px;">${referralCode}</td></tr>
            <tr><td style="padding:7px 0;color:#7a8550;">New Guest</td><td>${newGuestName}</td></tr>
            <tr><td style="padding:7px 0;color:#7a8550;">Their Booking Ref</td><td style="font-family:monospace;">${newBookingReference}</td></tr>
          </table>
        </div>
        <p style="color:#5a5040;font-size:13px;line-height:1.7;">
          This is just a thank-you note — there's no discount or monetary reward attached to referrals,
          we simply wanted you to know that someone found us through you.
        </p>
        <div style="margin-top:24px;padding:14px;background:#f0f5e8;border-radius:8px;font-size:12px;color:#4B5320;text-align:center;">
          <strong>Wikima Safari Expeditions</strong><br/>
          info@wikimasafari.com · +254 720 069 550 · wikimasafari.com
        </div>
      </div>
    </div>`;

  try {
    await sendEmail(
      referrerEmail,
      `Someone booked using your referral — Wikima Safari 🦁`,
      html
    );
    console.log(`✅ Referral notification sent to ${referrerEmail} for code ${referralCode}`);
  } catch (error) {
    console.error("❌ Referral notification email failed:", error);
  }
};
