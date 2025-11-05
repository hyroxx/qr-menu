// config/db.js
// Tolerant MySQL havuzu: iç ağ (mysql:3306) öncelik, proxy fallback, crash yok
const mysql = require("mysql2/promise");

// --- Env okuma (internal -> DB_* -> MYSQL*)
const HOST =
  process.env.DB_INTERNAL_HOST ||
  process.env.MYSQLHOST_INTERNAL ||
  process.env.DB_HOST ||
  process.env.MYSQLHOST;

const PORT = Number(
  process.env.DB_INTERNAL_PORT ||
    process.env.MYSQLPORT_INTERNAL ||
    process.env.DB_PORT ||
    process.env.MYSQLPORT ||
    3306
);

const USER = process.env.DB_USER || process.env.MYSQLUSER || "root";
const PASS = process.env.DB_PASS || process.env.MYSQLPASSWORD || "";
const NAME =
  process.env.DB_NAME || process.env.MYSQLDATABASE || process.env.DB || "railway";

const USE_SSL =
  process.env.DB_SSL === "true" ||
  process.env.MYSQL_SSL === "true" ||
  false;

// Havuz konfigürasyonu
const baseCfg = {
  host: HOST,
  port: PORT,
  user: USER,
  password: PASS,
  database: NAME,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  connectTimeout: 10_000, // 10 sn
};
if (USE_SSL) {
  baseCfg.ssl = { rejectUnauthorized: false };
}

let pool;          // mysql2/promise Pool
let healthy = false;

// Havuzu temin et (lazy)
async function ensurePool() {
  if (!pool) {
    if (!baseCfg.host) {
      console.warn("⚠️ DB host env eksik; yine de pool yaratılıyor (host: undefined).");
    }
    pool = mysql.createPool(baseCfg);
  }
  return pool;
}

// Yumuşak ping: başarısızsa sadece sağlığı düşürür, throw etmez
async function softPing() {
  try {
    const p = await ensurePool();
    await p.query("SELECT 1");
    healthy = true;
  } catch (e) {
    healthy = false;
    console.warn(
      `⚠️ DB ping failed (${baseCfg.host}:${baseCfg.port}/${baseCfg.database} SSL=${!!baseCfg.ssl}):`,
      e.code || e.message
    );
  }
}

// İlk ping arka planda; app’i bloklama
softPing().catch(() => {});
// Keep-alive (idle bağlantıları sıcak tut)
setInterval(softPing, 60_000).unref();

// Dışa vereceğimiz yardımcılar
function isDbHealthy() {
  return healthy;
}

async function getPool() {
  return ensurePool();
}

/**
 * Güvenli sorgu helper (isteğe bağlı kullanım):
 *  const rows = await query('SELECT * FROM restaurants WHERE slug=?',[slug]);
 */
async function query(sql, params) {
  const p = await ensurePool();
  const [rows] = await p.query(sql, params);
  return rows;
}

module.exports = {
  getPool,
  query,
  isDbHealthy,
  // Bilgi amaçlı export (log/debug için)
  __cfg: { ...baseCfg },
};
