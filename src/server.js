require("dotenv").config();
const express = require("express");
const path = require("path");
const cors = require("cors");
const rateLimit = require("express-rate-limit");
const swaggerUi = require("swagger-ui-express");
const swaggerSpec = require("./config/swagger");
const { connectDB, getConnectionStatus } = require("./config/db");

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
