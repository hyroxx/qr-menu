const express = require('express');
const router = express.Router();
const db = require('../config/db');

// Giriş (login) route
router.post('/login', async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ success: false, message: 'Email ve şifre gerekli.' });
  }

  try {
    const [results] = await db.promise().query(
      'SELECT restoran_id FROM users WHERE email = ? AND password = ?',
      [email, password]
    );

    if (results.length > 0) {
      res.json({ success: true, restoran_id: results[0].restoran_id });
    } else {
      res.json({ success: false, message: 'Email veya şifre yanlış.' });
    }
  } catch (error) {
    console.error('Login Error:', error);
    res.status(500).json({ success: false, message: 'Sunucu hatası.' });
  }
});

module.exports = router;
