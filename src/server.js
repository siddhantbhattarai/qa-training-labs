require("dotenv").config();
const express = require("express");
const cors = require("cors");
const rateLimit = require("express-rate-limit");
const swaggerUi = require("swagger-ui-express");
const swaggerSpec = require("./config/swagger");
const connectDB = require("./config/db");

// Route imports
const authRoutes = require("./routes/auth");
const productRoutes = require("./routes/products");
const cartRoutes = require("./routes/cart");
const orderRoutes = require("./routes/orders");
const userRoutes = require("./routes/users");
const seedRoutes = require("./routes/seed");

const app = express();

// ─── Connect Database ──────────────────────────────────────────────────────────
connectDB();

// ─── Middleware ────────────────────────────────────────────────────────────────
app.use(cors());
app.use(express.json());

// Global rate limiter (intentionally lenient for lab use)
// BUG: Login route has NO per-route rate limit — brute force is possible
const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 500,
  message: { message: "Too many requests, please try again later." },
});
app.use(globalLimiter);

// ─── Swagger Docs ──────────────────────────────────────────────────────────────
app.use(
  "/api/docs",
  swaggerUi.serve,
  swaggerUi.setup(swaggerSpec, {
    customSiteTitle: "QA Training Lab API",
    customfavIcon: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/1f9ea.png",
    customCss: `
      .swagger-ui .topbar { background: #1a1a2e; }
      .swagger-ui .topbar-wrapper .link::after { content: ' — QA Training Lab'; color: #e94560; margin-left: 8px; }
      .swagger-ui .info .title { color: #1a1a2e; }
    `,
    swaggerOptions: {
      persistAuthorization: true,
      displayRequestDuration: true,
      filter: true,
      tryItOutEnabled: true,
    },
  })
);

// Serve raw swagger JSON
app.get("/api/docs.json", (req, res) => {
  res.setHeader("Content-Type", "application/json");
  res.send(swaggerSpec);
});

// ─── Health Check ──────────────────────────────────────────────────────────────
/**
 * @swagger
 * /api/health:
 *   get:
 *     tags: [Health]
 *     summary: Server health check
 *     description: Returns server status and current timestamp.
 *     responses:
 *       200:
 *         description: Server is healthy
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: ok
 *                 environment:
 *                   type: string
 *                   example: development
 *                 timestamp:
 *                   type: string
 *                   format: date-time
 *                 version:
 *                   type: string
 *                   example: 1.0.0
 */
app.get("/api/health", (req, res) => {
  res.json({
    status: "ok",
    environment: process.env.NODE_ENV || "development",
    timestamp: new Date().toISOString(),
    version: "1.0.0",
  });
});

// ─── Routes ───────────────────────────────────────────────────────────────────
app.use("/api/auth", authRoutes);
app.use("/api/products", productRoutes);
app.use("/api/cart", cartRoutes);
app.use("/api/orders", orderRoutes);
app.use("/api/users", userRoutes);
app.use("/api/seed", seedRoutes);

// ─── Root ─────────────────────────────────────────────────────────────────────
app.get("/", (req, res) => {
  res.json({
    name: "🧪 QA Training Lab API",
    version: "1.0.0",
    docs: "/api/docs",
    health: "/api/health",
    seed: "POST /api/seed  ← Start here!",
    description: "Intentionally buggy API for QA learning. Find all 58+ bugs!",
  });
});

// ─── 404 Handler ──────────────────────────────────────────────────────────────
// BUG: Returns HTML 404 from Express default instead of JSON for unknown routes
app.use((req, res) => {
  res.status(404).json({ message: `Route ${req.method} ${req.path} not found` });
});

// ─── Global Error Handler ─────────────────────────────────────────────────────
app.use((err, req, res, next) => {
  console.error("Unhandled error:", err);
  // BUG: Leaks stack trace in non-production environments
  res.status(500).json({
    message: "Internal server error",
    ...(process.env.NODE_ENV !== "production" && { stack: err.stack }),
  });
});

// ─── Start Server ─────────────────────────────────────────────────────────────
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`\n🧪 QA Training Lab API running on port ${PORT}`);
  console.log(`📖 Swagger Docs: http://localhost:${PORT}/api/docs`);
  console.log(`💡 Start by seeding: POST http://localhost:${PORT}/api/seed\n`);
});

module.exports = app;
