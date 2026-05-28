// src/modules/payments/payments.routes.ts

import { Router } from "express";
import {
  mpesaStkPush,
  mpesaStatus,
  mpesaCallback,
  paystackInitialize,
  paystackVerify,
  paystackWebhook,
} from "./payments.controller";

const router = Router();

// ── M-PESA routes ─────────────────────────────────────────────────────────
router.post("/mpesa/stk-push", mpesaStkPush);
router.get("/mpesa/status/:checkoutRequestId", mpesaStatus);
router.post("/mpesa/callback", mpesaCallback);

// ── PAYSTACK routes ───────────────────────────────────────────────────────
router.post("/paystack/initialize", paystackInitialize);
router.get("/paystack/verify/:reference", paystackVerify);
router.post("/paystack/webhook", paystackWebhook);

export default router;
