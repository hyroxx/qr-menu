const QRCode = require('qrcode');
const path = require('path');
const fs = require('fs');
const db = require('../config/db');

async function generateQR(restaurantId) {
  try {
    // Veritabanından slug'ı al
    const [rows] = await db.promise().query(
      'SELECT slug FROM restaurants WHERE id = ?',
      [restaurantId]
    );

    if (rows.length === 0) {
      throw new Error('Slug bulunamadı.');
    }

    const slug = rows[0].slug;

    // Railway domain'iniz
    const baseUrl = 'https://web-production-9446f.up.railway.app';

    const fullUrl = `${baseUrl}/${slug}/menu`;

    const qrPath = path.join(__dirname, '../public/qr', `qr_${restaurantId}.png`);

    await QRCode.toFile(qrPath, fullUrl, {
      color: {
        dark: '#000000',
        light: '#ffffff',
      },
      width: 300,
    });

    return `/qr/qr_${restaurantId}.png`;
  } catch (err) {
    console.error('❌ QR kod üretme hatası:', err);
    throw err;
  }
}

module.exports = generateQR;
