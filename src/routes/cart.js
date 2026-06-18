const express = require("express");
const Cart = require("../models/Cart");
const Product = require("../models/Product");
const { authenticate } = require("../middleware/auth");
const B = require("../lab/behaviors");

const router = express.Router();

/**
 * @swagger
 * /api/cart:
 *   get:
 *     tags: [Cart]
 *     summary: Get current user's cart
 *     description: |
 *       **Defect to find (low):** the cart `total` is raw floating-point math
 *       (e.g. 89.97000000000001). At **medium+** it is rounded to 2 decimals.
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       200: { description: User's cart with items }
 */
router.get("/", authenticate, async (req, res) => {
  const level = req.qaLevel;
  try {
    const cart = await Cart.findOne({ user: req.user._id }).populate(
      "items.product",
      "name price stock isActive"
    );
    if (!cart) {
      return res.json({ user: req.user._id, items: [], total: 0 });
    }
    const total = B.computeCartTotal(level, cart.items);
    res.json({ ...cart.toObject(), total });
  } catch (err) {
    B.sendError(res, level, err);
  }
});

/**
 * @swagger
 * /api/cart/add:
 *   post:
 *     tags: [Cart]
 *     summary: Add item to cart
 *     description: |
 *       **Defects to find (low):**
 *       - `quantity: 0` or a negative quantity is accepted.
 *       - Out-of-stock and inactive products can be added.
 *       - Adding the same product twice creates duplicate lines instead of
 *         merging quantities.
 *
 *       Each higher level closes one more of these gaps; **stable** is correct.
 *     security: [{ bearerAuth: [] }]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [productId, quantity]
 *             properties:
 *               productId: { type: string }
 *               quantity: { type: integer, example: 2 }
 *     responses:
 *       200: { description: Item added }
 *       400: { description: Invalid quantity (medium+) }
 *       404: { description: Product not found }
 *       409: { description: Out of stock / unavailable (medium+) }
 */
router.post("/add", authenticate, async (req, res) => {
  const level = req.qaLevel;
  try {
    const { productId, quantity } = req.body;
    if (!productId) {
      return res.status(400).json({ message: "productId is required" });
    }
    B.validateObjectId(level, productId);

    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }

    const qty = B.validateCartAdd(level, product, quantity); // throws 400/409 at medium+

    let cart = await Cart.findOne({ user: req.user._id });
    if (!cart) {
      cart = new Cart({ user: req.user._id, items: [] });
    }

    B.addOrMergeCartItem(level, cart, product, qty);
    await cart.save();
    res.json({ message: "Item added to cart", cart });
  } catch (err) {
    B.sendError(res, level, err);
  }
});

/**
 * @swagger
 * /api/cart/remove/{itemId}:
 *   delete:
 *     tags: [Cart]
 *     summary: Remove item from cart
 *     description: |
 *       **Defect to find (low):** returns 200 even when the item id isn't in
 *       the cart (silent failure). At **medium+** a missing item returns 404.
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: itemId
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200: { description: Item removed }
 *       404: { description: Item or cart not found }
 */
router.delete("/remove/:itemId", authenticate, async (req, res) => {
  const level = req.qaLevel;
  try {
    const cart = await Cart.findOne({ user: req.user._id });
    if (!cart) {
      return res.status(404).json({ message: "Cart not found" });
    }
    B.removeCartItem(level, cart, req.params.itemId); // throws 404 at medium+ when missing
    await cart.save();
    res.json({ message: "Item removed", cart });
  } catch (err) {
    B.sendError(res, level, err);
  }
});

/**
 * @swagger
 * /api/cart/clear:
 *   delete:
 *     tags: [Cart]
 *     summary: Clear entire cart
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       200: { description: Cart cleared }
 *       404: { description: Cart not found }
 */
router.delete("/clear", authenticate, async (req, res) => {
  const level = req.qaLevel;
  try {
    const cart = await Cart.findOne({ user: req.user._id });
    if (!cart) {
      return res.status(404).json({ message: "No cart to clear" });
    }
    cart.items = [];
    await cart.save();
    res.json({ message: "Cart cleared" });
  } catch (err) {
    B.sendError(res, level, err);
  }
});

module.exports = router;
