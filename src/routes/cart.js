const express = require("express");
const Cart = require("../models/Cart");
const Product = require("../models/Product");
const { authenticate } = require("../middleware/auth");

const router = express.Router();

/**
 * @swagger
 * /api/cart:
 *   get:
 *     tags: [Cart]
 *     summary: Get current user's cart
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: User's cart with items
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Cart'
 */
router.get("/", authenticate, async (req, res) => {
  try {
    const cart = await Cart.findOne({ user: req.user._id }).populate(
      "items.product",
      "name price stock isActive"
    );

    if (!cart) {
      return res.json({ user: req.user._id, items: [], total: 0 });
    }

    // BUG #35: total uses floating-point math, not rounded (e.g. 29.99 * 3 = 89.97000000000001)
    const total = cart.items.reduce(
      (sum, item) => sum + item.priceAtAdd * item.quantity,
      0
    );

    res.json({ ...cart.toObject(), total });
  } catch (err) {
    res.status(500).json({ message: "Failed to get cart", error: err.message });
  }
});

/**
 * @swagger
 * /api/cart/add:
 *   post:
 *     tags: [Cart]
 *     summary: Add item to cart
 *     description: |
 *       Adds a product to the user's cart. Creates cart if it doesn't exist.
 *
 *       **🐛 Bugs to find:**
 *       - `quantity: 0` or negative quantity is accepted
 *       - Out-of-stock products can be added
 *       - Price snapshot is taken at add time but never refreshed (stale price bug)
 *       - Adding same product twice creates duplicate entry instead of incrementing quantity
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [productId, quantity]
 *             properties:
 *               productId:
 *                 type: string
 *                 example: "64a1f2b3c4d5e6f7a8b9c0d1"
 *               quantity:
 *                 type: integer
 *                 example: 2
 *     responses:
 *       200:
 *         description: Item added to cart
 *       404:
 *         description: Product not found
 */
router.post("/add", authenticate, async (req, res) => {
  try {
    const { productId, quantity } = req.body;

    if (!productId) {
      return res.status(400).json({ message: "productId is required" });
    }

    // BUG #36: quantity=0 or negative not rejected here
    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }

    // BUG #37: Stock check missing — can add out-of-stock items
    // BUG #38: Inactive product check missing

    let cart = await Cart.findOne({ user: req.user._id });
    if (!cart) {
      cart = new Cart({ user: req.user._id, items: [] });
    }

    // BUG #39: Duplicate detection missing — same product pushed as new item
    cart.items.push({
      product: product._id,
      quantity: quantity || 1,
      priceAtAdd: product.price, // price snapshot (never updated — stale price bug)
    });

    await cart.save();
    res.json({ message: "Item added to cart", cart });
  } catch (err) {
    res.status(500).json({ message: "Failed to add item", error: err.message });
  }
});

/**
 * @swagger
 * /api/cart/remove/{itemId}:
 *   delete:
 *     tags: [Cart]
 *     summary: Remove item from cart
 *     description: |
 *       Removes a specific cart item by its subdocument ID.
 *
 *       **🐛 Bugs to find:**
 *       - Returns 200 even if item ID doesn't exist in the cart (silent failure)
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: itemId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Item removed (even if not found — BUG)
 *       404:
 *         description: Cart not found
 */
router.delete("/remove/:itemId", authenticate, async (req, res) => {
  try {
    const cart = await Cart.findOne({ user: req.user._id });
    if (!cart) {
      return res.status(404).json({ message: "Cart not found" });
    }

    // BUG #40: No check that itemId actually existed — always returns success
    cart.items = cart.items.filter(
      (item) => item._id.toString() !== req.params.itemId
    );

    await cart.save();
    res.json({ message: "Item removed", cart });
  } catch (err) {
    res.status(500).json({ message: "Failed to remove item", error: err.message });
  }
});

/**
 * @swagger
 * /api/cart/clear:
 *   delete:
 *     tags: [Cart]
 *     summary: Clear entire cart
 *     description: Removes all items from the cart. No confirmation required.
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Cart cleared
 *       404:
 *         description: Cart not found
 */
router.delete("/clear", authenticate, async (req, res) => {
  try {
    const cart = await Cart.findOne({ user: req.user._id });
    if (!cart) {
      return res.status(404).json({ message: "No cart to clear" });
    }
    cart.items = [];
    await cart.save();
    res.json({ message: "Cart cleared" });
  } catch (err) {
    res.status(500).json({ message: "Failed to clear cart" });
  }
});

module.exports = router;
