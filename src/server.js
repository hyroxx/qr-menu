// src/server.js
require("dotenv").config();
const path = require("path");
const express = require("express");
const cors = require("cors");

// DB health sadece healthz için okunuyor; router'lar kendi içinde pool kullanmalı
const { isDbHealthy } = require("../config/db");

const app = express();

// --- Genel middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// --- Statik dosyalar
const PUBLIC_DIR = path.join(__dirname, "..", "public");
app.use(express.static(PUBLIC_DIR, { maxAge: "1h", etag: true }));

// --- Health (DB'yi beklemeden 200 döner; durum bilgisini de ekler)
app.get("/healthz", (req, res) => {
  res.json({ ok: true, db: isDbHealthy() ? "up" : "down" });
});

// --- API router'ları (ÖNCE tanımla ki slug rotaları gölge düşürmesin)
const restaurantsRouter = require("../routes/restaurants");

// customerMenu opsiyonel; yoksa app çökmesin
let customerMenuRouter = (req, res, next) => next();
try {
  customerMenuRouter = require("../routes/customerMenu");
} catch {
  console.warn("ℹ️ routes/customerMenu bulunamadı, atlanıyor.");
}

app.use("/restaurant", restaurantsRouter);
app.use("/api/customer-menu", customerMenuRouter);

// --- SPA (slug bazlı sayfalar)
const serveIndex = (_req, res) => {
  res.sendFile(path.join(PUBLIC_DIR, "index.html"));
};

// Restoran ana sayfası
app.get("/:slug", serveIndex);
// Menü sayfası
app.get("/:slug/menu", serveIndex);
// Slug alt yolları
app.get("/:slug/*", serveIndex);

// --- API 404 (yalnızca API yolları için)
app.use((req, res, next) => {
  if (req.path.startsWith("/restaurant") || req.path.startsWith("/api")) {
    return res.status(404).json({ error: "not_found" });
  }
  return serveIndex(req, res); // SPA fallback
});

// --- Genel hata yakalayıcı
app.use((err, _req, res, _next) => {
  console.error("❌ Unhandled error:", err);
  res.status(500).json({ error: "server_error", detail: String(err) });
});

// --- Port
const PORT = process.env.PORT || 8080;
app.listen(PORT, () => {
  console.log(`✅ Server running on http://localhost:${PORT}`);
});
