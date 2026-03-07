"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.sendConfirmationEmail = void 0;
// src/utils/sendEmail.ts
const mail_1 = __importDefault(require("@sendgrid/mail"));
mail_1.default.setApiKey(process.env.SENDGRID_API_KEY);
const sendConfirmationEmail = async (booking) => {
    const travelDate = new Date(booking.travel_date).toLocaleDateString("en-GB", {
        day: "numeric",
        month: "long",
        year: "numeric",
    });
    const html = `
    <div style="font-family:sans-serif;max-width:600px;margin:0 auto">
      <div style="background:#1a1208;padding:32px;text-align:center">
        <h1 style="color:#D4AF37;margin:0">WIKIMA SAFARI</h1>
        <p style="color:#b49650;margin:8px 0 0">Booking Confirmation</p>
      </div>

      <div style="padding:32px;background:#fff">
        <p style="color:#2a2520;font-size:16px">Dear <strong>${booking.guest_name}</strong>,</p>
        <p style="color:#4a4540">Your safari booking has been confirmed! Here are your details:</p>

        <table style="width:100%;border-collapse:collapse;margin:24px 0">
          <tr style="background:#f5f2ec">
            <td style="padding:10px 14px;font-size:12px;color:#9a9590;text-transform:uppercase;font-weight:600;width:40%">Booking Reference</td>
            <td style="padding:10px 14px;font-size:14px;color:#4B5320;font-weight:700">${booking.reference}</td>
          </tr>
          <tr>
            <td style="padding:10px 14px;font-size:12px;color:#9a9590;text-transform:uppercase;font-weight:600">Tour</td>
            <td style="padding:10px 14px;font-size:14px;color:#2a2520">${booking.tour_title}</td>
          </tr>
          <tr style="background:#f5f2ec">
            <td style="padding:10px 14px;font-size:12px;color:#9a9590;text-transform:uppercase;font-weight:600">Travel Date</td>
            <td style="padding:10px 14px;font-size:14px;color:#2a2520">${travelDate}</td>
          </tr>
          <tr>
            <td style="padding:10px 14px;font-size:12px;color:#9a9590;text-transform:uppercase;font-weight:600">Guests</td>
            <td style="padding:10px 14px;font-size:14px;color:#2a2520">${booking.guests} ${booking.guests === 1 ? "Guest" : "Guests"}</td>
          </tr>
          <tr style="background:#f5f2ec">
            <td style="padding:10px 14px;font-size:12px;color:#9a9590;text-transform:uppercase;font-weight:600">Package</td>
            <td style="padding:10px 14px;font-size:14px;color:#2a2520">${booking.package}</td>
          </tr>
          <tr>
            <td style="padding:10px 14px;font-size:12px;color:#9a9590;text-transform:uppercase;font-weight:600">Total Amount</td>
            <td style="padding:10px 14px;font-size:14px;color:#2a2520">$${Number(booking.total_amount).toLocaleString()}</td>
          </tr>
          <tr style="background:#1a1208">
            <td style="padding:12px 14px;font-size:12px;color:#b49650;text-transform:uppercase;font-weight:600">Deposit Paid</td>
            <td style="padding:12px 14px;font-size:16px;color:#D4AF37;font-weight:700">$${Number(booking.deposit_amount).toLocaleString()}</td>
          </tr>
        </table>

        ${booking.special_requests ? `
        <div style="background:#f6f8f0;border:1px solid #c8d09e;border-radius:8px;padding:14px;margin-bottom:24px">
          <p style="font-size:11px;color:#7a8550;text-transform:uppercase;font-weight:600;margin:0 0 4px">Special Requests</p>
          <p style="color:#2a2520;margin:0;font-size:14px">${booking.special_requests}</p>
        </div>` : ""}

        <p style="color:#4a4540;font-size:14px;line-height:1.7">
          Our team will contact you within <strong>24 hours</strong> to confirm your itinerary and arrange remaining logistics.
        </p>

        <div style="background:#f0f4ea;border:1px solid #c8d09e;border-radius:8px;padding:16px;margin-top:24px">
          <p style="font-size:12px;color:#4B5320;font-weight:600;margin:0 0 4px">📋 Cancellation Policy</p>
          <p style="font-size:12px;color:#6a7a40;margin:0;line-height:1.6">
            Full refund up to 30 days before departure · 50% refund 15–29 days before · No refund within 14 days
          </p>
        </div>
      </div>

      <div style="background:#1a1208;padding:20px;text-align:center">
        <p style="color:#b49650;font-size:12px;margin:0">www.wikimasafari.com · info@wikimasafari.com · +254 700 000 000</p>
        <p style="color:#6b5a30;font-size:11px;margin:6px 0 0">Ref: ${booking.reference}</p>
      </div>
    </div>
  `;
    const msg = {
        to: booking.guest_email,
        from: process.env.FROM_EMAIL,
        subject: `Booking Confirmed — ${booking.reference} | Wikima Safari`,
        html,
    };
    try {
        await mail_1.default.send(msg);
        console.log(`✅ Confirmation email sent to ${booking.guest_email}`);
    }
    catch (error) {
        // Log but don't throw — payment already succeeded, email is non-critical
        console.error("❌ Email send failed:", error);
    }
};
exports.sendConfirmationEmail = sendConfirmationEmail;
