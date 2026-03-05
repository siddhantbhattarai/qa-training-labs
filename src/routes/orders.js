const express = require("express");
const Order = require("../models/Order");
const Cart = require("../models/Cart");
const Product = require("../models/Product");
const { authenticate, requireAdmin } = require("../middleware/auth");

const router = express.Router();

/**
 * @swagger
 * /api/orders:
 *   post:
 *     tags: [Orders]
 *     summary: Place an order from current cart
 *     description: |
 *       Converts the user's cart into an order.
 *
 *       **🐛 Bugs to find:**
 *       - Stock is NOT decremented on order — unlimited ordering
 *       - Cart is NOT cleared after order — can place duplicate orders
 *       - Total is recalculated from cart prices but not verified against product current price
 *       - Empty cart results in order with totalAmount: 0 (no validation)
 *       - shippingAddress is optional — orders can be placed with no address
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: false
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               shippingAddress:
 *                 type: object
 *                 properties:
 *                   street:
 *                     type: string
 *                     example: 123 Test Street
 *                   city:
 *                     type: string
 *                     example: QA City
 *                   country:
 *                     type: string
 *                     example: Testland
 *               notes:
 *                 type: string
 *                 example: Leave at door
 *     responses:
 *       201:
 *         description: Order placed
 *       400:
 *         description: Cart is empty
 *       404:
 *         description: Cart not found
 */
router.post("/", authenticate, async (req, res) => {
  try {
    const cart = await Cart.findOne({ user: req.user._id }).populate(
      "items.product"
    );

    if (!cart) {
      return res.status(404).json({ message: "Cart not found" });
    }

    // BUG #41: Empty cart check exists but totalAmount will be 0 — no rejection
    // BUG #42: No stock reservation or decrement
    const items = cart.items.map((item) => ({
      product: item.product._id,
      name: item.product.name,
      quantity: item.quantity,
      price: item.priceAtAdd, // BUG #43: Uses stale snapshot price, not current price
    }));

    const totalAmount = items.reduce(
      (sum, item) => sum + item.price * item.quantity,
      0
    );

    const order = new Order({
      user: req.user._id,
      items,
      totalAmount,
      // BUG #44: shippingAddress not validated — can be missing entirely
      shippingAddress: req.body.shippingAddress || {},
      notes: req.body.notes || "",
    });

    await order.save();

    // BUG #45: Cart NOT cleared — same cart can generate multiple orders
    // cart.items = [];
    // await cart.save();

    res.status(201).json({ message: "Order placed successfully", order });
  } catch (err) {
    res.status(500).json({ message: "Failed to place order", error: err.message });
  }
});

/**
 * @swagger
 * /api/orders:
 *   get:
 *     tags: [Orders]
 *     summary: Get current user's orders
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of user's orders
 */
router.get("/", authenticate, async (req, res) => {
  try {
    // BUG #46: No pagination — fetches ALL orders for user
    const orders = await Order.find({ user: req.user._id }).sort({ createdAt: -1 });
    res.json(orders);
  } catch (err) {
    res.status(500).json({ message: "Failed to get orders" });
  }
});

/**
 * @swagger
 * /api/orders/all:
 *   get:
 *     tags: [Orders]
 *     summary: Get ALL orders (Admin only)
 *     description: Returns all orders from all users.
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: All orders
 *       403:
 *         description: Admin only
 */
router.get("/all", authenticate, requireAdmin, async (req, res) => {
  try {
    const orders = await Order.find().populate("user", "name email").sort({ createdAt: -1 });
    res.json(orders);
  } catch (err) {
    res.status(500).json({ message: "Failed to get orders" });
  }
});

/**
 * @swagger
 * /api/orders/{id}:
 *   get:
 *     tags: [Orders]
 *     summary: Get order by ID
 *     description: |
 *       **🐛 Bugs to find:**
 *       - Any authenticated user can fetch any order by ID (IDOR vulnerability)
 *       - No ownership check
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Order details
 *       404:
 *         description: Not found
 */
router.get("/:id", authenticate, async (req, res) => {
  try {
    // BUG #47: IDOR — no check that order belongs to req.user
    const order = await Order.findById(req.params.id).populate("user", "name email");
    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }
    res.json(order);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

/**
 * @swagger
 * /api/orders/{id}/status:
 *   patch:
 *     tags: [Orders]
 *     summary: Update order status (Admin only)
 *     description: |
 *       **🐛 Bugs to find:**
 *       - No state machine — status can jump from `pending` directly to `delivered`
 *       - Cancelled orders can be re-activated by setting status back to `pending`
 *       - Invalid status values return 500 (Mongoose enum error) instead of 400
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [status]
 *             properties:
 *               status:
 *                 type: string
 *                 enum: [pending, processing, shipped, delivered, cancelled]
 *                 example: shipped
 *     responses:
 *       200:
 *         description: Status updated
 *       404:
 *         description: Order not found
 */
router.patch("/:id/status", authenticate, requireAdmin, async (req, res) => {
  try {
    const { status } = req.body;

    // BUG #48: No state machine validation — any -> any transition allowed
    // BUG #49: Invalid status throws 500 instead of 400 (Mongoose enum validation error)
    const order = await Order.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true, runValidators: true }
    );

    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }

    res.json({ message: "Order status updated", order });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

/**
 * @swagger
 * /api/orders/{id}/cancel:
 *   patch:
 *     tags: [Orders]
 *     summary: Cancel an order
 *     description: |
 *       Allows a user to cancel their own order.
 *
 *       **🐛 Bugs to find:**
 *       - Already-delivered orders can be cancelled
 *       - No stock restoration on cancellation
 *       - Any user can cancel any order (IDOR + no ownership check)
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Order cancelled
 *       404:
 *         description: Order not found
 */
router.patch("/:id/cancel", authenticate, async (req, res) => {
  try {
    // BUG #50: IDOR — no ownership check. Any logged-in user can cancel any order.
    const order = await Order.findById(req.params.id);

    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }

    // BUG #51: No check for already-delivered — can cancel delivered orders
    order.status = "cancelled";
    await order.save();

    // BUG #52: Stock NOT restored on cancellation
    res.json({ message: "Order cancelled", order });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
