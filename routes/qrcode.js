const express = require('express');
const router = express.Router();
const generateQRCode = require('../utils/generateQR');

// Example: http://localhost:3000/qrcode/5/en
router.get('/:restaurant_id/:lang', async (req, res) => {
  const { restaurant_id, lang } = req.params;

  // Local development URL
  const baseUrl = 'http://localhost:3000/index.html';
  const fullUrl = `${baseUrl}?restoran_id=${restaurant_id}&lang=${lang}`;

  try {
    const qrDataUrl = await generateQRCode(fullUrl);

    // Send the QR code in an HTML response
    res.send(`
      <h2>QR Code for Restaurant ID ${restaurant_id} (${lang})</h2>
      <img src="${qrDataUrl}" alt="QR Code" />
      <p>This QR links to: <a href="${fullUrl}" target="_blank">${fullUrl}</a></p>
    `);
  } catch (err) {
    console.error('QR code generation error:', err);
    res.status(500).json({ error: 'Failed to generate QR code.' });
  }
});

module.exports = router;
