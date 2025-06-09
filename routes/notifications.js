const express = require('express');
const router = express.Router();
const db = require('../config/db');

// Belirli bir restoran için bildirimleri getir
router.get('/:restoran_id', (req, res) => {
  const restoranId = req.params.restoran_id;
  const sql = 'SELECT * FROM notifications WHERE restaurant_id = ? ORDER BY sent_at DESC';

  db.query(sql, [restoranId], (err, results) => {
    if (err) {
      console.error('Bildirim alma hatası:', err);
      res.status(500).json({ error: 'Bildirimler alınamadı' });
    } else {
      res.json(results);
    }
  });
});

module.exports = router;
  