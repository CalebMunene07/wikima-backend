// src/utils/generatePDF.ts
import PDFDocument from "pdfkit";

// Inline type — no external import needed
interface Booking {
  id: string;
  reference: string;
  guest_name: string;
  guest_email: string;
  guest_phone?: string;
  tour_title?: string;
  travel_date?: string;
  guests?: number;
  package?: string;
  total_amount?: number;
  deposit_amount?: number;
  special_requests?: string;
  status?: string;
  created_at?: string;
}

export function generateInvoiceBuffer(booking: Booking): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ margin: 50 });
    const chunks: Buffer[] = [];

    doc.on("data", (chunk: Buffer) => chunks.push(chunk));
    doc.on("end", () => resolve(Buffer.concat(chunks)));
    doc.on("error", reject);

    const total   = booking.total_amount   || 0;
    const deposit = booking.deposit_amount || 0;
    const balance = total - deposit;

    // ── Header ──
    doc.fontSize(22).font("Helvetica-Bold").text("WIKIMA SAFARI", 50, 50);
    doc.fontSize(9).font("Helvetica").fillColor("#888").text("EXPEDITIONS · EAST AFRICA", 50, 76);
    doc.fillColor("#000");

    doc.fontSize(11).font("Helvetica-Bold").text("BOOKING CONFIRMATION", 350, 50, { align: "right" });
    doc.fontSize(14).fillColor("#4B5320").text(booking.reference || "—", 350, 68, { align: "right" });
    doc.fillColor("#000");

    doc.moveTo(50, 100).lineTo(550, 100).strokeColor("#e0d8cc").stroke();

    // ── Guest Details ──
    doc.y = 115;
    doc.fontSize(8).font("Helvetica-Bold").fillColor("#888").text("GUEST DETAILS", 50);
    doc.fillColor("#000").fontSize(11).font("Helvetica").moveDown(0.3);
    doc.text(`Name:   ${booking.guest_name || "—"}`);
    doc.text(`Email:  ${booking.guest_email || "—"}`);
    if (booking.guest_phone) doc.text(`Phone:  ${booking.guest_phone}`);

    // ── Safari Details ──
    doc.moveDown(0.8);
    doc.fontSize(8).font("Helvetica-Bold").fillColor("#888").text("SAFARI DETAILS");
    doc.fillColor("#000").fontSize(11).font("Helvetica").moveDown(0.3);
    doc.text(`Tour:     ${booking.tour_title || "—"}`);
    doc.text(`Package:  ${booking.package   || "—"}`);
    doc.text(`Date:     ${booking.travel_date ? new Date(booking.travel_date).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" }) : "—"}`);
    doc.text(`Guests:   ${booking.guests || 1}`);

    // ── Payment Summary ──
    doc.moveDown(0.8);
    doc.fontSize(8).font("Helvetica-Bold").fillColor("#888").text("PAYMENT SUMMARY");
    doc.fillColor("#000").fontSize(11).font("Helvetica").moveDown(0.3);
    doc.text(`Tour Total:       $${total.toLocaleString()}`);
    doc.text(`Deposit Paid:     $${deposit.toLocaleString()}`);
    doc.text(`Remaining Balance: $${balance.toLocaleString()}`);

    // ── Footer ──
    doc.moveTo(50, 680).lineTo(550, 680).strokeColor("#e0d8cc").stroke();
    doc.fontSize(9).fillColor("#888").text("Wikima Safari Expeditions · info@wikimasafari.com · wikimasafari.com", 50, 690, { align: "center" });

    doc.end();
  });
}