// routes/customerMenu.js
const express = require('express');
const router = express.Router();
const db = require('../config/db');

/**
 * 📌 GET /api/menu/:slug
 * Restoran menüsünü dil, kategori ve alt kategoriye göre döndürür
 * Örnek: /api/menu/cafe-eva?lang=tr&category=Vegan&subcategory=Starter
 */
router.get('/api/menu/:slug', async (req, res) => {
  const { slug } = req.params;
  const lang = req.query.lang || 'en';
  const category = req.query.category || null;
  const subcategory = req.query.subcategory || null;

  try {
    // 1️⃣ Restoran ID'sini al
    const [restaurantRows] = await db.query(
      'SELECT id FROM restaurants WHERE slug = ? LIMIT 1',
      [slug]
    );

    if (restaurantRows.length === 0) {
      return res.json({ success: false, error: 'Restaurant not found' });
    }

    const restaurantId = restaurantRows[0].id;

    // 2️⃣ Temel SQL
    let sql = `
      SELECT 
        mi.id,
        COALESCE(mt.translated_name, mi.name) AS name,
        COALESCE(mt.translated_description, mi.description) AS description,
        mi.price,
        mi.image AS photo_url,
        mi.allergens,
        mi.created_at,
        c.name AS category_name,
        sc.name AS subcategory_name
      FROM menu_items mi
      LEFT JOIN menu_item_translations mt 
        ON mi.id = mt.original_item_id AND mt.language_code = ?
      LEFT JOIN categories c
        ON mi.category_id = c.id
      LEFT JOIN sub_categories sc
        ON mi.sub_category_id = sc.id
      WHERE mi.restaurant_id = ?
    `;

    const params = [lang, restaurantId];

    // 3️⃣ Kategori filtresi
    if (category && category !== 'All') {
      sql += ` AND c.name = ?`;
      params.push(category);
    }

    // 4️⃣ Alt kategori filtresi
    if (subcategory) {
      sql += ` AND sc.name = ?`;
      params.push(subcategory);
    }

    sql += ` ORDER BY mi.id DESC`;

    // 5️⃣ Veriyi çek
    const [menuRows] = await db.query(sql, params);

    return res.json({
      success: true,
      menu: menuRows
    });

  } catch (error) {
    console.error('❌ Müşteri menüsü alınamadı:', error);
    return res.status(500).json({
      success: false,
      error: error.sqlMessage || 'Database error'
    });
  }
});

module.exports = router;
