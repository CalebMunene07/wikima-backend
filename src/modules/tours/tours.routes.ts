// src/modules/tours/tours.routes.ts
import { Router } from "express";
import {
  getAllTours,
  getTourBySlug,
  createTour,
  updateTour,
  deleteTour,
} from "./tours.controller";
import { protect, adminOnly } from "../../middleware/auth";

const router = Router();

router.get("/",          getAllTours);           // public
router.get("/:slug",     getTourBySlug);         // public
router.post("/",         protect, adminOnly, createTour);  // admin
router.put("/:id",       protect, adminOnly, updateTour);  // admin
router.delete("/:id",    protect, adminOnly, deleteTour);  // admin

export default router;