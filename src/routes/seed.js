const express = require("express");
const User = require("../models/User");
const Product = require("../models/Product");
const Cart = require("../models/Cart");
const Order = require("../models/Order");

const router = express.Router();

/**
 * @swagger
 * /api/seed:
 *   post:
 *     tags: [Dev Tools]
 *     summary: Seed database with demo data
 *     description: |
 *       Populates the database with an admin user, sample products, and a demo user.
 *       Safe to call multiple times (uses upsert logic for admin).
 *
 *       **Seeded credentials:**
 *       - Admin: `admin@qalab.com` / `Admin@1234`
 *       - Demo User: `user@qalab.com` / `User@1234`
 *     responses:
 *       200:
 *         description: Seed complete
 *       500:
 *         description: Seed failed
 */
router.post("/", async (req, res) => {
  try {
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

    // Upsert demo user
    let demoUser = await User.findOne({ email: "user@qalab.com" });
    if (!demoUser) {
      demoUser = await User.create({
        name: "Demo User",
        email: "user@qalab.com",
        password: "User@1234",
        role: "user",
      });
    }

    // Products
    await Product.deleteMany({});
    const products = await Product.insertMany([
      { name: "Wireless Mouse", description: "Ergonomic 2.4GHz wireless mouse", price: 29.99, category: "Electronics", stock: 100, discount: 0, createdBy: admin._id },
      { name: "Mechanical Keyboard", description: "TKL layout, blue switches", price: 79.99, category: "Electronics", stock: 50, discount: 10, createdBy: admin._id },
      { name: "USB-C Hub", description: "7-in-1 USB-C hub with HDMI", price: 45.00, category: "Electronics", stock: 75, discount: 5, createdBy: admin._id },
      { name: "Desk Lamp", description: "LED adjustable desk lamp", price: 24.99, category: "Office", stock: 60, discount: 0, createdBy: admin._id },
      { name: "Notebook A5", description: "200 page ruled notebook", price: 8.99, category: "Stationery", stock: 200, discount: 0, createdBy: admin._id },
      { name: "Standing Desk", description: "Electric height-adjustable desk", price: 499.99, category: "Furniture", stock: 10, discount: 15, createdBy: admin._id },
      { name: "Monitor Stand", description: "Adjustable monitor riser", price: 34.99, category: "Office", stock: 80, discount: 0, createdBy: admin._id },
      { name: "Webcam HD", description: "1080p HD webcam with mic", price: 59.99, category: "Electronics", stock: 0, isActive: false, discount: 0, createdBy: admin._id },
      // Intentional edge-case products for QA testing
      { name: "Free Item", description: "Zero price — should this be allowed?", price: 0, category: "Test", stock: 999, discount: 0, createdBy: admin._id },
      { name: "Overpriced Widget", description: "Discount exceeds 100%", price: 9.99, category: "Test", stock: 5, discount: 150, createdBy: admin._id },
    ]);

    res.json({
      message: "✅ Database seeded successfully",
      seeded: {
        admin: { email: admin.email, password: "Admin@1234" },
        user: { email: demoUser.email, password: "User@1234" },
        products: products.length,
      },
    });
  } catch (err) {
    res.status(500).json({ message: "Seed failed", error: err.message });
  }
});

/**
 * @swagger
 * /api/seed/reset:
 *   delete:
 *     tags: [Dev Tools]
 *     summary: Reset entire database
 *     description: |
 *       ⚠️ **DANGER**: Wipes ALL collections (Users, Products, Carts, Orders).
 *       For lab/dev use only.
 *
 *       **🐛 Bugs to find:**
 *       - No authentication required — any anonymous user can wipe the DB
 *     responses:
 *       200:
 *         description: All data deleted
 */
router.delete("/reset", async (req, res) => {
  try {
    // BUG #58: No auth on destructive endpoint — public DB wipe
    await Promise.all([
      User.deleteMany({}),
      Product.deleteMany({}),
      Cart.deleteMany({}),
      Order.deleteMany({}),
    ]);
    res.json({ message: "⚠️ All data deleted. Call POST /api/seed to re-seed." });
  } catch (err) {
    res.status(500).json({ message: "Reset failed", error: err.message });
  }
});

module.exports = router;
