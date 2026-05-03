// 1. LOAD ENV FIRST
import dotenv from "dotenv";
dotenv.config();

// 2. CHECK ENV IMMEDIATELY
if (!process.env.DATABASE_URL) {
  console.error("❌ ERROR: DATABASE_URL is undefined. The app will crash.");
}

import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import { connectDB } from "./config/db";
import { errorHandler } from "./middleware/errorHandler";

// ── Route imports ──
import authRoutes       from "./modules/auth/auth.routes";
import tourRoutes       from "./modules/tours/tours.routes";
import bookingRoutes    from "./modules/bookings/bookings.routes";
import paymentRoutes    from "./modules/payments/payments.routes";
import newsletterRoutes from "./routes/newsletter";

const app = express();

app.use(helmet());
app.use(morgan("dev"));

// ── CORS ──
app.use(cors({
  origin: (origin, callback) => {
    if (!origin) return callback(null, true);

    const allowed = [
      "http://localhost:3000",
      "http://localhost:3001",
      "https://wikima.pages.dev",
      "https://wikimasafari.com",
      "https://www.wikimasafari.com",
    ];

    const isCloudflarePreview = origin.endsWith(".wikima.pages.dev");

    if (allowed.includes(origin) || isCloudflarePreview) {
      callback(null, true);
    } else {
      callback(new Error(`CORS blocked: ${origin}`));
    }
  },
  credentials: true,
}));

app.use(
  "/api/payments/stripe/webhook",
  express.raw({ type: "application/json" })
);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.get("/health", (_req, res) => {
  res.status(200).json({
    status: "ok",
    service: "Wikima Safari API",
    timestamp: new Date().toISOString(),
  });
});

app.use("/api/auth",       authRoutes);
app.use("/api/tours",      tourRoutes);
app.use("/api/bookings",   bookingRoutes);
app.use("/api/payments",   paymentRoutes);
app.use("/api/newsletter", newsletterRoutes);

app.use((_req, res) => {
  res.status(404).json({ error: "Route not found" });
});

app.use(errorHandler);

const PORT = process.env.PORT || 5000;

const start = async () => {
  try {
    await connectDB();
    app.listen(PORT, () => {
      console.log(`🚀 Wikima API running on port ${PORT}`);
    });
  } catch (error) {
    console.error("Failed to start server:", error);
    process.exit(1);
  }
};

start();
export default app;
