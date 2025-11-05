// src/server.js
const path = require('path');
const express = require('express');
const cors = require('cors');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// DB
const db = require('../config/db');

// ROUTES
const menuItemsRoute = require('../routes/menuItems');
const restaurantsRoute = require('../routes/restaurants'); // ✅ DOĞRU OLAN BU


// MIDDLEWARES
app.use(cors({ origin: true, credentials: true }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// HEALTH CHECK
app.get('/healthz', async (req, res) => {
  try {
    await db.query('SELECT 1');
    res.json({ ok: true, db: 'up' });
  } catch (e) {
    console.error('healthz error:', e);
    res.status(500).json({ ok: false, db: 'down', error: String(e) });
  }
});

// STATIC
app.use(express.static(path.join(__dirname, '../public')));

// API ROUTES
app.use('/menu', menuItemsRoute);
app.use('/restaurant', restaurantsRoute);
app.use('/restaurants', restaurantsRoute);


// ROOT
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '../public/index.html'));
});

// CATCH-ALL (SPA)
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../public/index.html'));
});

// START
app.listen(PORT, () => {
  console.log(`✅ Server running on http://localhost:${PORT}`);
});
