const express = require("express");
const User = require("../models/User");
const Product = require("../models/Product");
const Cart = require("../models/Cart");
const Order = require("../models/Order");
const { authenticate, requireAdmin } = require("../middleware/auth");
const { seedDatabase } = require("../lab/seedData");
const B = require("../lab/behaviors");

const router = express.Router();

/**
 * @swagger
 * /api/seed:
 *   post:
 *     tags: [Dev Tools]
 *     summary: Seed the database with demo data
 *     description: |
 *       Populates an admin, two demo users, and sample products (including a
 *       few deliberate edge-case rows). Safe to call repeatedly.
 *
 *       **Seeded credentials:**
 *       - Admin: `admin@qalab.com` / `Admin@1234`
 *       - User:  `user@qalab.com`  / `User@1234`
 *       - User2: `user2@qalab.com` / `User@1234`
 *     responses:
 *       200: { description: Seed complete }
 *       500: { description: Seed failed }
 */
router.post("/", async (req, res) => {
  const level = req.qaLevel;
  try {
    const seeded = await seedDatabase();
    res.json({ message: "✅ Database seeded successfully", seeded });
  } catch (err) {
    B.sendError(res, level, err);
  }
});

/**
 * @swagger
 * /api/seed/reset:
 *   delete:
 *     tags: [Dev Tools]
 *     summary: Reset the entire database
 *     description: |
 *       Wipes all collections. **Defect to find (low/medium):** this destructive
 *       endpoint requires NO authentication — anyone can wipe the data. From
 *       **high** it requires an authenticated admin.
 *     responses:
 *       200: { description: All data deleted }
 *       401: { description: Auth required (high+) }
 *       403: { description: Admin only (high+) }
 */
router.delete("/reset", async (req, res, next) => {
  const level = req.qaLevel;
  // At high/stable, gate the destructive action behind admin auth.
  if (B.resetRequiresAdmin(level)) {
    return authenticate(req, res, () => requireAdmin(req, res, () => doReset(req, res)));
  }
  return doReset(req, res);
});

async function doReset(req, res) {
  const level = req.qaLevel;
  try {
    await Promise.all([
      User.deleteMany({}),
      Product.deleteMany({}),
      Cart.deleteMany({}),
      Order.deleteMany({}),
    ]);
    res.json({ message: "⚠️ All data deleted. Call POST /api/seed to re-seed." });
  } catch (err) {
    B.sendError(res, level, err);
  }
}

module.exports = router;
