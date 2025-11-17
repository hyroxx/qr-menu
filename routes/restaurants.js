const express = require('express');
const router = express.Router();
const pool = require('../config/db');

router.get('/:slug', async (req, res) => {
  const { slug } = req.params;
  const lang = req.query.lang || 'en';

  try {
    const [restaurantRows] = await pool.query(
      `SELECT id, name, slug, logo_url, about_text, phone, address, 
              instagram_url, facebook_url, website_url, opening_hours 
       FROM restaurants WHERE slug = ? LIMIT 1`,
      [slug]
    );

    if (!restaurantRows || restaurantRows.length === 0) {
      return res.status(404).json({ error: 'restaurant_not_found', slug });
    }

    const restaurant = restaurantRows[0];

    const [categoryRows] = await pool.query(
      `SELECT c.id, c.restaurant_id, c.display_order,
              COALESCE(ct.name, c.name) AS name,
              ct.name AS translatedName
       FROM menu_categories c
       LEFT JOIN menu_category_translations ct
         ON ct.category_id = c.id AND ct.language_code = ?
       WHERE c.restaurant_id = ?
       ORDER BY c.display_order ASC, c.id ASC`,
      [lang, restaurant.id]
    );

    const [subcategoryRows] = await pool.query(
      `SELECT s.id, s.restaurant_id, s.category_id, s.display_order,
              COALESCE(st.name, s.name) AS name,
              st.name AS translatedName
       FROM menu_subcategories s
       LEFT JOIN menu_subcategory_translations st
         ON st.subcategory_id = s.id AND st.language_code = ?
       WHERE s.restaurant_id = ?
       ORDER BY s.display_order ASC, s.id ASC`,
      [lang, restaurant.id]
    );

    const [itemRows] = await pool.query(
      `SELECT i.id, i.restaurant_id, i.category_id, i.subcategory_id,
              i.price, i.currency, i.is_new, i.allergens, i.image_url,
              i.display_order, i.created_at,
              COALESCE(it.name, i.name) AS name,
              COALESCE(it.description, i.description) AS description,
              it.name AS translatedName,
              it.description AS translatedDescription
       FROM menu_items i
       LEFT JOIN menu_item_translations it
         ON it.menu_item_id = i.id AND it.language_code = ?
       WHERE i.restaurant_id = ?
       ORDER BY i.display_order ASC, i.id ASC`,
      [lang, restaurant.id]
    );

    res.json({
      restaurant,
      categories: categoryRows,
      subcategories: subcategoryRows,
      items: itemRows,
    });
  } catch (err) {
    console.error('❌ Restaurant error:', err);
    res.status(500).json({ error: 'server_error', detail: String(err) });
  }
});

module.exports = router;