const express = require("express");
const Product = require("../models/Product");
const { authenticate, requireAdmin } = require("../middleware/auth");
const B = require("../lab/behaviors");

const router = express.Router();

/**
 * @swagger
 * /api/products:
 *   get:
 *     tags: [Products]
 *     summary: Get all products
 *     description: |
 *       Public product list.
 *
 *       **Defects to find (low):**
 *       - Inactive/hidden products (`isActive: false`) are returned to shoppers.
 *       - `page` is accepted but ignored — there is no pagination.
 *
 *       At **high/stable** inactive products are hidden and pagination works.
 *     parameters:
 *       - in: query
 *         name: category
 *         schema: { type: string }
 *       - in: query
 *         name: page
 *         schema: { type: integer }
 *       - in: query
 *         name: limit
 *         schema: { type: integer }
 *     responses:
 *       200: { description: List of products }
 */
router.get("/", async (req, res) => {
  const level = req.qaLevel;
  try {
    const { filter, skip, limit, paginated, page } = B.buildProductListing(level, req.query);
    let query = Product.find(filter);
    if (paginated) query = query.skip(skip).limit(limit);
    const products = await query;
    const serialized = products.map((p) => B.serializeProduct(level, p));

    if (paginated) {
      const total = await Product.countDocuments(filter);
      return res.json({ page, limit, total, products: serialized });
    }
    res.json(serialized);
  } catch (err) {
    B.sendError(res, level, err);
  }
});

/**
 * @swagger
 * /api/products/{id}:
 *   get:
 *     tags: [Products]
 *     summary: Get product by ID
 *     description: |
 *       **Defect to find (low):** a malformed id returns **500** instead of a
 *       clean **400/404**. At **medium+** the id is validated first.
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200: { description: Product found }
 *       400: { description: Invalid id (medium+) }
 *       404: { description: Product not found }
 */
router.get("/:id", async (req, res) => {
  const level = req.qaLevel;
  try {
    B.validateObjectId(level, req.params.id); // throws 400 at medium+
    const product = await Product.findById(req.params.id);
    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }
    res.json(B.serializeProduct(level, product));
  } catch (err) {
    B.sendError(res, level, err);
  }
});

/**
 * @swagger
 * /api/products:
 *   post:
 *     tags: [Products]
 *     summary: Create a product (Admin only)
 *     description: |
 *       **Defects to find (low):**
 *       - A negative price is accepted.
 *       - A discount greater than 100% is accepted.
 *       - A missing required field returns **500** instead of **400**.
 *
 *       Validation tightens at each level; **stable** validates everything.
 *     security: [{ bearerAuth: [] }]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [name, price]
 *             properties:
 *               name: { type: string, example: Mechanical Keyboard }
 *               description: { type: string }
 *               price: { type: number, example: 79.99 }
 *               category: { type: string, example: Electronics }
 *               stock: { type: integer, example: 50 }
 *               discount: { type: number, example: 10 }
 *     responses:
 *       201: { description: Product created }
 *       400: { description: Validation error (medium+) }
 *       403: { description: Admin only }
 */
router.post("/", authenticate, requireAdmin, async (req, res) => {
  const level = req.qaLevel;
  try {
    B.validateProductInput(level, req.body);
    const { name, description, price, category, stock, discount } = req.body;
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
    res.status(201).json({
      message: "Product created",
      product: B.serializeProduct(level, product),
    });
  } catch (err) {
    B.sendError(res, level, err);
  }
});

/**
 * @swagger
 * /api/products/{id}:
 *   put:
 *     tags: [Products]
 *     summary: Update a product (Admin only)
 *     description: |
 *       **Defect to find (low):** the whole request body is written to the
 *       record, so fields that shouldn't change (e.g. `createdBy`) can be
 *       overwritten. At **high/stable** only known product fields are updated.
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200: { description: Product updated }
 *       404: { description: Not found }
 */
router.put("/:id", authenticate, requireAdmin, async (req, res) => {
  const level = req.qaLevel;
  try {
    B.validateObjectId(level, req.params.id);
    B.validateProductInput(level, req.body, { partial: true });
    const update = B.pickProductUpdate(level, req.body);
    const product = await Product.findByIdAndUpdate(
      req.params.id,
      { $set: update },
      { new: true, runValidators: level !== "low" }
    );
    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }
    res.json({ message: "Product updated", product: B.serializeProduct(level, product) });
  } catch (err) {
    B.sendError(res, level, err);
  }
});

/**
 * @swagger
 * /api/products/{id}:
 *   delete:
 *     tags: [Products]
 *     summary: Delete a product (Admin only)
 *     description: |
 *       **Defect to find (low):** a hard delete leaves orphaned references in
 *       existing carts and orders. At **high/stable** the product is soft-deleted
 *       (`isActive: false`) so historical references stay valid.
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200: { description: Product deleted }
 *       404: { description: Not found }
 */
router.delete("/:id", authenticate, requireAdmin, async (req, res) => {
  const level = req.qaLevel;
  try {
    B.validateObjectId(level, req.params.id);
    let product;
    if (B.productDeleteStrategy(level) === "soft") {
      product = await Product.findByIdAndUpdate(
        req.params.id,
        { isActive: false },
        { new: true }
      );
    } else {
      product = await Product.findByIdAndDelete(req.params.id);
    }
    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }
    res.json({ message: "Product deleted" });
  } catch (err) {
    B.sendError(res, level, err);
  }
});

module.exports = router;
