// routes/users.js

const express = require('express');
const router = express.Router();
const db = require('../config/db');
const bcrypt = require('bcryptjs');

// Giriş
router.post('/login', (req, res) => {
  const { email, password } = req.body;

  const sql = 'SELECT * FROM restaurants WHERE email = ?';
  db.query(sql, [email], async (err, results) => {
    if (err) {
      console.error('❌ Giriş sırasında hata:', err);
      return res.status(500).json({ success: false, message: 'Sunucu hatası.' });
    }

    if (results.length === 0) {
      return res.status(401).json({ success: false, message: 'Kullanıcı bulunamadı.' });
    }

    const user = results[0];

    const passwordMatch = password === user.password; // bcrypt kullanılmazsa

    if (!passwordMatch) {
      return res.status(401).json({ success: false, message: 'Şifre hatalı.' });
    }

    // Oturumu başlat
    req.session.restoran_id = user.id;

    res.json({ success: true, restoran_id: user.id });
  });
});

// Oturum kontrolü
router.get('/check-session', (req, res) => {
  if (req.session.restoran_id) {
    res.json({ loggedIn: true, restoran_id: req.session.restoran_id });
  } else {
    res.json({ loggedIn: false });
  }
});

// Çıkış (logout)
router.post('/logout', (req, res) => {
  req.session.destroy();
  res.json({ success: true });
});

module.exports = router;
