// config/db.js
const mysql = require('mysql2/promise');
require('dotenv').config();

// Hem MYSQL_* hem DB_* adlarını destekle
const host = process.env.MYSQLHOST || process.env.DB_HOST;
const port = Number(process.env.MYSQLPORT || process.env.DB_PORT || 3306);
const user = process.env.MYSQLUSER || process.env.DB_USER;
const password = process.env.MYSQLPASSWORD || process.env.DB_PASS;
const database = process.env.MYSQLDATABASE || process.env.DB_NAME;

// SSL davranışını env ile kontrol et (varsayılan: KAPALI)
const useSSL = String(process.env.MYSQL_SSL || '').toLowerCase() === 'true';

// Pool’u kur (önce seçilen SSL ile deneriz, olmazsa fallback’te SSL’siz deneriz)
function makePool(withSSL) {
  return mysql.createPool({
    host,
    port,
    user,
    password,
    database,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
    connectTimeout: 15000,
    ...(withSSL
      ? { ssl: { rejectUnauthorized: false } } // bazı proxy’lerde self-signed
      : {}),
  });
}

let pool = makePool(useSSL);

// İlk bağlanmayı dener; gerekirse fallback
(async () => {
  try {
    const c = await pool.getConnection();
    console.log(`✅ MySQL connected (${host}:${port}/${database}) SSL=${useSSL}`);
    c.release();
  } catch (err) {
    console.error('❌ First MySQL connect failed:', err.message);
    if (useSSL) {
      console.log('↪️ Retrying WITHOUT SSL…');
      try {
        pool = makePool(false);
        const c2 = await pool.getConnection();
        console.log(`✅ MySQL connected on fallback (${host}:${port}/${database}) SSL=false`);
        c2.release();
      } catch (err2) {
        console.error('⛔ Fallback connect failed:', err2.message);
      }
    }
  }
})();

// Keep-alive (uykuya düşmesin)
setInterval(async () => {
  try { await pool.query('SELECT 1'); }
  catch (e) { console.error('⚠️ DB keep-alive error:', e.message); }
}, 60_000);

module.exports = pool;
