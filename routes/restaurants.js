// routes/restaurants.js
const express = require('express');
const router = express.Router();
const db = require('../config/db');

/**
 * @route GET /api/restaurant/:slug
 * @desc  Get restaurant info + translations by slug
 * örnek: /api/restaurant/cafe-eva?lang=es
 */
router.get('/:slug', async (req, res) => {
  const { slug } = req.params;
  const lang = req.query.lang || 'en';

  try {
    // 1️⃣ Restoran temel bilgilerini çek
    const [rows] = await db.promise().query(
      `SELECT id, name, cover_photo 
       FROM restaurants 
       WHERE slug = ? 
       LIMIT 1`,
      [slug]
    );

    if (rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Restaurant not found' });
    }

    const restaurant = rows[0];

    // 2️⃣ Dil çevirisini çek (tanıtım yazısı)
    const [transRows] = await db.promise().query(
      `SELECT about_text 
       FROM restaurant_translations 
       WHERE restaurant_id = ? AND language_code = ? 
       LIMIT 1`,
      [restaurant.id, lang]
    );

    if (transRows.length > 0) {
      restaurant.about_text = transRows[0].about_text;
    } else {
      // Dil çevirisi yoksa varsayılan boş string
      restaurant.about_text = '';
    }

    res.json({ success: true, restaurant });
  } catch (error) {
    console.error('❌ Restaurant fetch error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;
