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
      /* Top bar styling */
      .swagger-ui .topbar { 
        background: linear-gradient(135deg, #1e293b 0%, #0f172a 100%);
        padding: 15px 0;
      }
      .swagger-ui .topbar-wrapper { max-width: 1200px; margin: 0 auto; }
      .swagger-ui .topbar-wrapper .link { font-size: 1.5rem; }
      .swagger-ui .topbar-wrapper .link::after { 
        content: ' QA Training Lab'; 
        color: #818cf8; 
        margin-left: 8px;
        font-weight: 600;
      }
      .swagger-ui .topbar-wrapper img { height: 40px; }
      
      /* Info section */
      .swagger-ui .info { margin: 30px 0; }
      .swagger-ui .info .title { color: #1e293b; font-size: 2.5rem; }
      .swagger-ui .info .title small.version-stamp { 
        background: #6366f1 !important; 
        border-radius: 20px;
        padding: 4px 12px;
      }
      .swagger-ui .info .description { 
        font-size: 15px; 
        line-height: 1.7;
      }
      .swagger-ui .info .description h1 { 
        color: #1e293b; 
        border-bottom: 2px solid #6366f1;
        padding-bottom: 10px;
      }
      .swagger-ui .info .description h2 { 
        color: #334155;
        margin-top: 25px;
      }
      .swagger-ui .info .description code {
        background: #f1f5f9;
        padding: 3px 8px;
        border-radius: 4px;
        color: #6366f1;
      }
      .swagger-ui .info .description pre {
        background: #1e293b;
        border-radius: 8px;
        padding: 15px;
      }
      .swagger-ui .info .description pre code {
        background: transparent;
        color: #e2e8f0;
      }
      .swagger-ui .info .description hr {
        border: none;
        border-top: 1px solid #e2e8f0;
        margin: 25px 0;
      }
      
      /* Tags/Sections */
      .swagger-ui .opblock-tag { 
        font-size: 1.2rem !important;
        border-bottom: 2px solid #e2e8f0;
        padding: 15px 0;
      }
      .swagger-ui .opblock-tag:hover { background: #f8fafc; }
      .swagger-ui .opblock-tag small { font-size: 0.85rem; color: #64748b; }
      
      /* HTTP Methods */
      .swagger-ui .opblock.opblock-get { 
        border-color: #22c55e; 
        background: rgba(34, 197, 94, 0.05);
      }
      .swagger-ui .opblock.opblock-get .opblock-summary-method { background: #22c55e; }
      
      .swagger-ui .opblock.opblock-post { 
        border-color: #3b82f6; 
        background: rgba(59, 130, 246, 0.05);
      }
      .swagger-ui .opblock.opblock-post .opblock-summary-method { background: #3b82f6; }
      
      .swagger-ui .opblock.opblock-put { 
        border-color: #f59e0b; 
        background: rgba(245, 158, 11, 0.05);
      }
      .swagger-ui .opblock.opblock-put .opblock-summary-method { background: #f59e0b; }
      
      .swagger-ui .opblock.opblock-delete { 
        border-color: #ef4444; 
        background: rgba(239, 68, 68, 0.05);
      }
      .swagger-ui .opblock.opblock-delete .opblock-summary-method { background: #ef4444; }
      
      .swagger-ui .opblock.opblock-patch { 
        border-color: #8b5cf6; 
        background: rgba(139, 92, 246, 0.05);
      }
      .swagger-ui .opblock.opblock-patch .opblock-summary-method { background: #8b5cf6; }
      
      /* Buttons */
      .swagger-ui .btn.authorize { 
        background: #6366f1;
        border-color: #6366f1;
        color: white;
        font-weight: 600;
        padding: 10px 20px;
        border-radius: 8px;
      }
      .swagger-ui .btn.authorize:hover { background: #4f46e5; }
      .swagger-ui .btn.authorize svg { fill: white; }
      
      .swagger-ui .btn.execute { 
        background: #6366f1;
        border-color: #6366f1;
        border-radius: 6px;
      }
      .swagger-ui .btn.execute:hover { background: #4f46e5; }
      
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
      
      /* Response section */
      .swagger-ui .responses-wrapper { margin-top: 20px; }
      .swagger-ui .response-col_status { font-weight: 600; }
      
      /* Model section */
      .swagger-ui section.models { border-radius: 8px; }
      .swagger-ui section.models h4 { font-size: 1.1rem; }
      
      /* Scrollbar */
      .swagger-ui ::-webkit-scrollbar { width: 8px; height: 8px; }
      .swagger-ui ::-webkit-scrollbar-track { background: #f1f5f9; }
      .swagger-ui ::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 4px; }
      .swagger-ui ::-webkit-scrollbar-thumb:hover { background: #94a3b8; }
    `,
    swaggerOptions: {
      persistAuthorization: true,
      displayRequestDuration: true,
      filter: true,
      tryItOutEnabled: true,
      docExpansion: "list",
      defaultModelsExpandDepth: 1,
      defaultModelExpandDepth: 2,
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
