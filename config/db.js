// config/db.js
const mysql = require('mysql2/promise');
require('dotenv').config();

const pool = mysql.createPool({
  host: process.env.MYSQLHOST,
  port: Number(process.env.MYSQLPORT || 3306),
  user: process.env.MYSQLUSER,
  password: process.env.MYSQLPASSWORD,
  database: process.env.MYSQLDATABASE,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  // Railway proxy hostlarında SSL zorunlu; sertifikayı doğrulamayalım (proxy self-signed olabilir)
  ssl: { rejectUnauthorized: false },
  // Ağ gecikmeleri için makul bir timeout
  connectTimeout: 15000,
});

module.exports = pool;
