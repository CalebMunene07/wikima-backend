"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const router = (0, express_1.Router)();
router.post("/subscribe", async (req, res) => {
    const { email, name } = req.body;
    if (!email)
        return res.status(400).json({ error: "Email is required" });
    try {
        const apiKey = process.env.SENDGRID_API_KEY;
        const fromEmail = process.env.FROM_EMAIL || "";
        const adminEmail = process.env.ADMIN_EMAIL || fromEmail;
        if (apiKey && apiKey !== "SG.your_sendgrid_api_key_here" && fromEmail) {
            const sgMail = (await Promise.resolve().then(() => __importStar(require("@sendgrid/mail")))).default;
            sgMail.setApiKey(apiKey);
            await sgMail.send({ to: adminEmail, from: fromEmail, subject: `New Subscriber — ${email}`, text: `Name: ${name || "N/A"}\nEmail: ${email}` });
            await sgMail.send({ to: email, from: fromEmail, subject: "Welcome to Wikima Safari! 🦁", text: `Hi ${name || "there"},\n\nThank you for joining Wikima Safari. Adventures await!\n\nSee you in the wild.` });
        }
        return res.status(200).json({ success: true, message: "Subscribed successfully" });
    }
    catch (error) {
        console.error("Newsletter error:", error);
        return res.status(500).json({ error: "Failed to process subscription" });
    }
});
exports.default = router;
