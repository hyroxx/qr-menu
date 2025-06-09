const express = require('express');
const router = express.Router();
const db = require('../config/db');

// Menü Öğesi Ekleme
router.post('/addItem', (req, res) => {
  const { restoran_id, category_id, sub_category_id, name, description, price, photo_url } = req.body;

  const sql = `
    INSERT INTO menu_items
    (restoran_id, category_id, sub_category_id, name, description, price, photo_url)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `;

  db.query(sql, [restoran_id, category_id, sub_category_id, name, description, price, photo_url], (err, result) => {
    if (err) {
      console.error('Hata:', err);
      return res.status(500).send('Menü öğesi eklenemedi.');
    }
    res.send('Menü öğesi başarıyla eklendi!');
  });
});

// ✅ Menü Listeleme (GET /menu/items/:restoran_id)
router.get('/items/:restoran_id', (req, res) => {
  const restoranId = req.params.restoran_id;

  const query = 'SELECT * FROM menu_items WHERE restoran_id = ?';
  db.query(query, [restoranId], (err, results) => {
    if (err) {
      console.error('Menü alma hatası:', err);
      return res.status(500).json({ error: 'Menü verisi alınamadı' });
    }

    res.json(results);
  });
});

module.exports = router;
  