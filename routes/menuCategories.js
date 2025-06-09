const express = require('express');
const router = express.Router();
const db = require('../config/db');

// Menü Kategorisi Ekleme
router.post('/addCategory', (req, res) => {
  const { restoran_id, name } = req.body;
  const sql = 'INSERT INTO menu_categories (restoran_id, name) VALUES (?, ?)';
  
  db.query(sql, [restoran_id, name], (err, result) => {
    if (err) {
      console.error('Hata:', err);
      res.status(500).send('Kategori eklenirken bir hata oluştu.');
    } else {
      res.send('Kategori başarıyla eklendi!');
    }
  });
});

module.exports = router;
