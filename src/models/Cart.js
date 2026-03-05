const mongoose = require("mongoose");

/**
 * @swagger
 * components:
 *   schemas:
 *     CartItem:
 *       type: object
 *       properties:
 *         product:
 *           type: string
 *           description: Product ID
 *         quantity:
 *           type: integer
 *           example: 2
 *         priceAtAdd:
 *           type: number
 *           example: 29.99
 *     Cart:
 *       type: object
 *       properties:
 *         _id:
 *           type: string
 *         user:
 *           type: string
 *         items:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/CartItem'
 *         updatedAt:
 *           type: string
 *           format: date-time
 */
const cartItemSchema = new mongoose.Schema({
  product: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Product",
    required: true,
  },
  quantity: {
    type: Number,
    required: true,
    // BUG #11: No min:1 — quantity 0 or negative is accepted
  },
  priceAtAdd: {
    type: Number,
    required: true,
    // Captures price at time of adding (intentionally not always updated)
  },
});

const cartSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
    },
    items: [cartItemSchema],
  },
  { timestamps: true }
);

// BUG #12: Total is computed but floating point math is not rounded
cartSchema.virtual("total").get(function () {
  return this.items.reduce(
    (sum, item) => sum + item.priceAtAdd * item.quantity,
    0
  );
});

module.exports = mongoose.model("Cart", cartSchema);
