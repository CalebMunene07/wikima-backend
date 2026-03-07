"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getMe = exports.login = exports.register = void 0;
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const db_1 = require("../../config/db");
// ── Register ──────────────────────────────────────────────────
const register = async (req, res) => {
    const { name, email, phone, password } = req.body;
    if (!name || !email || !password) {
        return res.status(400).json({ error: "Name, email and password are required" });
    }
    try {
        // Check if email already exists
        const existing = await db_1.pool.query("SELECT id FROM users WHERE email = $1", [email]);
        if (existing.rows.length > 0) {
            return res.status(409).json({ error: "Email already registered" });
        }
        // Hash password
        const hashed = await bcryptjs_1.default.hash(password, 12);
        // Insert user
        const { rows } = await db_1.pool.query(`INSERT INTO users (name, email, phone, password)
       VALUES ($1, $2, $3, $4)
       RETURNING id, name, email, phone, role, created_at`, [name, email, phone || null, hashed]);
        const user = rows[0];
        // Sign JWT
        const token = jsonwebtoken_1.default.sign({ id: user.id, role: user.role }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRES_IN || "7d" });
        res.status(201).json({ token, user });
    }
    catch (error) {
        console.error("Register error:", error);
        res.status(500).json({ error: "Registration failed" });
    }
};
exports.register = register;
// ── Login ─────────────────────────────────────────────────────
const login = async (req, res) => {
    const { email, password } = req.body;
    if (!email || !password) {
        return res.status(400).json({ error: "Email and password are required" });
    }
    try {
        const { rows } = await db_1.pool.query("SELECT * FROM users WHERE email = $1", [email]);
        if (rows.length === 0) {
            return res.status(401).json({ error: "Invalid email or password" });
        }
        const user = rows[0];
        const isMatch = await bcryptjs_1.default.compare(password, user.password);
        if (!isMatch) {
            return res.status(401).json({ error: "Invalid email or password" });
        }
        const token = jsonwebtoken_1.default.sign({ id: user.id, role: user.role }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRES_IN || "7d" });
        // Don't return password hash
        const { password: _, ...safeUser } = user;
        res.json({ token, user: safeUser });
    }
    catch (error) {
        console.error("Login error:", error);
        res.status(500).json({ error: "Login failed" });
    }
};
exports.login = login;
// ── Get current user (protected) ──────────────────────────────
const getMe = async (req, res) => {
    try {
        const { rows } = await db_1.pool.query("SELECT id, name, email, phone, role, created_at FROM users WHERE id = $1", [req.user?.id]);
        if (rows.length === 0) {
            return res.status(404).json({ error: "User not found" });
        }
        res.json({ user: rows[0] });
    }
    catch (error) {
        console.error("GetMe error:", error);
        res.status(500).json({ error: "Could not fetch user" });
    }
};
exports.getMe = getMe;
