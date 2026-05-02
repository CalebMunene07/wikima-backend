// BACKEND — src/modules/payments/payments.routes.ts

import { Router, Request, Response, NextFunction } from "express";
import express from "express";
import {
  mpesaStkPush,
  mpesaStatus,
  mpesaCallback,
  stripeCreateIntent,
  stripeWebhook,
} from "./payments.controller";

const router = Router();

// ── M-PESA routes ─────────────────────────────────────────────────────────

// Frontend calls this to start payment → sends STK Push to phone
router.post("/mpesa/stk-push", mpesaStkPush);

// Frontend polls this every 3 seconds to check payment status
router.get("/mpesa/status/:checkoutRequestId", mpesaStatus);

// Safaricom calls this automatically after user pays (or cancels)
// Must be publicly accessible — no auth middleware here
router.post("/mpesa/callback", mpesaCallback);

// ── STRIPE routes ─────────────────────────────────────────────────────────

// Frontend calls this to get a clientSecret for Stripe Elements
router.post("/stripe/create-intent", stripeCreateIntent);

// Stripe calls this after payment succeeds
// IMPORTANT: Must use express.raw() here — NOT express.json()
// This is why we register this route BEFORE express.json() in app.ts
router.post(
  "/stripe/webhook",
  express.raw({ type: "application/json" }),
  stripeWebhook
);

export default router;