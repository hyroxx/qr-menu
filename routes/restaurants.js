// routes/restaurants.js
const express = require('express');
const router = express.Router();
const db = require('../config/db');

// GET /restaurant/:slug  (server.js hem /restaurant hem /restaurants altında mount ediyor)
router.get('/:slug', async (req, res) => {
  const { slug } = req.params;
  const lang = (req.query.lang || 'en').toLowerCase();

  try {
    // 1) Restaurant
    const [rRes] = await db.query(
      `SELECT id, slug, name, logo_url, about_text, phone, address,
              instagram_url, facebook_url, website_url, opening_hours
       FROM restaurants WHERE slug = ? LIMIT 1`,
      [slug]
    );
    if (!rRes || rRes.length === 0) {
      return res.status(404).json({ error: 'restaurant_not_found' });
    }
    const restaurant = rRes[0];

    // 2) Categories (with translation fallback)
    const [cRes] = await db.query(
      `SELECT c.id,
              COALESCE(ct.name, c.name) AS name,
              c.display_order
       FROM menu_categories c
       LEFT JOIN menu_category_translations ct
         ON ct.category_id = c.id AND ct.language_code = ?
       WHERE c.restaurant_id = ?
       ORDER BY c.display_order ASC, c.id ASC`,
      [lang, restaurant.id]
    );

    res.json({
      restaurant,
      categories: cRes
    });
  } catch (e) {
    console.error('❌ Restaurant fetch error:', e);
    res.status(500).json({ error: 'server_error', detail: String(e) });
  }
});

module.exports = router;
