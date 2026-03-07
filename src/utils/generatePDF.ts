// src/utils/generatePDF.ts
import PDFDocument from "pdfkit";
import { Booking } from "../types";

export function generateInvoiceBuffer(booking: Booking): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ size: "A4", margin: 50 });
    const chunks: Buffer[] = [];

    doc.on("data",  (chunk) => chunks.push(chunk));
    doc.on("end",   () => resolve(Buffer.concat(chunks)));
    doc.on("error", reject);

    // Header
    doc.rect(0, 0, 595, 80).fill("#1a1208");
    doc.fillColor("#D4AF37").fontSize(22).font("Helvetica-Bold")
       .text("WIKIMA SAFARI", 50, 25);
    doc.fillColor("#c8a96e").fontSize(8).font("Helvetica")
       .text("Est. 2010 · Nairobi, Kenya", 50, 50);

    // Invoice title
    doc.fillColor("#ffffff").fontSize(14).font("Helvetica-Bold")
       .text("BOOKING INVOICE", 400, 30, { align: "right" });
    doc.fillColor("#b8a070").fontSize(8).font("Helvetica")
       .text(`Ref: ${booking.reference}`, 400, 50, { align: "right" })
       .text(`Date: ${new Date().toLocaleDateString("en-GB")}`, 400, 62, { align: "right" });

    // Body content
    doc.fillColor("#2a2520").fontSize(10).moveDown(4);

    const rows = [
      ["Guest Name",   booking.guest_name],
      ["Email",        booking.guest_email],
      ["Phone",        booking.guest_phone],
      ["Tour",         booking.tour_title],
      ["Travel Date",  new Date(booking.travel_date).toLocaleDateString("en-GB", { dateStyle: "long" })],
      ["Guests",       `${booking.guests}`],
      ["Package",      booking.package],
      ["Total Amount", `$${booking.total_amount}`],
      ["Deposit Due",  `$${booking.deposit_amount}`],
    ];

    let y = 110;
    rows.forEach(([label, value], i) => {
      if (i % 2 === 0) doc.rect(50, y - 4, 495, 18).fill("#f5f2ec");
      doc.fillColor("#6b6560").fontSize(9).font("Helvetica")
         .text(label, 58, y);
      doc.fillColor("#2a2520").font("Helvetica-Bold")
         .text(value, 220, y);
      y += 20;
    });

    // Totals band
    doc.rect(50, y + 10, 495, 30).fill("#1a1208");
    doc.fillColor("#D4AF37").fontSize(14).font("Helvetica-Bold")
       .text(`TOTAL: $${booking.total_amount}`, 58, y + 18);

    // Footer
    doc.rect(0, 762, 595, 80).fill("#1a1208");
    doc.fillColor("#9a7840").fontSize(8).font("Helvetica")
       .text("www.wikimasafari.com · info@wikimasafari.com · +254 700 000 000", 50, 780, { align: "center", width: 495 });

    doc.end();
  });
}