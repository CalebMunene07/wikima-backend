// src/modules/auth/auth.routes.ts
import { Router } from "express";
import { register, login, getMe } from "./auth.controller";
import { protect } from "../../middleware/auth";

const router = Router();

router.post("/register", register);
router.post("/login",    login);
router.get("/me",        protect, getMe); // protected — needs JWT token

export default router;