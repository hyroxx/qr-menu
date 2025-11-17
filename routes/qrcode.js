const express = require('express');
const router = express.Router();
const generateQRCode = require('../utils/generateQR');

router.get('/:restaurantId', async (req, res) => {
  const restaurantId = parseInt(req.params.restaurantId);

  if (isNaN(restaurantId)) {
    return res.status(400).json({ error: 'Invalid restaurant ID' });
  }

  try {
    const qrDataUrl = await generateQRCode(restaurantId);
    res.json({ qrCode: qrDataUrl });
  } catch (err) {
    console.error('❌ QR error:', err);
    res.status(500).json({ error: 'Failed to generate QR code' });
  }
});

module.exports = router;