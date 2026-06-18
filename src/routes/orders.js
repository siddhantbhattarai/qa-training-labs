const express = require("express");
const Order = require("../models/Order");
const Cart = require("../models/Cart");
const Product = require("../models/Product");
const { authenticate, requireAdmin } = require("../middleware/auth");
const B = require("../lab/behaviors");

const router = express.Router();

/**
 * @swagger
 * /api/orders:
 *   post:
 *     tags: [Orders]
 *     summary: Place an order from the current cart
 *     description: |
 *       **Defects to find (low):**
 *       - An empty cart still creates an order (total 0).
 *       - Stock is NOT reduced — you can order more than exists.
 *       - The cart is NOT cleared, so the same cart can be ordered again.
 *       - No shipping address is required.
 *       - The price charged is the stale snapshot from when the item was added,
 *         not the product's current price.
 *
 *       Each higher level fixes more of these; **stable** is correct end-to-end.
 *     security: [{ bearerAuth: [] }]
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
 *                   street: { type: string, example: 123 Test Street }
 *                   city: { type: string, example: QA City }
 *                   country: { type: string, example: Testland }
 *               notes: { type: string }
 *     responses:
 *       201: { description: Order placed }
 *       400: { description: Empty cart / missing address (medium+) }
 *       404: { description: Cart not found }
 */
router.post("/", authenticate, async (req, res) => {
  const level = req.qaLevel;
  try {
    const cart = await Cart.findOne({ user: req.user._id }).populate("items.product");
    if (!cart) {
      return res.status(404).json({ message: "Cart not found" });
    }

    B.validateOrderPlacement(level, cart, req.body); // throws 400 at medium+

    const items = cart.items.map((item) => ({
      product: item.product._id,
      name: item.product.name,
      quantity: item.quantity,
      price: B.orderLinePrice(level, item), // stale snapshot until "stable"
    }));
    const totalAmount = items.reduce((sum, i) => sum + i.price * i.quantity, 0);

    const order = new Order({
      user: req.user._id,
      items,
      totalAmount,
      shippingAddress: req.body.shippingAddress || {},
      notes: req.body.notes || "",
    });
    await order.save();

    if (B.decrementsStockOnOrder(level)) {
      for (const item of items) {
        await Product.updateOne({ _id: item.product }, { $inc: { stock: -item.quantity } });
      }
    }
    if (B.clearsCartAfterOrder(level)) {
      cart.items = [];
      await cart.save();
    }

    res.status(201).json({ message: "Order placed successfully", order });
  } catch (err) {
    B.sendError(res, level, err);
  }
});

/**
 * @swagger
 * /api/orders:
 *   get:
 *     tags: [Orders]
 *     summary: Get the current user's orders
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       200: { description: List of the user's orders }
 */
router.get("/", authenticate, async (req, res) => {
  const level = req.qaLevel;
  try {
    const orders = await Order.find({ user: req.user._id }).sort({ createdAt: -1 });
    res.json(orders);
  } catch (err) {
    B.sendError(res, level, err);
  }
});

/**
 * @swagger
 * /api/orders/all:
 *   get:
 *     tags: [Orders]
 *     summary: Get ALL orders (Admin only)
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       200: { description: All orders }
 *       403: { description: Admin only }
 */
router.get("/all", authenticate, requireAdmin, async (req, res) => {
  const level = req.qaLevel;
  try {
    const orders = await Order.find().populate("user", "name email").sort({ createdAt: -1 });
    res.json(orders);
  } catch (err) {
    B.sendError(res, level, err);
  }
});

/**
 * @swagger
 * /api/orders/{id}:
 *   get:
 *     tags: [Orders]
 *     summary: Get an order by ID
 *     description: |
 *       The spec says a user may only view their OWN orders.
 *       **Defect to find (low):** any logged-in user can read any order by id.
 *       Fixed for viewing at **medium**, fully enforced at **high/stable**.
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200: { description: Order details }
 *       403: { description: Not your order (medium+) }
 *       404: { description: Not found }
 */
router.get("/:id", authenticate, async (req, res) => {
  const level = req.qaLevel;
  try {
    B.validateObjectId(level, req.params.id);
    const order = await Order.findById(req.params.id).populate("user", "name email");
    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }
    B.assertOrderAccess(level, order, req.user, "view"); // throws 403 at medium+
    res.json(order);
  } catch (err) {
    B.sendError(res, level, err);
  }
});

/**
 * @swagger
 * /api/orders/{id}/status:
 *   patch:
 *     tags: [Orders]
 *     summary: Update order status (Admin only)
 *     description: |
 *       **Defects to find (low):**
 *       - Status can jump anywhere (e.g. pending → delivered) with no lifecycle.
 *       - An invalid status value returns **500** instead of **400**.
 *
 *       At **medium** the value is validated (400); at **high/stable** the full
 *       lifecycle is enforced (409 on illegal transitions).
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
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
 *     responses:
 *       200: { description: Status updated }
 *       400: { description: Invalid status (medium+) }
 *       404: { description: Order not found }
 *       409: { description: Illegal transition (high+) }
 */
router.patch("/:id/status", authenticate, requireAdmin, async (req, res) => {
  const level = req.qaLevel;
  try {
    B.validateObjectId(level, req.params.id);
    const order = await Order.findById(req.params.id);
    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }
    B.validateStatusChange(level, order.status, req.body.status); // 400/409 at medium+
    order.status = req.body.status;
    // Validation runs on save: at low an invalid enum value reaches here and
    // surfaces as a 500 (the classic "wrong status code" defect); medium+ is
    // already guarded above so only valid values get this far.
    await order.save();
    res.json({ message: "Order status updated", order });
  } catch (err) {
    B.sendError(res, level, err);
  }
});

/**
 * @swagger
 * /api/orders/{id}/cancel:
 *   patch:
 *     tags: [Orders]
 *     summary: Cancel an order
 *     description: |
 *       **Defects to find (low):**
 *       - Any user can cancel any order (ownership not checked).
 *       - Already-delivered orders can be cancelled.
 *       - Stock is not restored on cancellation.
 *
 *       Ownership is enforced from **high**; delivered orders are protected from
 *       **high**; stock is restored at **stable**.
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200: { description: Order cancelled }
 *       403: { description: Not your order (high+) }
 *       404: { description: Order not found }
 *       409: { description: Cannot cancel (high+) }
 */
async function cancelOrder(req, res) {
  const level = req.qaLevel;
  try {
    B.validateObjectId(level, req.params.id);
    const order = await Order.findById(req.params.id);
    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }
    B.assertOrderAccess(level, order, req.user, "cancel"); // 403 at high+
    B.assertCancellable(level, order); // 409 at medium+ when inappropriate

    order.status = "cancelled";
    await order.save();

    if (B.restoresStockOnCancel(level)) {
      for (const item of order.items) {
        await Product.updateOne({ _id: item.product }, { $inc: { stock: item.quantity } });
      }
    }
    res.json({ message: "Order cancelled", order });
  } catch (err) {
    B.sendError(res, level, err);
  }
}

// Accept both PATCH (canonical) and PUT (used by the original UI).
router.patch("/:id/cancel", authenticate, cancelOrder);
router.put("/:id/cancel", authenticate, cancelOrder);

module.exports = router;
