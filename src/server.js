// src/server.js
const path = require('path');
const express = require('express');
const cors = require('cors');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// DB connection (mysql2 pool) – mevcut config/db.js dosyanı kullanıyoruz
const db = require('../config/db');

// Routes
const menuItemsRoute = require('../routes/menuItems');
const restaurantRoute = require('../routes/restaurants');
const migrateRoute = require('../routes/migrate'); // tek seferlik migration endpoint

// Middlewares
app.use(cors({ origin: true, credentials: true }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Healthcheck (DB testi dahil)
app.get('/healthz', async (req, res) => {
  try {
    await db.query('SELECT 1');
    res.json({ ok: true, db: 'up' });
  } catch (e) {
    console.error('healthz error:', e);
    res.status(500).json({ ok: false, db: 'down', error: String(e) });
  }
});

// Statik dosyalar (public)
app.use(express.static(path.join(__dirname, '../public')));

// API
app.use('/menu', menuItemsRoute);
app.use('/restaurant', restaurantRoute);

// 🔐 Tek seferlik migrate endpoint (token ile korunur)
app.use('/__migrate', migrateRoute);

// Root
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '../public/index.html'));
});

// SPA catch-all: /{slug} ve /{slug}/menu gibi tüm frontend URL’lerini index.html’e döndür
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../public/index.html'));
});

// Start
app.listen(PORT, () => {
  console.log(`✅ Server running on http://localhost:${PORT}`);
});
