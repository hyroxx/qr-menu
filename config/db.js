const mysql = require('mysql2');
require('dotenv').config();

// Create a MySQL connection pool for better stability
const pool = mysql.createPool({
  connectionLimit: 10, // Max simultaneous connections
  host: process.env.DB_HOST,
  port: process.env.DB_PORT || 3306,
  user: process.env.DB_USER,
  password: process.env.DB_PASS,
  database: process.env.DB_NAME
});

// Test initial connection
pool.getConnection((err, connection) => {
  if (err) {
    console.error('❌ MySQL connection failed:', err.message);
  } else {
    console.log('✅ Connected to Railway DB via connection pool.');
    connection.release(); // Important: return connection to pool
  }
});

module.exports = pool;
