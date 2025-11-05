// routes/restaurants.js
const express = require("express");
const router = express.Router();

const { getPool } = require("../config/db");

/**
 * GET /restaurant/:slug
 * lang param: tr | en | es | fr (default en)
 * Dönen JSON:
 * {
 *   restaurant: {...},
 *   categories: [{ id, name, display_order }],
 *   subcategories: [{ id, category_id, name, display_order }],
 *   items: [{ id, category_id, subcategory_id, name, description, price, currency, is_new, allergens, image_url, created_at }]
 * }
 */
router.get("/:slug", async (req, res, next) => {
  const slug = req.params.slug;
  const lang = (req.query.lang || "en").toLowerCase();

  try {
    const pool = await getPool();

    // 1) Restoran
    const [restRows] = await pool.query(
      "SELECT id, name, slug, logo_url, about_text, phone, address, instagram_url, facebook_url, website_url, opening_hours FROM restaurants WHERE slug = ? LIMIT 1",
      [slug]
    );
    if (!restRows || restRows.length === 0) {
      return res.status(404).json({ error: "restaurant_not_found", slug });
    }
    const restaurant = restRows[0];

    // 2) Kategoriler (çeviri ile)
    const [catRows] = await pool.query(
      `
      SELECT
        c.id,
        COALESCE(ct.name, c.name) AS name,
        c.display_order
      FROM menu_categories c
      LEFT JOIN menu_category_translations ct
        ON ct.category_id = c.id AND ct.language_code = ?
      WHERE c.restaurant_id = ?
      ORDER BY c.display_order ASC, c.id ASC
      `,
      [lang, restaurant.id]
    );

    // 3) Alt kategoriler (çeviri ile) — yoksa boş liste döner
    let subcatRows = [];
    try {
      const [rows] = await pool.query(
        `
        SELECT
          s.id,
          s.category_id,
          COALESCE(sct.name, s.name) AS name,
          s.display_order
        FROM menu_subcategories s
        LEFT JOIN menu_subcategory_translations sct
          ON sct.subcategory_id = s.id AND sct.language_code = ?
        WHERE s.restaurant_id = ?
        ORDER BY s.display_order ASC, s.id ASC
        `,
        [lang, restaurant.id]
      );
      subcatRows = rows;
    } catch (_) {
      subcatRows = [];
    }

    // 4) Ürünler (çeviri ile)
    const [itemRows] = await pool.query(
      `
      SELECT
        i.id,
        i.category_id,
        i.subcategory_id,
        COALESCE(it.name, i.name) AS name,
        COALESCE(it.description, i.description) AS description,
        i.price,
        i.currency,
        i.is_new,
        i.allergens,
        COALESCE(i.image_url, i.image) AS image_url,
        i.created_at
      FROM menu_items i
      LEFT JOIN menu_item_translations it
        ON it.menu_item_id = i.id AND it.language_code = ?
      WHERE i.restaurant_id = ?
      ORDER BY COALESCE(i.display_order, 0) ASC, i.id ASC

      `,
      [lang, restaurant.id]
    );

    return res.json({
      restaurant,
      categories: catRows,
      subcategories: subcatRows,
      items: itemRows,
    });
  } catch (err) {
    console.error("❌ Restaurant fetch error:", err);
    return res.status(500).json({ error: "server_error", detail: String(err) });
  }
});

module.exports = router;
