const express = require('express');
const cors = require('cors');
const fileUpload = require('express-fileupload');
const path = require('path');
require('dotenv').config();

const menuItemsRoute = require('../routes/menuItems');
const usersRoute = require('../routes/users');
const notificationsRoute = require('../routes/notifications');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(fileUpload());
app.use(express.static(path.join(__dirname, '../public')));

// Routes
app.use('/menu', menuItemsRoute);
app.use('/notifications', notificationsRoute);
app.use('/', usersRoute); // login route burada

// Başlat
app.listen(PORT, () => {
  console.log(`✅ Server running on http://localhost:${PORT}`);
});
