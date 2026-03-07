"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteTour = exports.updateTour = exports.createTour = exports.getTourBySlug = exports.getAllTours = void 0;
const db_1 = require("../../config/db");
// ── GET all active tours ───────────────────────────────────────
const getAllTours = async (_req, res) => {
    try {
        const { rows } = await db_1.pool.query(`SELECT id, slug, title, location, duration, description,
              image_url, standard_price, premium_price, luxury_price
       FROM tours
       WHERE is_active = true
       ORDER BY created_at DESC`);
        res.json({ tours: rows });
    }
    catch (error) {
        console.error("GetAllTours error:", error);
        res.status(500).json({ error: "Could not fetch tours" });
    }
};
exports.getAllTours = getAllTours;
// ── GET single tour by slug ────────────────────────────────────
const getTourBySlug = async (req, res) => {
    try {
        const { rows } = await db_1.pool.query("SELECT * FROM tours WHERE slug = $1 AND is_active = true", [req.params.slug]);
        if (rows.length === 0) {
            return res.status(404).json({ error: "Tour not found" });
        }
        res.json({ tour: rows[0] });
    }
    catch (error) {
        console.error("GetTourBySlug error:", error);
        res.status(500).json({ error: "Could not fetch tour" });
    }
};
exports.getTourBySlug = getTourBySlug;
// ── POST create tour (admin) ───────────────────────────────────
const createTour = async (req, res) => {
    const { slug, title, location, duration, description, longDescription, imageUrl, standardPrice, premiumPrice, luxuryPrice, } = req.body;
    if (!slug || !title || !standardPrice || !premiumPrice || !luxuryPrice) {
        return res.status(400).json({ error: "slug, title and all prices are required" });
    }
    try {
        const { rows } = await db_1.pool.query(`INSERT INTO tours
        (slug, title, location, duration, description, long_description,
         image_url, standard_price, premium_price, luxury_price)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)
       RETURNING *`, [
            slug, title, location, duration, description,
            longDescription, imageUrl,
            standardPrice, premiumPrice, luxuryPrice,
        ]);
        res.status(201).json({ tour: rows[0] });
    }
    catch (error) {
        console.error("CreateTour error:", error);
        res.status(500).json({ error: "Could not create tour" });
    }
};
exports.createTour = createTour;
// ── PUT update tour (admin) ────────────────────────────────────
const updateTour = async (req, res) => {
    const { id } = req.params;
    const { title, location, duration, description, longDescription, imageUrl, standardPrice, premiumPrice, luxuryPrice, isActive, } = req.body;
    try {
        const { rows } = await db_1.pool.query(`UPDATE tours SET
        title            = COALESCE($1, title),
        location         = COALESCE($2, location),
        duration         = COALESCE($3, duration),
        description      = COALESCE($4, description),
        long_description = COALESCE($5, long_description),
        image_url        = COALESCE($6, image_url),
        standard_price   = COALESCE($7, standard_price),
        premium_price    = COALESCE($8, premium_price),
        luxury_price     = COALESCE($9, luxury_price),
        is_active        = COALESCE($10, is_active)
       WHERE id = $11
       RETURNING *`, [
            title, location, duration, description,
            longDescription, imageUrl,
            standardPrice, premiumPrice, luxuryPrice,
            isActive, id,
        ]);
        if (rows.length === 0) {
            return res.status(404).json({ error: "Tour not found" });
        }
        res.json({ tour: rows[0] });
    }
    catch (error) {
        console.error("UpdateTour error:", error);
        res.status(500).json({ error: "Could not update tour" });
    }
};
exports.updateTour = updateTour;
// ── DELETE tour (admin — soft delete) ─────────────────────────
const deleteTour = async (req, res) => {
    try {
        const { rows } = await db_1.pool.query("UPDATE tours SET is_active = false WHERE id = $1 RETURNING id, title", [req.params.id]);
        if (rows.length === 0) {
            return res.status(404).json({ error: "Tour not found" });
        }
        res.json({ message: `Tour "${rows[0].title}" deactivated successfully` });
    }
    catch (error) {
        console.error("DeleteTour error:", error);
        res.status(500).json({ error: "Could not delete tour" });
    }
};
exports.deleteTour = deleteTour;
