const QRCode = require('qrcode');

const generateQRCode = async (url) => {
  try {
    const qr = await QRCode.toDataURL(url);
    return qr;
  } catch (err) {
    throw err;
  }
};

module.exports = generateQRCode;
