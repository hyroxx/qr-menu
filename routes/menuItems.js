// routes/menuItems.js

const express = require('express');
const router = express.Router();
const db = require('../config/db');
const upload = require('../middleware/upload');
const path = require('path');

// Menü öğesi ekleme
router.post('/items', upload.single('photo'), (req, res) => {
  const { name, description, price, category_id, restoran_id, tags, allergens, available_from, available_to } = req.body;

  if (!name || !price || !category_id || !restoran_id || !allergens) {
    return res.status(400).json({ error: 'Zorunlu alanlar eksik.' });
  }

  const photo_url = req.file ? `/uploads/${req.file.filename}` : null;

  const sql = `
    INSERT INTO menu_items
    (name, description, price, category_id, restaurant_id, tags, allergens, available_from, available_to, photo_url)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `;

  db.query(sql, [name, description, price, category_id, restoran_id, tags, allergens, available_from, available_to, photo_url], (err, result) => {
    if (err) {
      console.error('Yemek eklenirken hata:', err);
      return res.status(500).json({ error: 'Sunucu hatası.' });
    }
    res.status(201).json({ message: 'Yemek başarıyla eklendi.' });
  });
});

// Menü listeleme (çok dilli destekli)
router.get('/items/:restaurant_id', (req, res) => {
  const { restaurant_id } = req.params;
  const { lang } = req.query;
  const currentTime = new Date().toTimeString().split(' ')[0];

  const sql = `
    SELECT 
      mi.id, 
      COALESCE(mt.name, mi.name) AS name,
      COALESCE(mt.description, mi.description) AS description,
      mi.price, mi.photo_url, mi.tags, mi.allergens
    FROM menu_items mi
    LEFT JOIN menu_item_translations mt 
      ON mi.id = mt.menu_item_id AND mt.language_code = ?
    WHERE mi.restaurant_id = ?
    AND (mi.available_from IS NULL OR mi.available_from <= ?)
    AND (mi.available_to IS NULL OR mi.available_to >= ?)
  `;

  db.query(sql, [lang || 'en', restaurant_id, currentTime, currentTime], (err, results) => {
    if (err) {
      console.error('Çok dilli menü çekilirken hata:', err);
      return res.status(500).json({ error: 'Sunucu hatası.' });
    }
    res.json(results);
  });
});

// Menü öğesi için çeviri ekleme
router.post('/items/translate', (req, res) => {
  const { menu_item_id, language_code, name, description } = req.body;

  if (!menu_item_id || !language_code || !name) {
    return res.status(400).json({ error: 'Zorunlu alanlar eksik.' });
  }

  const sql = `
    INSERT INTO menu_item_translations (menu_item_id, language_code, name, description)
    VALUES (?, ?, ?, ?)
    ON DUPLICATE KEY UPDATE name = VALUES(name), description = VALUES(description)
  `;

  db.query(sql, [menu_item_id, language_code, name, description], (err, result) => {
    if (err) {
      console.error('Çeviri eklenirken hata:', err);
      return res.status(500).json({ error: 'Sunucu hatası.' });
    }
    res.json({ message: 'Çeviri kaydedildi.' });
  });
});

module.exports = router;
