"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateInvoiceBuffer = generateInvoiceBuffer;
// src/utils/generatePDF.ts
const pdfkit_1 = __importDefault(require("pdfkit"));
function generateInvoiceBuffer(booking) {
    return new Promise((resolve, reject) => {
        const doc = new pdfkit_1.default({ margin: 50 });
        const chunks = [];
        doc.on("data", (chunk) => chunks.push(chunk));
        doc.on("end", () => resolve(Buffer.concat(chunks)));
        doc.on("error", reject);
        const total = booking.total_amount || 0;
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
        if (booking.guest_phone)
            doc.text(`Phone:  ${booking.guest_phone}`);
        // ── Safari Details ──
        doc.moveDown(0.8);
        doc.fontSize(8).font("Helvetica-Bold").fillColor("#888").text("SAFARI DETAILS");
        doc.fillColor("#000").fontSize(11).font("Helvetica").moveDown(0.3);
        doc.text(`Tour:     ${booking.tour_title || "—"}`);
        doc.text(`Package:  ${booking.package || "—"}`);
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
