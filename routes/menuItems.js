// routes/menuItems.js
const express = require('express');
const router = express.Router();
const db = require('../config/db');

// GET /menu?slug={slug}&lang=xx
router.get('/', async (req, res) => {
  const slug = req.query.slug;
  const lang = (req.query.lang || 'en').toLowerCase();

  if (!slug) return res.status(400).json({ error: 'missing_slug' });

  try {
    // 1) Restaurant
    const [rRes] = await db.query(
      `SELECT id, slug, name, logo_url
       FROM restaurants WHERE slug = ? LIMIT 1`,
      [slug]
    );
    if (!rRes || rRes.length === 0) {
      return res.status(404).json({ error: 'restaurant_not_found' });
    }
    const restaurant = rRes[0];

    // 2) Categories (translation fallback)
    const [catRes] = await db.query(
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

    // 3) Subcategories (translation fallback)
    const [subRes] = await db.query(
      `SELECT s.id, s.category_id,
              COALESCE(st.name, s.name) AS name,
              s.display_order
       FROM menu_subcategories s
       LEFT JOIN menu_subcategory_translations st
         ON st.subcategory_id = s.id AND st.language_code = ?
       WHERE s.restaurant_id = ?
       ORDER BY s.display_order ASC, s.id ASC`,
      [lang, restaurant.id]
    );

    // 4) Items (translation fallback)
    const [itemRes] = await db.query(
      `SELECT i.id, i.category_id, i.subcategory_id, i.price, i.currency,
              i.is_new, i.allergens, i.image_url, i.created_at,
              COALESCE(it.name, i.name) AS name,
              COALESCE(it.description, i.description) AS description
       FROM menu_items i
       LEFT JOIN menu_item_translations it
         ON it.menu_item_id = i.id AND it.language_code = ?
       WHERE i.restaurant_id = ?
       ORDER BY i.display_order ASC, i.id ASC`,
      [lang, restaurant.id]
    );

    // 5) Build maps for frontend
    const itemsByCat = {};
    const itemsBySub = {};
    for (const it of itemRes) {
      // default currency
      if (!it.currency) it.currency = 'EUR';

      if (!itemsByCat[it.category_id]) itemsByCat[it.category_id] = [];
      itemsByCat[it.category_id].push(it);

      if (it.subcategory_id) {
        if (!itemsBySub[it.subcategory_id]) itemsBySub[it.subcategory_id] = [];
        itemsBySub[it.subcategory_id].push(it);
      }
    }

    const subcategoriesByCat = {};
    for (const s of subRes) {
      if (!subcategoriesByCat[s.category_id]) subcategoriesByCat[s.category_id] = [];
      subcategoriesByCat[s.category_id].push(s);
    }

    res.json({
      restaurant,
      categories: catRes,
      subcategoriesByCat,
      itemsByCat,
      itemsBySub
    });
  } catch (e) {
    console.error('❌ Menu fetch error:', e);
    res.status(500).json({ error: 'server_error', detail: String(e) });
  }
});

module.exports = router;
