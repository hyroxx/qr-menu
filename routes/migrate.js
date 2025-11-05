// routes/migrate.js
const express = require('express');
const router = express.Router();
const db = require('../config/db');

const TOKEN = process.env.MIGRATE_TOKEN || 'change-me-now';

async function run(db, sqls) {
  for (const s of sqls) {
    const stmt = s.trim();
    if (!stmt) continue;
    // console.log('SQL>', stmt.slice(0, 80)); // debug istersen aç
    await db.query(stmt);
  }
}

router.post('/', async (req, res) => {
  try {
    const token = (req.query.token || req.headers['x-migrate-token'] || '').toString();
    if (token !== TOKEN) return res.status(401).json({ error: 'unauthorized' });

    const statements = [
`ALTER TABLE restaurants
  ADD COLUMN IF NOT EXISTS logo_url VARCHAR(512) NULL`,
`ALTER TABLE restaurants
  ADD COLUMN IF NOT EXISTS about_text TEXT NULL`,
`ALTER TABLE restaurants
  ADD COLUMN IF NOT EXISTS phone VARCHAR(64) NULL`,
`ALTER TABLE restaurants
  ADD COLUMN IF NOT EXISTS address VARCHAR(255) NULL`,
`ALTER TABLE restaurants
  ADD COLUMN IF NOT EXISTS instagram_url VARCHAR(255) NULL`,
`ALTER TABLE restaurants
  ADD COLUMN IF NOT EXISTS facebook_url VARCHAR(255) NULL`,
`ALTER TABLE restaurants
  ADD COLUMN IF NOT EXISTS website_url VARCHAR(255) NULL`,
`ALTER TABLE restaurants
  ADD COLUMN IF NOT EXISTS opening_hours TEXT NULL`,

`ALTER TABLE menu_categories
  ADD COLUMN IF NOT EXISTS restaurant_id INT NOT NULL`,
`ALTER TABLE menu_categories
  ADD COLUMN IF NOT EXISTS display_order INT NULL DEFAULT 0`,
`ALTER TABLE menu_categories
  ADD INDEX IF NOT EXISTS idx_cat_restaurant (restaurant_id, display_order)`,

`ALTER TABLE menu_subcategories
  ADD COLUMN IF NOT EXISTS restaurant_id INT NOT NULL`,
`ALTER TABLE menu_subcategories
  ADD COLUMN IF NOT EXISTS category_id INT NOT NULL`,
`ALTER TABLE menu_subcategories
  ADD COLUMN IF NOT EXISTS display_order INT NULL DEFAULT 0`,
`ALTER TABLE menu_subcategories
  ADD INDEX IF NOT EXISTS idx_subcat_restaurant (restaurant_id, category_id, display_order)`,

`ALTER TABLE menu_items
  ADD COLUMN IF NOT EXISTS restaurant_id INT NOT NULL`,
`ALTER TABLE menu_items
  ADD COLUMN IF NOT EXISTS category_id INT NOT NULL`,
`ALTER TABLE menu_items
  ADD COLUMN IF NOT EXISTS subcategory_id INT NULL`,
`ALTER TABLE menu_items
  ADD COLUMN IF NOT EXISTS display_order INT NULL DEFAULT 0`,
`ALTER TABLE menu_items
  ADD COLUMN IF NOT EXISTS currency VARCHAR(8) NULL DEFAULT 'EUR'`,
`ALTER TABLE menu_items
  ADD COLUMN IF NOT EXISTS is_new TINYINT(1) NULL DEFAULT 0`,
`ALTER TABLE menu_items
  ADD COLUMN IF NOT EXISTS allergens VARCHAR(255) NULL`,
`ALTER TABLE menu_items
  ADD COLUMN IF NOT EXISTS image_url VARCHAR(512) NULL`,
`ALTER TABLE menu_items
  ADD COLUMN IF NOT EXISTS created_at TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP`,
`ALTER TABLE menu_items
  ADD INDEX IF NOT EXISTS idx_item_restaurant (restaurant_id, category_id, subcategory_id, display_order)`,

`CREATE TABLE IF NOT EXISTS menu_item_translations (
  id INT AUTO_INCREMENT PRIMARY KEY,
  menu_item_id INT NOT NULL,
  language_code ENUM('tr','en','es','fr') NOT NULL,
  name VARCHAR(255) NOT NULL,
  description TEXT NULL,
  UNIQUE KEY uniq_item_lang (menu_item_id, language_code),
  FOREIGN KEY (menu_item_id) REFERENCES menu_items(id) ON DELETE CASCADE
) ENGINE=InnoDB`,

`CREATE TABLE IF NOT EXISTS menu_category_translations (
  id INT AUTO_INCREMENT PRIMARY KEY,
  category_id INT NOT NULL,
  language_code ENUM('tr','en','es','fr') NOT NULL,
  name VARCHAR(255) NOT NULL,
  UNIQUE KEY uniq_cat_lang (category_id, language_code),
  FOREIGN KEY (category_id) REFERENCES menu_categories(id) ON DELETE CASCADE
) ENGINE=InnoDB`,

`CREATE TABLE IF NOT EXISTS menu_subcategory_translations (
  id INT AUTO_INCREMENT PRIMARY KEY,
  subcategory_id INT NOT NULL,
  language_code ENUM('tr','en','es','fr') NOT NULL,
  name VARCHAR(255) NOT NULL,
  UNIQUE KEY uniq_subcat_lang (subcategory_id, language_code),
  FOREIGN KEY (subcategory_id) REFERENCES menu_subcategories(id) ON DELETE CASCADE
) ENGINE=InnoDB`
    ];

    await run(db, statements);
    res.json({ ok: true, applied: statements.length });
  } catch (e) {
    console.error('MIGRATE ERROR', e);
    res.status(500).json({ error: String(e) });
  }
});

module.exports = router;
