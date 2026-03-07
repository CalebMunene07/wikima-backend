// src/modules/bookings/bookings.routes.ts
import { Router } from "express";
import {
  createBooking,
  getBookingById,
  getBookingByRef,
  getAllBookings,
  updateBookingStatus,
} from "./bookings.controller";
import { protect, adminOnly } from "../../middleware/auth";

const router = Router();

router.post("/",                createBooking);                        // public
router.get("/ref/:ref",         getBookingByRef);                      // public (guest lookup)
router.get("/:id",              getBookingById);                       // public
router.get("/",                 protect, adminOnly, getAllBookings);    // admin only
router.patch("/:id/status",     protect, adminOnly, updateBookingStatus); // admin only

export default router;