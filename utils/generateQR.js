const QRCode = require('qrcode');
const pool = require('../config/db');

async function generateQRCode(restaurantId) {
  try {
    const [rows] = await pool.query(
      'SELECT slug FROM restaurants WHERE id = ?',
      [restaurantId]
    );

    if (!rows || rows.length === 0) {
      throw new Error('Restaurant not found');
    }

    const slug = rows[0].slug;
    const baseUrl = process.env.BASE_URL || 'https://web-production-9446f.up.railway.app';
    const fullUrl = `${baseUrl}/${slug}`;

    const qrDataUrl = await QRCode.toDataURL(fullUrl, {
      color: { dark: '#000000', light: '#ffffff' },
      width: 300,
      margin: 2,
    });

    return qrDataUrl;
  } catch (err) {
    console.error('❌ QR generation error:', err);
    throw err;
  }
}

module.exports = generateQRCode;