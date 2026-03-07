"use strict";
// BACKEND — src/modules/payments/payments.routes.ts
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const express_2 = __importDefault(require("express"));
const payments_controller_1 = require("./payments.controller");
const router = (0, express_1.Router)();
// ── M-PESA routes ─────────────────────────────────────────────────────────
// Frontend calls this to start payment → sends STK Push to phone
router.post("/mpesa/stk-push", payments_controller_1.mpesaStkPush);
// Frontend polls this every 3 seconds to check payment status
router.get("/mpesa/status/:checkoutRequestId", payments_controller_1.mpesaStatus);
// Safaricom calls this automatically after user pays (or cancels)
// Must be publicly accessible — no auth middleware here
router.post("/mpesa/callback", payments_controller_1.mpesaCallback);
// ── STRIPE routes ─────────────────────────────────────────────────────────
// Frontend calls this to get a clientSecret for Stripe Elements
router.post("/stripe/create-intent", payments_controller_1.stripeCreateIntent);
// Stripe calls this after payment succeeds
// IMPORTANT: Must use express.raw() here — NOT express.json()
// This is why we register this route BEFORE express.json() in app.ts
router.post("/stripe/webhook", express_2.default.raw({ type: "application/json" }), payments_controller_1.stripeWebhook);
exports.default = router;
