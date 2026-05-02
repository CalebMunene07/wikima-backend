// src/modules/payments/mpesa.service.ts
import axios from "axios";
import dotenv from "dotenv";

dotenv.config();

const DARAJA_BASE =
  process.env.MPESA_ENV === "production"
    ? "https://api.safaricom.co.ke"
    : "https://sandbox.safaricom.co.ke";

// ── 1. Get OAuth Token from Safaricom ──────────────────────────────────────
export async function getMpesaToken(): Promise<string> {
  const auth = Buffer.from(
    `${process.env.MPESA_CONSUMER_KEY}:${process.env.MPESA_CONSUMER_SECRET}`
  ).toString("base64");

  const { data } = await axios.get(
    `${DARAJA_BASE}/oauth/v1/generate?grant_type=client_credentials`,
    {
      headers: { Authorization: `Basic ${auth}` },
    }
  );

  return data.access_token;
}

// ── 2. Initiate STK Push (sends popup to user's phone) ────────────────────
export async function initiateStkPush({
  phone,
  amount,
  bookingRef,
}: {
  phone: string;
  amount: number;
  bookingRef: string;
}) {
  const token = await getMpesaToken();

  const timestamp = new Date()
    .toISOString()
    .replace(/[-T:.Z]/g, "")
    .slice(0, 14); // YYYYMMDDHHmmss

  const password = Buffer.from(
    `${process.env.MPESA_SHORTCODE}${process.env.MPESA_PASSKEY}${timestamp}`
  ).toString("base64");

  const { data } = await axios.post(
    `${DARAJA_BASE}/mpesa/stkpush/v1/processrequest`,
    {
      BusinessShortCode: process.env.MPESA_SHORTCODE,
      Password: password,
      Timestamp: timestamp,
      TransactionType: "CustomerPayBillOnline",
      Amount: Math.ceil(amount), // M-Pesa requires integer, no decimals
      PartyA: phone,             // format: 2547XXXXXXXX
      PartyB: process.env.MPESA_SHORTCODE,
      PhoneNumber: phone,
      CallBackURL: process.env.MPESA_CALLBACK_URL,
      AccountReference: bookingRef, // e.g. WS-A1B2C3
      TransactionDesc: "Wikima Safari Booking",
    },
    {
      headers: { Authorization: `Bearer ${token}` },
    }
  );

  return data;
  // returns: { CheckoutRequestID, MerchantRequestID, ResponseCode, ResponseDescription }
}

// ── 3. Query STK Push status (poll from frontend every 3 seconds) ──────────
export async function queryStkStatus(checkoutRequestId: string) {
  const token = await getMpesaToken();

  const timestamp = new Date()
    .toISOString()
    .replace(/[-T:.Z]/g, "")
    .slice(0, 14);

  const password = Buffer.from(
    `${process.env.MPESA_SHORTCODE}${process.env.MPESA_PASSKEY}${timestamp}`
  ).toString("base64");

  const { data } = await axios.post(
    `${DARAJA_BASE}/mpesa/stkpushquery/v1/query`,
    {
      BusinessShortCode: process.env.MPESA_SHORTCODE,
      Password: password,
      Timestamp: timestamp,
      CheckoutRequestID: checkoutRequestId,
    },
    {
      headers: { Authorization: `Bearer ${token}` },
    }
  );

  return data;
  // returns: { ResultCode: "0" means success, "1032" means cancelled by user }
}