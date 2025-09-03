// src/server.js

const express = require('express');
const app = express();
const path = require('path');
const session = require('express-session');
const dotenv = require('dotenv');
const userRoutes = require('../routes/users');
const menuRoutes = require('../routes/menuItems');
const categoryRoutes = require('../routes/menuCategories');
const notificationRoutes = require('../routes/notifications');
const port = process.env.PORT || 3000;

dotenv.config();

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Session yapılandırması
app.use(session({
  secret: process.env.SESSION_SECRET || 'defaultsecret',
  resave: false,
  saveUninitialized: true,
  cookie: { secure: false } // local geliştirmede https yoksa false olmalı
}));

// Statik dosyalar
app.use(express.static(path.join(__dirname, '../public')));
app.use('/uploads', express.static(path.join(__dirname, '../public/uploads')));

// Rotalar
app.use('/users', userRoutes);
app.use('/menu', menuRoutes);
app.use('/categories', categoryRoutes);
app.use('/notifications', notificationRoutes);

// Ana sayfa
app.get('/', (req, res) => {
  res.send('Hoş Geldiniz! E2 Digital Solutions API çalışıyor!');
});

// Sunucuyu başlat
app.listen(port, '0.0.0.0', () => {
  console.log(`Server running on port ${port}`);
});
