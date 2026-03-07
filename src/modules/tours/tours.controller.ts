// src/modules/tours/tours.controller.ts
import { Request, Response } from "express";
import { pool } from "../../config/db";

// ── GET all active tours ───────────────────────────────────────
export const getAllTours = async (_req: Request, res: Response) => {
  try {
    const { rows } = await pool.query(
      `SELECT id, slug, title, location, duration, description,
              image_url, standard_price, premium_price, luxury_price
       FROM tours
       WHERE is_active = true
       ORDER BY created_at DESC`
    );
    res.json({ tours: rows });
  } catch (error) {
    console.error("GetAllTours error:", error);
    res.status(500).json({ error: "Could not fetch tours" });
  }
};

// ── GET single tour by slug ────────────────────────────────────
export const getTourBySlug = async (req: Request, res: Response) => {
  try {
    const { rows } = await pool.query(
      "SELECT * FROM tours WHERE slug = $1 AND is_active = true",
      [req.params.slug]
    );

    if (rows.length === 0) {
      return res.status(404).json({ error: "Tour not found" });
    }

    res.json({ tour: rows[0] });
  } catch (error) {
    console.error("GetTourBySlug error:", error);
    res.status(500).json({ error: "Could not fetch tour" });
  }
};

// ── POST create tour (admin) ───────────────────────────────────
export const createTour = async (req: Request, res: Response) => {
  const {
    slug, title, location, duration, description,
    longDescription, imageUrl,
    standardPrice, premiumPrice, luxuryPrice,
  } = req.body;

  if (!slug || !title || !standardPrice || !premiumPrice || !luxuryPrice) {
    return res.status(400).json({ error: "slug, title and all prices are required" });
  }

  try {
    const { rows } = await pool.query(
      `INSERT INTO tours
        (slug, title, location, duration, description, long_description,
         image_url, standard_price, premium_price, luxury_price)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)
       RETURNING *`,
      [
        slug, title, location, duration, description,
        longDescription, imageUrl,
        standardPrice, premiumPrice, luxuryPrice,
      ]
    );
    res.status(201).json({ tour: rows[0] });
  } catch (error) {
    console.error("CreateTour error:", error);
    res.status(500).json({ error: "Could not create tour" });
  }
};

// ── PUT update tour (admin) ────────────────────────────────────
export const updateTour = async (req: Request, res: Response) => {
  const { id } = req.params;
  const {
    title, location, duration, description,
    longDescription, imageUrl,
    standardPrice, premiumPrice, luxuryPrice, isActive,
  } = req.body;

  try {
    const { rows } = await pool.query(
      `UPDATE tours SET
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
       RETURNING *`,
      [
        title, location, duration, description,
        longDescription, imageUrl,
        standardPrice, premiumPrice, luxuryPrice,
        isActive, id,
      ]
    );

    if (rows.length === 0) {
      return res.status(404).json({ error: "Tour not found" });
    }

    res.json({ tour: rows[0] });
  } catch (error) {
    console.error("UpdateTour error:", error);
    res.status(500).json({ error: "Could not update tour" });
  }
};

// ── DELETE tour (admin — soft delete) ─────────────────────────
export const deleteTour = async (req: Request, res: Response) => {
  try {
    const { rows } = await pool.query(
      "UPDATE tours SET is_active = false WHERE id = $1 RETURNING id, title",
      [req.params.id]
    );

    if (rows.length === 0) {
      return res.status(404).json({ error: "Tour not found" });
    }

    res.json({ message: `Tour "${rows[0].title}" deactivated successfully` });
  } catch (error) {
    console.error("DeleteTour error:", error);
    res.status(500).json({ error: "Could not delete tour" });
  }
};