// config/db.js

const mysql = require('mysql2');
const dotenv = require('dotenv');

// .env dosyasını oku
dotenv.config();

// Veritabanı bağlantısı oluştur
const connection = mysql.createConnection({
  host: process.env.DB_HOST,       // örnek: localhost
  user: process.env.DB_USER,       // örnek: root
  password: process.env.DB_PASSWORD, // örnek: hahaha555
  database: process.env.DB_NAME    // örnek: e2_digital_solutions
});

// Bağlantı kontrolü
connection.connect((err) => {
  if (err) {
    console.error('❌ Veritabanı bağlantı HATASI: ' + err.stack);
    return;
  }
  console.log('✅ Veritabanına başarıyla bağlanıldı.');
});

module.exports = connection;
