// config/db.js
const mysql = require('mysql2/promise');
require('dotenv').config();

/**
 * Env kaynakları (hem MYSQL_* hem DB_* hem de INTERNAL varyantlar)
 */
const PRIMARY = {
  host: process.env.MYSQLHOST || process.env.DB_HOST,
  port: Number(process.env.MYSQLPORT || process.env.DB_PORT || 3306),
  user: process.env.MYSQLUSER || process.env.DB_USER,
  password: process.env.MYSQLPASSWORD || process.env.DB_PASS,
  database: process.env.MYSQLDATABASE || process.env.DB_NAME,
};

const INTERNAL = {
  host:
    process.env.MYSQLHOST_INTERNAL ||
    process.env.DB_INTERNAL_HOST ||
    process.env.DB_HOST_INTERNAL ||
    process.env.INTERNAL_DB_HOST ||
    null,
  port: Number(
    process.env.MYSQLPORT_INTERNAL ||
      process.env.DB_INTERNAL_PORT ||
      process.env.DB_PORT_INTERNAL ||
      process.env.INTERNAL_DB_PORT ||
      PRIMARY.port
  ),
  user: PRIMARY.user,
  password: PRIMARY.password,
  database: PRIMARY.database,
};

// Railway bazı projelerde bağlantı stringi de verir (opsiyonel)
const URL =
  process.env.MYSQL_URL ||
  process.env.DATABASE_URL ||
  process.env.DB_URL ||
  null;

// Kullanıcı isterse SSL’i zorlayabilsin
const FORCE_SSL =
  String(process.env.MYSQL_SSL || '').toLowerCase() === 'true' ? true : null; // null: otomatik

function makePool(cfg, sslEnabled) {
  const base = {
    host: cfg.host,
    port: Number(cfg.port || 3306),
    user: cfg.user,
    password: cfg.password,
    database: cfg.database,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
    connectTimeout: 12_000,
  };
  if (sslEnabled) base.ssl = { rejectUnauthorized: false };
  return mysql.createPool(base);
}

/**
 * Denenecek kombinasyonlar:
 * 1) PRIMARY host (env’de verdiğin)  + SSL=false, ardından SSL=true
 * 2) INTERNAL host (varsa)           + SSL=false, ardından SSL=true
 * (FORCE_SSL=true ise önce SSL=true dener, sonra false)
 */
const plans = [];
function pushPlan(cfg) {
  if (!cfg.host || !cfg.user || !cfg.password || !cfg.database) return;
  const order = FORCE_SSL === true ? [true, false] : FORCE_SSL === false ? [false, true] : [false, true];
  for (const ssl of order) plans.push({ cfg, ssl });
}
pushPlan(PRIMARY);
pushPlan(INTERNAL);

// Eğer URL varsa en sona bir de onu ekle (mysql2 URL’i otomatik çözer)
if (URL) {
  plans.push({ url: URL });
}

/**
 * Sırayla dener, başarılı olan pool’u export eder
 */
let pool;
async function tryConnect() {
  const errors = [];
  for (const p of plans) {
    try {
      if (p.url) {
        // URL tabanlı
        pool = mysql.createPool(p.url);
        const c = await pool.getConnection();
        console.log(`✅ MySQL connected via URL`);
        c.release();
        return pool;
      } else {
        pool = makePool(p.cfg, p.ssl);
        const c = await pool.getConnection();
        console.log(
          `✅ MySQL connected to ${p.cfg.host}:${p.cfg.port}/${p.cfg.database} SSL=${p.ssl ? 'true' : 'false'}`
        );
        c.release();
        return pool;
      }
    } catch (err) {
      const label = p.url
        ? `URL`
        : `${p.cfg.host}:${p.cfg.port}/${p.cfg.database} SSL=${p.ssl ? 'true' : 'false'}`;
      console.error(`❌ Connect failed (${label}):`, err && err.message ? err.message : err);
      errors.push(`${label} → ${err && err.message ? err.message : err}`);
    }
  }
  console.error('⛔ All connection attempts failed.\nTried:\n- ' + errors.join('\n- '));
  throw new Error('DB_CONNECT_FAILED');
}

// Uygulama boot olurken deneyelim
const ready = tryConnect();

// Keep-alive (bağlantı düşmesin)
setInterval(async () => {
  try {
    await ready;
    await pool.query('SELECT 1');
  } catch (e) {
    console.error('⚠️ DB keep-alive error:', e.message);
  }
}, 60_000);

module.exports = new Proxy(
  {},
  {
    get(_, prop) {
      // pool hazır olmadan query çağrılırsa beklet
      if (prop === 'query' || prop === 'execute' || prop === 'getConnection') {
        return async (...args) => {
          await ready;
          return pool[prop](...args);
        };
      }
      return pool[prop];
    },
  }
);
