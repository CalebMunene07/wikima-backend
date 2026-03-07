"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
// src/modules/tours/tours.routes.ts
const express_1 = require("express");
const tours_controller_1 = require("./tours.controller");
const auth_1 = require("../../middleware/auth");
const router = (0, express_1.Router)();
router.get("/", tours_controller_1.getAllTours); // public
router.get("/:slug", tours_controller_1.getTourBySlug); // public
router.post("/", auth_1.protect, auth_1.adminOnly, tours_controller_1.createTour); // admin
router.put("/:id", auth_1.protect, auth_1.adminOnly, tours_controller_1.updateTour); // admin
router.delete("/:id", auth_1.protect, auth_1.adminOnly, tours_controller_1.deleteTour); // admin
exports.default = router;
