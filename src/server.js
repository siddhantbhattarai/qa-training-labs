require("dotenv").config();

// These are PUBLIC dev fallbacks (they live in the repo). They keep the
// zero-config lab runnable with no .env, but anything signed with them is
// forgeable by anyone. They must NEVER be used by a real deployment.
const DEV_JWT_SECRET = "qa-lab-dev-access-secret-change-me-please";
const DEV_JWT_REFRESH_SECRET = "qa-lab-dev-refresh-secret-change-me-please";

// In production, refuse to boot on a missing or publicly-known signing key
// instead of silently falling back to one anyone could forge tokens against.
if (process.env.NODE_ENV === "production") {
  const offenders = [];
  if (!process.env.JWT_SECRET || process.env.JWT_SECRET === DEV_JWT_SECRET) {
    offenders.push("JWT_SECRET");
  }
  if (
    !process.env.JWT_REFRESH_SECRET ||
    process.env.JWT_REFRESH_SECRET === DEV_JWT_REFRESH_SECRET
  ) {
    offenders.push("JWT_REFRESH_SECRET");
  }
  if (offenders.length) {
    console.error(
      `\n❌ Refusing to start in production: ${offenders.join(" and ")} ` +
        `must be set to a strong, secret value (not the public dev fallback).\n` +
        `   Set them in your host's environment, then redeploy.\n`
    );
    process.exit(1);
  }
}

// Zero-config safety net for local/dev only: provide dev fallbacks so
// `npm start` works with no .env at all. Override these for anything real.
process.env.JWT_SECRET = process.env.JWT_SECRET || DEV_JWT_SECRET;
process.env.JWT_REFRESH_SECRET =
  process.env.JWT_REFRESH_SECRET || DEV_JWT_REFRESH_SECRET;
process.env.JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || "1h";
process.env.JWT_REFRESH_EXPIRES_IN = process.env.JWT_REFRESH_EXPIRES_IN || "7d";

const express = require("express");
const path = require("path");
const cors = require("cors");
const rateLimit = require("express-rate-limit");
const swaggerUi = require("swagger-ui-express");
const swaggerSpec = require("./config/swagger");
const { connectDB, getConnectionStatus } = require("./config/db");
const { attachLevel } = require("./lab/level");
const { errorEnvelope } = require("./lab/behaviors");
const { seedIfEmpty, scheduleAutoReset } = require("./lab/seedData");

// Route imports
const authRoutes = require("./routes/auth");
const productRoutes = require("./routes/products");
const cartRoutes = require("./routes/cart");
const orderRoutes = require("./routes/orders");
const userRoutes = require("./routes/users");
const seedRoutes = require("./routes/seed");
const labRoutes = require("./routes/lab");

const app = express();

// ─── Connect Database (then auto-seed if empty) ─────────────────────────────────
connectDB().then(async () => {
  try {
    const seeded = await seedIfEmpty();
    if (seeded) {
      console.log(`🌱 Auto-seeded demo data (${seeded.products} products, 3 users)`);
      console.log("   Admin: admin@qalab.com / Admin@1234   |   User: user@qalab.com / User@1234");
    }
  } catch (e) {
    console.warn("⚠️  Auto-seed skipped:", e.message);
  }
  // Keep a shared lab tidy: wipe + re-seed on a schedule (default every 24h).
  scheduleAutoReset();
});

// ─── Middleware ────────────────────────────────────────────────────────────────
app.use(cors());
app.use(express.json());

// Attach the active QA difficulty level (low/medium/high/stable) to every request.
app.use(attachLevel);

// ─── Serve Static Frontend ─────────────────────────────────────────────────────
app.use(express.static(path.join(__dirname, "../public")));

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
      /* Hide default Swagger logo/link */
      .swagger-ui .topbar { 
        background: #1e293b;
        padding: 10px 20px;
      }
      .swagger-ui .topbar-wrapper { 
        display: flex;
        justify-content: flex-end;
        align-items: center;
      }
      .swagger-ui .topbar-wrapper .link {
        display: flex;
        align-items: center;
        text-decoration: none;
        white-space: nowrap;
      }
      .swagger-ui .topbar-wrapper .link img { display: none; }
      .swagger-ui .topbar-wrapper .link::before { 
        content: '🧪 QA Training Lab'; 
        color: #fff;
        font-weight: 600;
        font-size: 1rem;
        white-space: nowrap;
      }
      
      /* Compact info section */
      .swagger-ui .info { margin: 20px 0 30px; }
      .swagger-ui .info hgroup.main { margin: 0; }
      .swagger-ui .info .title { 
        font-size: 1.8rem; 
        color: #1e293b;
      }
      .swagger-ui .info .title small.version-stamp { 
        background: #6366f1 !important; 
        border-radius: 12px;
        padding: 2px 10px;
        font-size: 0.75rem;
      }
      .swagger-ui .info .description { 
        font-size: 0.95rem; 
        color: #64748b;
        margin-top: 8px;
      }
      .swagger-ui .info .description p { margin: 0; }
      
      /* Hide unnecessary info elements */
      .swagger-ui .info .base-url,
      .swagger-ui .info .link { display: none; }
      
      /* Tags styling */
      .swagger-ui .opblock-tag { 
        font-size: 1.1rem !important;
        border-bottom: 1px solid #e2e8f0;
        padding: 12px 0;
      }
      .swagger-ui .opblock-tag:hover { background: #f8fafc; }
      .swagger-ui .opblock-tag small { color: #64748b; }
      
      /* HTTP Methods - clean colors */
      .swagger-ui .opblock.opblock-get { 
        border-color: #22c55e; 
        background: rgba(34, 197, 94, 0.03);
      }
      .swagger-ui .opblock.opblock-get .opblock-summary-method { background: #22c55e; }
      
      .swagger-ui .opblock.opblock-post { 
        border-color: #3b82f6; 
        background: rgba(59, 130, 246, 0.03);
      }
      .swagger-ui .opblock.opblock-post .opblock-summary-method { background: #3b82f6; }
      
      .swagger-ui .opblock.opblock-put { 
        border-color: #f59e0b; 
        background: rgba(245, 158, 11, 0.03);
      }
      .swagger-ui .opblock.opblock-put .opblock-summary-method { background: #f59e0b; }
      
      .swagger-ui .opblock.opblock-delete { 
        border-color: #ef4444; 
        background: rgba(239, 68, 68, 0.03);
      }
      .swagger-ui .opblock.opblock-delete .opblock-summary-method { background: #ef4444; }
      
      .swagger-ui .opblock.opblock-patch { 
        border-color: #8b5cf6; 
        background: rgba(139, 92, 246, 0.03);
      }
      .swagger-ui .opblock.opblock-patch .opblock-summary-method { background: #8b5cf6; }
      
      /* Authorize button */
      .swagger-ui .btn.authorize { 
        background: #6366f1;
        border-color: #6366f1;
        color: white;
        font-weight: 500;
        padding: 8px 16px;
        border-radius: 6px;
      }
      .swagger-ui .btn.authorize:hover { background: #4f46e5; }
      .swagger-ui .btn.authorize svg { fill: white; }
      
      /* Execute button */
      .swagger-ui .btn.execute { 
        background: #6366f1;
        border-color: #6366f1;
        border-radius: 6px;
      }
      
      /* Try it out button */
      .swagger-ui .try-out__btn { 
        border-color: #6366f1;
        color: #6366f1;
        border-radius: 6px;
      }
      .swagger-ui .try-out__btn:hover { 
        background: #6366f1;
        color: white;
      }
      
      /* Models section - compact */
      .swagger-ui section.models { margin-top: 30px; }
      .swagger-ui section.models h4 { font-size: 1rem; }
      
      /* Filter input */
      .swagger-ui .filter-container input {
        border-radius: 6px;
        border-color: #e2e8f0;
      }
    `,
    swaggerOptions: {
      persistAuthorization: true,
      displayRequestDuration: true,
      filter: true,
      tryItOutEnabled: true,
      docExpansion: "list",
      defaultModelsExpandDepth: 0,
      defaultModelExpandDepth: 1,
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
  const dbStatus = getConnectionStatus();
  res.json({
    status: dbStatus.state === "connected" ? "ok" : "degraded",
    environment: process.env.NODE_ENV || "development",
    timestamp: new Date().toISOString(),
    version: "1.0.0",
    database: dbStatus,
  });
});

// ─── Routes ───────────────────────────────────────────────────────────────────
app.use("/api/auth", authRoutes);
app.use("/api/products", productRoutes);
app.use("/api/cart", cartRoutes);
app.use("/api/orders", orderRoutes);
app.use("/api/users", userRoutes);
app.use("/api/seed", seedRoutes);
app.use("/api/lab", labRoutes);

// ─── Root ─────────────────────────────────────────────────────────────────────
app.get("/", (req, res) => {
  res.json({
    name: "🧪 QA Training Lab API",
    version: "2.0.0",
    docs: "/api/docs",
    health: "/api/health",
    level: "GET/POST /api/lab/level  ← switch difficulty (low/medium/high/stable)",
    seed: "POST /api/seed",
    description:
      "QA learning API with switchable difficulty. The same endpoint behaves " +
      "differently per level — practise the same test from beginner to advanced, " +
      "then diff against the 'stable' reference build.",
  });
});

// ─── Serve Frontend for SPA routes ────────────────────────────────────────────
app.get("/pages/*", (req, res) => {
  res.sendFile(path.join(__dirname, "../public", req.path));
});

// ─── 404 Handler for API routes ───────────────────────────────────────────────
// BUG: Returns HTML 404 from Express default instead of JSON for unknown routes
app.use("/api/*", (req, res) => {
  res.status(404).json({ message: `Route ${req.method} ${req.path} not found` });
});

// Fallback to index.html for unknown routes (SPA support)
app.use((req, res) => {
  res.sendFile(path.join(__dirname, "../public/index.html"));
});

// ─── Global Error Handler ─────────────────────────────────────────────────────
app.use((err, req, res, next) => {
  console.error("Unhandled error:", err);
  // QA: at "low" the raw stack trace is returned to the client (a defect a
  // tester should report); higher levels return a clean generic message.
  res.status(500).json(errorEnvelope(req.qaLevel || "low", err));
});

// ─── Start Server ─────────────────────────────────────────────────────────────
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`\n🧪 QA Training Lab API running on port ${PORT}`);
  console.log(`📖 Swagger Docs: http://localhost:${PORT}/api/docs`);
  console.log(`💡 Start by seeding: POST http://localhost:${PORT}/api/seed\n`);
});

module.exports = app;
