import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import dotenv from "dotenv";
import { connectDB } from "./config/db";
import { errorHandler } from "./middleware/errorHandler";

// ── Route imports ──
import authRoutes       from "./modules/auth/auth.routes";
import tourRoutes       from "./modules/tours/tours.routes";
import bookingRoutes    from "./modules/bookings/bookings.routes";
import paymentRoutes    from "./modules/payments/payments.routes";
import newsletterRoutes from "./routes/newsletter";   // ← NEW

dotenv.config();

const app = express();

// ── Security & logging ──
app.use(helmet());
app.use(morgan("dev"));

// ── CORS ──
app.use(
  cors({
    origin: [
      "http://localhost:3000",
       "https://wikima-frontend.onrender.com",
      "https://my-tours-app.onrender.com",  
    ],
    credentials: true,
  })
);

// ── IMPORTANT: Stripe webhook needs raw body — must be BEFORE express.json() ──
app.use(
  "/api/payments/stripe/webhook",
  express.raw({ type: "application/json" })
);

// ── Body parsers ──
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ── Health check ──
app.get("/health", (_req, res) => {
  res.status(200).json({
    status: "ok",
    service: "Wikima Safari API",
    timestamp: new Date().toISOString(),
  });
});

// ── Routes ──
app.use("/api/auth",       authRoutes);
app.use("/api/tours",      tourRoutes);
app.use("/api/bookings",   bookingRoutes);
app.use("/api/payments",   paymentRoutes);
app.use("/api/newsletter", newsletterRoutes);   // ← NEW

// ── 404 handler ──
app.use((_req, res) => {
  res.status(404).json({ error: "Route not found" });
});

// ── Global error handler ──
app.use(errorHandler);

// ── Start server ──
const PORT = process.env.PORT || 5000;
const start = async () => {
  await connectDB();
  app.listen(PORT, () => {
    console.log(`🚀 Wikima API running on port ${PORT}`);
    console.log(`📋 Health check: http://localhost:${PORT}/health`);
  });
};
start();

export default app;
