// src/server.js
require("dotenv").config();
const path = require("path");
const express = require("express");
const cors = require("cors");

const app = express();

// ✅ Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ✅ Public klasörünü statik olarak sun
const PUBLIC_DIR = path.join(__dirname, "..", "public");
app.use(express.static(PUBLIC_DIR, { maxAge: "1h", etag: true }));

// ✅ Health check
app.get("/healthz", (req, res) => {
  res.json({ status: "ok" });
});

// ✅ ROUTES (API)
const restaurantsRouter = require("../routes/restaurants");
const customerMenuRouter = require("../routes/customerMenu");

app.use("/restaurant", restaurantsRouter);
app.use("/api/customer-menu", customerMenuRouter);

// ✅ SPA (Slug bazlı restoran sayfaları)
const serveIndex = (_req, res) => {
  res.sendFile(path.join(PUBLIC_DIR, "index.html"));
};

// Restoran ana sayfası
app.get("/:slug", serveIndex);
// Menü sayfası
app.get("/:slug/menu", serveIndex);
// Alt yollar (ör. /cafe-eva/menu?lang=tr)
app.get("/:slug/*", serveIndex);

// ✅ 404 yakalama (API dışı istekler)
app.use((req, res, next) => {
  if (req.path.startsWith("/restaurant") || req.path.startsWith("/api")) {
    return res.status(404).json({ error: "not_found" });
  }
  return serveIndex(req, res); // SPA fallback
});

// ✅ Genel hata yakalayıcı
app.use((err, req, res, next) => {
  console.error("❌ Unhandled error:", err);
  res.status(500).json({ error: "server_error", detail: String(err) });
});

// ✅ PORT
const PORT = process.env.PORT || 8080;
app.listen(PORT, () => {
  console.log(`✅ Server running on http://localhost:${PORT}`);
});

