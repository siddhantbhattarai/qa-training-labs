/**
 * Shared seed routine — used by POST /api/seed AND by the server on first boot
 * (so the zero-config in-memory database always has data to test against).
 */
const User = require("../models/User");
const Product = require("../models/Product");

async function seedDatabase() {
  // Upsert admin
  let admin = await User.findOne({ email: process.env.ADMIN_EMAIL || "admin@qalab.com" });
  if (!admin) {
    admin = await User.create({
      name: "Lab Admin",
      email: process.env.ADMIN_EMAIL || "admin@qalab.com",
      password: process.env.ADMIN_PASSWORD || "Admin@1234",
      role: "admin",
    });
  }

  // Two demo users so learners can test "user A vs user B" access rules.
  let demoUser = await User.findOne({ email: "user@qalab.com" });
  if (!demoUser) {
    demoUser = await User.create({
      name: "Demo User",
      email: "user@qalab.com",
      password: "User@1234",
      role: "user",
    });
  }
  let secondUser = await User.findOne({ email: "user2@qalab.com" });
  if (!secondUser) {
    secondUser = await User.create({
      name: "Second User",
      email: "user2@qalab.com",
      password: "User@1234",
      role: "user",
    });
  }

  // Products (rebuilt each seed). Includes deliberate edge-case rows for QA.
  await Product.deleteMany({});
  const products = await Product.insertMany([
    { name: "Wireless Mouse", description: "Ergonomic 2.4GHz wireless mouse", price: 29.99, category: "Electronics", stock: 100, discount: 0, createdBy: admin._id },
    { name: "Mechanical Keyboard", description: "TKL layout, blue switches", price: 79.99, category: "Electronics", stock: 50, discount: 10, createdBy: admin._id },
    { name: "USB-C Hub", description: "7-in-1 USB-C hub with HDMI", price: 45.0, category: "Electronics", stock: 75, discount: 5, createdBy: admin._id },
    { name: "Desk Lamp", description: "LED adjustable desk lamp", price: 24.99, category: "Office", stock: 60, discount: 0, createdBy: admin._id },
    { name: "Notebook A5", description: "200 page ruled notebook", price: 8.99, category: "Stationery", stock: 200, discount: 0, createdBy: admin._id },
    { name: "Standing Desk", description: "Electric height-adjustable desk", price: 499.99, category: "Furniture", stock: 10, discount: 15, createdBy: admin._id },
    { name: "Monitor Stand", description: "Adjustable monitor riser", price: 34.99, category: "Office", stock: 80, discount: 0, createdBy: admin._id },
    { name: "Webcam HD", description: "1080p HD webcam with mic", price: 59.99, category: "Electronics", stock: 0, isActive: false, discount: 0, createdBy: admin._id },
    // Intentional edge-case products for QA testing
    { name: "Free Item", description: "Zero price — should this be allowed?", price: 0, category: "Test", stock: 999, discount: 0, createdBy: admin._id },
    { name: "Overpriced Widget", description: "Discount exceeds 100%", price: 9.99, category: "Test", stock: 5, discount: 150, createdBy: admin._id },
  ]);

  return {
    admin: { email: admin.email, password: process.env.ADMIN_PASSWORD || "Admin@1234" },
    user: { email: demoUser.email, password: "User@1234" },
    user2: { email: secondUser.email, password: "User@1234" },
    products: products.length,
  };
}

/** Seed only if the DB looks empty (used on boot in in-memory mode). */
async function seedIfEmpty() {
  const count = await User.estimatedDocumentCount();
  if (count > 0) return null;
  return seedDatabase();
}

/** Wipe every collection and re-seed from scratch (used by the daily reset). */
async function resetAndReseed() {
  const Cart = require("../models/Cart");
  const Order = require("../models/Order");
  await Promise.all([
    User.deleteMany({}),
    Product.deleteMany({}),
    Cart.deleteMany({}),
    Order.deleteMany({}),
  ]);
  return seedDatabase();
}

/**
 * Schedule a recurring "clean slate" so a shared lab resets itself and clears
 * whatever learners created. Controlled by AUTO_RESET_HOURS (default 24, set 0
 * to disable). Returns the timer (or null when disabled).
 */
function scheduleAutoReset() {
  const hours = process.env.AUTO_RESET_HOURS === undefined
    ? 24
    : Number(process.env.AUTO_RESET_HOURS);
  if (!hours || hours <= 0) {
    console.log("🕓 Daily auto-reset is disabled (AUTO_RESET_HOURS=0)");
    return null;
  }
  const intervalMs = hours * 60 * 60 * 1000;
  console.log(`🕓 Auto-reset scheduled every ${hours}h (clears test data, re-seeds fresh)`);
  const timer = setInterval(async () => {
    try {
      const seeded = await resetAndReseed();
      console.log(
        `♻️  [${new Date().toISOString()}] Auto-reset complete — ` +
          `${seeded.products} products, fresh demo users restored.`
      );
    } catch (e) {
      console.warn("⚠️  Auto-reset failed:", e.message);
    }
  }, intervalMs);
  if (timer.unref) timer.unref(); // don't keep the process alive just for this
  return timer;
}

module.exports = { seedDatabase, seedIfEmpty, resetAndReseed, scheduleAutoReset };
