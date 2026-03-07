"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.queryStkStatus = exports.initiateStkPush = exports.getMpesaToken = void 0;
// src/modules/payments/mpesa.service.ts
const axios_1 = __importDefault(require("axios"));
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
const DARAJA_BASE = process.env.MPESA_ENV === "production"
    ? "https://api.safaricom.co.ke"
    : "https://sandbox.safaricom.co.ke";
// ── 1. Get OAuth Token from Safaricom ──────────────────────────────────────
async function getMpesaToken() {
    const auth = Buffer.from(`${process.env.MPESA_CONSUMER_KEY}:${process.env.MPESA_CONSUMER_SECRET}`).toString("base64");
    const { data } = await axios_1.default.get(`${DARAJA_BASE}/oauth/v1/generate?grant_type=client_credentials`, {
        headers: { Authorization: `Basic ${auth}` },
    });
    return data.access_token;
}
exports.getMpesaToken = getMpesaToken;
// ── 2. Initiate STK Push (sends popup to user's phone) ────────────────────
async function initiateStkPush({ phone, amount, bookingRef, }) {
    const token = await getMpesaToken();
    const timestamp = new Date()
        .toISOString()
        .replace(/[-T:.Z]/g, "")
        .slice(0, 14); // YYYYMMDDHHmmss
    const password = Buffer.from(`${process.env.MPESA_SHORTCODE}${process.env.MPESA_PASSKEY}${timestamp}`).toString("base64");
    const { data } = await axios_1.default.post(`${DARAJA_BASE}/mpesa/stkpush/v1/processrequest`, {
        BusinessShortCode: process.env.MPESA_SHORTCODE,
        Password: password,
        Timestamp: timestamp,
        TransactionType: "CustomerPayBillOnline",
        Amount: Math.ceil(amount),
        PartyA: phone,
        PartyB: process.env.MPESA_SHORTCODE,
        PhoneNumber: phone,
        CallBackURL: process.env.MPESA_CALLBACK_URL,
        AccountReference: bookingRef,
        TransactionDesc: "Wikima Safari Booking",
    }, {
        headers: { Authorization: `Bearer ${token}` },
    });
    return data;
    // returns: { CheckoutRequestID, MerchantRequestID, ResponseCode, ResponseDescription }
}
exports.initiateStkPush = initiateStkPush;
// ── 3. Query STK Push status (poll from frontend every 3 seconds) ──────────
async function queryStkStatus(checkoutRequestId) {
    const token = await getMpesaToken();
    const timestamp = new Date()
        .toISOString()
        .replace(/[-T:.Z]/g, "")
        .slice(0, 14);
    const password = Buffer.from(`${process.env.MPESA_SHORTCODE}${process.env.MPESA_PASSKEY}${timestamp}`).toString("base64");
    const { data } = await axios_1.default.post(`${DARAJA_BASE}/mpesa/stkpushquery/v1/query`, {
        BusinessShortCode: process.env.MPESA_SHORTCODE,
        Password: password,
        Timestamp: timestamp,
        CheckoutRequestID: checkoutRequestId,
    }, {
        headers: { Authorization: `Bearer ${token}` },
    });
    return data;
    // returns: { ResultCode: "0" means success, "1032" means cancelled by user }
}
exports.queryStkStatus = queryStkStatus;
