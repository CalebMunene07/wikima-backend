"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
// src/modules/bookings/bookings.routes.ts
const express_1 = require("express");
const bookings_controller_1 = require("./bookings.controller");
const auth_1 = require("../../middleware/auth");
const router = (0, express_1.Router)();
router.post("/", bookings_controller_1.createBooking); // public
router.get("/ref/:ref", bookings_controller_1.getBookingByRef); // public (guest lookup)
router.get("/:id", bookings_controller_1.getBookingById); // public
router.get("/", auth_1.protect, auth_1.adminOnly, bookings_controller_1.getAllBookings); // admin only
router.patch("/:id/status", auth_1.protect, auth_1.adminOnly, bookings_controller_1.updateBookingStatus); // admin only
exports.default = router;
