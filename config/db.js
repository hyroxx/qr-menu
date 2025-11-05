// config/db.js
const mysql = require('mysql2/promise');
require('dotenv').config();

// 🌐 Railway / Local fark etmeden çalışacak şekilde tüm olasılıkları destekle
const host = process.env.MYSQLHOST || process.env.DB_HOST;
const port = Number(process.env.MYSQLPORT || process.env.DB_PORT || 3306);
const user = process.env.MYSQLUSER || process.env.DB_USER;
const password = process.env.MYSQLPASSWORD || process.env.DB_PASS;
const database = process.env.MYSQLDATABASE || process.env.DB_NAME;

// 🔍 Eksik environment variable varsa uyarı göster
if (!host || !user || !password || !database) {
  console.error('❌ Missing database configuration. Please check your environment variables.');
  console.error({
    MYSQLHOST: process.env.MYSQLHOST,
    MYSQLPORT: process.env.MYSQLPORT,
    MYSQLUSER: process.env.MYSQLUSER,
    MYSQLDATABASE: process.env.MYSQLDATABASE,
    DB_HOST: process.env.DB_HOST,
    DB_PORT: process.env.DB_PORT,
    DB_USER: process.env.DB_USER,
    DB_NAME: process.env.DB_NAME
  });
}

// ⚙️ Veritabanı bağlantı havuzu
const pool = mysql.createPool({
  host,
  port,
  user,
  password,
  database,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  connectTimeout: 15000, // 15 saniye bağlantı bekleme
  ssl: {
    rejectUnauthorized: false // Railway proxy self-signed sertifika kullandığı için
  }
});

// 🧪 Test bağlantısı (uykuya düşmesin diye)
(async () => {
  try {
    const connection = await pool.getConnection();
    console.log(`✅ MySQL connected successfully to ${host}:${port} / ${database}`);
    connection.release();
  } catch (err) {
    console.error('❌ MySQL connection failed:', err.message);
  }
})();

// ♻️ Keep-alive: Railway'de bağlantı düşmesin diye her 60 saniyede ping at
setInterval(async () => {
  try {
    await pool.query('SELECT 1');
  } catch (err) {
    console.error('⚠️ DB keep-alive error:', err.message);
  }
}, 60000);

module.exports = pool;
