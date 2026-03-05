const express = require("express");
const Product = require("../models/Product");
const { authenticate, requireAdmin } = require("../middleware/auth");

const router = express.Router();

/**
 * @swagger
 * /api/products:
 *   get:
 *     tags: [Products]
 *     summary: Get all products
 *     description: |
 *       Returns product list. Public endpoint.
 *
 *       **🐛 Bugs to find:**
 *       - No pagination — returns ALL products (performance issue at scale)
 *       - Inactive products (`isActive: false`) are returned to public users
 *       - `page` query param is accepted but silently ignored
 *     parameters:
 *       - in: query
 *         name: category
 *         schema:
 *           type: string
 *         description: Filter by category
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *         description: "⚠️ BUG: Accepted but ignored — no pagination implemented"
 *     responses:
 *       200:
 *         description: List of products
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Product'
 */
router.get("/", async (req, res) => {
  try {
    const { category } = req.query;
    const filter = {};

    if (category) filter.category = category;

    // BUG #28: isActive filter NOT applied — deleted/hidden products are returned
    const products = await Product.find(filter);
    res.json(products);
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch products" });
  }
});

/**
 * @swagger
 * /api/products/{id}:
 *   get:
 *     tags: [Products]
 *     summary: Get product by ID
 *     description: |
 *       **🐛 Bugs to find:**
 *       - Invalid ObjectId format returns 500 (CastError) instead of 400
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Product found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Product'
 *       404:
 *         description: Product not found
 *       500:
 *         description: Server error (also fires on bad ID format — BUG)
 */
router.get("/:id", async (req, res) => {
  try {
    // BUG #29: No ObjectId validation — malformed ID throws CastError → 500
    const product = await Product.findById(req.params.id);
    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }
    res.json(product);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

/**
 * @swagger
 * /api/products:
 *   post:
 *     tags: [Products]
 *     summary: Create a new product (Admin only)
 *     description: |
 *       **🐛 Bugs to find:**
 *       - Negative price is accepted (no min:0 validation)
 *       - Discount > 100% is accepted
 *       - Missing `name` returns 500 (validation error not caught properly)
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [name, price]
 *             properties:
 *               name:
 *                 type: string
 *                 example: Mechanical Keyboard
 *               description:
 *                 type: string
 *                 example: TKL layout with blue switches
 *               price:
 *                 type: number
 *                 example: 79.99
 *               category:
 *                 type: string
 *                 example: Electronics
 *               stock:
 *                 type: integer
 *                 example: 50
 *               discount:
 *                 type: number
 *                 example: 10
 *     responses:
 *       201:
 *         description: Product created
 *       403:
 *         description: Admin only
 */
router.post("/", authenticate, requireAdmin, async (req, res) => {
  try {
    const { name, description, price, category, stock, discount } = req.body;

    // BUG #30: No server-side check for negative price or discount > 100
    const product = new Product({
      name,
      description,
      price,
      category,
      stock,
      discount,
      createdBy: req.user._id,
    });

    await product.save();
    // BUG #31: Returns 201 but also returns the raw product with createdBy exposed
    res.status(201).json({ message: "Product created", product });
  } catch (err) {
    // BUG #32: Mongoose validation error returns 500 instead of 400
    res.status(500).json({ message: "Failed to create product", error: err.message });
  }
});

/**
 * @swagger
 * /api/products/{id}:
 *   put:
 *     tags: [Products]
 *     summary: Update a product (Admin only)
 *     description: |
 *       **🐛 Bugs to find:**
 *       - Partial update replaces ALL fields not sent with undefined
 *       - `createdBy` can be overwritten via body
 *       - No check if product is active before updating
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
 *             $ref: '#/components/schemas/Product'
 *     responses:
 *       200:
 *         description: Product updated
 *       404:
 *         description: Not found
 */
router.put("/:id", authenticate, requireAdmin, async (req, res) => {
  try {
    // BUG #33: Uses $set with entire req.body — attacker can inject any field
    const product = await Product.findByIdAndUpdate(
      req.params.id,
      { $set: req.body },
      { new: true }
    );
    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }
    res.json({ message: "Product updated", product });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

/**
 * @swagger
 * /api/products/{id}:
 *   delete:
 *     tags: [Products]
 *     summary: Delete a product (Admin only)
 *     description: |
 *       Hard deletes the product from database.
 *
 *       **🐛 Bugs to find:**
 *       - Hard delete — product in existing carts/orders becomes orphaned reference
 *       - No check for existing cart/order references before deleting
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
 *         description: Product deleted
 *       404:
 *         description: Not found
 */
router.delete("/:id", authenticate, requireAdmin, async (req, res) => {
  try {
    // BUG #34: Hard delete with no check for references in Cart or Orders
    const product = await Product.findByIdAndDelete(req.params.id);
    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }
    res.json({ message: "Product deleted" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
