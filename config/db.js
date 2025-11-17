const mysql = require('mysql2/promise');
require('dotenv').config();

const pool = mysql.createPool({
  host: process.env.DB_HOST || process.env.MYSQLHOST,
  port: parseInt(process.env.DB_PORT || process.env.MYSQLPORT || '3306'),
  user: process.env.DB_USER || process.env.MYSQLUSER,
  password: process.env.DB_PASS || process.env.MYSQLPASSWORD,
  database: process.env.DB_NAME || process.env.MYSQLDATABASE,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  enableKeepAlive: true,
  keepAliveInitialDelay: 0,
});

// Test connection
pool.getConnection()
  .then(conn => {
    console.log('✅ MySQL connected to Railway database:', process.env.DB_HOST);
    conn.release();
  })
  .catch(err => {
    console.error('❌ MySQL connection error:', err);
  });

module.exports = pool;