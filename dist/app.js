"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const helmet_1 = __importDefault(require("helmet"));
const morgan_1 = __importDefault(require("morgan"));
const dotenv_1 = __importDefault(require("dotenv"));
const db_1 = require("./config/db");
const errorHandler_1 = require("./middleware/errorHandler");
// ── Route imports ──
const auth_routes_1 = __importDefault(require("./modules/auth/auth.routes"));
const tours_routes_1 = __importDefault(require("./modules/tours/tours.routes"));
const bookings_routes_1 = __importDefault(require("./modules/bookings/bookings.routes"));
const payments_routes_1 = __importDefault(require("./modules/payments/payments.routes"));
const newsletter_1 = __importDefault(require("./routes/newsletter")); // ← NEW
dotenv_1.default.config();
const app = (0, express_1.default)();
// ── Security & logging ──
app.use((0, helmet_1.default)());
app.use((0, morgan_1.default)("dev"));
// ── CORS ──
app.use((0, cors_1.default)({
    origin: [
        "http://localhost:3000",
        "https://wikima-frontend.onrender.com",
    ],
    credentials: true,
}));
// ── IMPORTANT: Stripe webhook needs raw body — must be BEFORE express.json() ──
app.use("/api/payments/stripe/webhook", express_1.default.raw({ type: "application/json" }));
// ── Body parsers ──
app.use(express_1.default.json());
app.use(express_1.default.urlencoded({ extended: true }));
// ── Health check ──
app.get("/health", (_req, res) => {
    res.status(200).json({
        status: "ok",
        service: "Wikima Safari API",
        timestamp: new Date().toISOString(),
    });
});
// ── Routes ──
app.use("/api/auth", auth_routes_1.default);
app.use("/api/tours", tours_routes_1.default);
app.use("/api/bookings", bookings_routes_1.default);
app.use("/api/payments", payments_routes_1.default);
app.use("/api/newsletter", newsletter_1.default); // ← NEW
// ── 404 handler ──
app.use((_req, res) => {
    res.status(404).json({ error: "Route not found" });
});
// ── Global error handler ──
app.use(errorHandler_1.errorHandler);
// ── Start server ──
const PORT = process.env.PORT || 5000;
const start = async () => {
    await (0, db_1.connectDB)();
    app.listen(PORT, () => {
        console.log(`🚀 Wikima API running on port ${PORT}`);
        console.log(`📋 Health check: http://localhost:${PORT}/health`);
    });
};
start();
exports.default = app;
