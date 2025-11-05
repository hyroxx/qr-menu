const express = require('express');
const router = express.Router();
const db = require('../config/db');

/**
 * GET /menu/:slug
 * Query: lang=tr|en|es|fr (opsiyonel, default: en)
 * Dönen yapı: { restaurant, categories: [ {id,name,subcategories:[...] } ], items: [...] }
 */
router.get('/:slug', async (req, res) => {
  const lang = (req.query.lang || 'en').toLowerCase();
  const allowed = ['tr','en','es','fr'];
  const langSafe = allowed.includes(lang) ? lang : 'en';

  const conn = db; // mysql2 pool/connection
  const { slug } = req.params;

  try {
    // 1) Restoran bul
    const [restRows] = await conn.query(
      `SELECT id, name, slug, logo_url, about_text
       FROM restaurants
       WHERE slug = ? LIMIT 1`,
      [slug]
    );
    if (restRows.length === 0) {
      return res.status(404).json({ error: 'Restaurant not found' });
    }
    const restaurant = restRows[0];

    // 2) Kategoriler (çeviri + fallback)
    const [catRows] = await conn.query(
      `SELECT
          c.id,
          COALESCE(ct.name, c.name) AS name,
          c.display_order
       FROM menu_categories c
       LEFT JOIN menu_category_translations ct
         ON ct.category_id = c.id AND ct.language_code = ?
       WHERE c.restaurant_id = ?
       ORDER BY c.display_order ASC, c.id ASC`,
      [langSafe, restaurant.id]
    );

    // 3) Alt kategoriler (varsa)
    let subcatMap = {};
    const [subRows] = await conn.query(
      `SELECT
          sc.id,
          sc.category_id,
          COALESCE(sct.name, sc.name) AS name,
          sc.display_order
       FROM menu_subcategories sc
       LEFT JOIN menu_subcategory_translations sct
         ON sct.subcategory_id = sc.id AND sct.language_code = ?
       WHERE sc.restaurant_id = ?
       ORDER BY sc.display_order ASC, sc.id ASC`,
      [langSafe, restaurant.id]
    ).catch(() => [ [] ]); // tablo yoksa bozmasın

    if (subRows && subRows.length) {
      subRows.forEach(r => {
        if (!subcatMap[r.category_id]) subcatMap[r.category_id] = [];
        subcatMap[r.category_id].push({
          id: r.id,
          name: r.name,
          display_order: r.display_order
        });
      });
    }

    // 4) Ürünler (çeviri + fallback)
    const [itemRows] = await conn.query(
      `SELECT
          i.id,
          i.category_id,
          i.subcategory_id,
          COALESCE(it.name, i.name) AS name,
          COALESCE(it.description, i.description) AS description,
          i.price,
          i.currency,
          i.image_url,
          i.is_new,
          i.created_at,
          i.allergens
       FROM menu_items i
       LEFT JOIN menu_item_translations it
         ON it.menu_item_id = i.id AND it.language_code = ?
       WHERE i.restaurant_id = ?
       ORDER BY i.display_order ASC, i.id ASC`,
      [langSafe, restaurant.id]
    );

    // 5) Kategori ağacı oluştur
    const categories = catRows.map(c => ({
      id: c.id,
      name: c.name,
      display_order: c.display_order,
      subcategories: subcatMap[c.id] || []
    }));

    res.json({
      restaurant,
      lang: langSafe,
      categories,
      items: itemRows
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error', details: String(err) });
  }
});

module.exports = router;
