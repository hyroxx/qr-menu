// routes/menuCategories.js

const express = require('express');
const router = express.Router();
const db = require('../config/db');

// Kategori listeleme (restoran bazlı)
router.get('/:restaurant_id', (req, res) => {
  const { restaurant_id } = req.params;
  const sql = 'SELECT * FROM menu_categories WHERE restaurant_id = ?';
  db.query(sql, [restaurant_id], (err, results) => {
    if (err) {
      console.error('Kategori listelenirken hata:', err);
      return res.status(500).json({ error: 'Sunucu hatası.' });
    }
    res.json(results);
  });
});

// Kategori ekleme
router.post('/', (req, res) => {
  const { name, restaurant_id } = req.body;
  if (!name || !restaurant_id) {
    return res.status(400).json({ error: 'Kategori adı ve restoran ID zorunludur.' });
  }

  const sql = 'INSERT INTO menu_categories (name, restaurant_id) VALUES (?, ?)';
  db.query(sql, [name, restaurant_id], (err, result) => {
    if (err) {
      console.error('Kategori eklenirken hata:', err);
      return res.status(500).json({ error: 'Sunucu hatası.' });
    }
    res.status(201).json({ message: 'Kategori başarıyla eklendi.' });
  });
});

module.exports = router;
