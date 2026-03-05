const mongoose = require("mongoose");

/**
 * @swagger
 * components:
 *   schemas:
 *     Product:
 *       type: object
 *       required:
 *         - name
 *         - price
 *       properties:
 *         _id:
 *           type: string
 *         name:
 *           type: string
 *           example: Wireless Mouse
 *         description:
 *           type: string
 *           example: Ergonomic wireless mouse with USB receiver
 *         price:
 *           type: number
 *           example: 29.99
 *         category:
 *           type: string
 *           example: Electronics
 *         stock:
 *           type: integer
 *           example: 100
 *         isActive:
 *           type: boolean
 *           example: true
 *         createdAt:
 *           type: string
 *           format: date-time
 */
const productSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      default: "",
    },
    price: {
      type: Number,
      required: true,
      // BUG #8: No min:0 — negative prices are accepted
    },
    category: {
      type: String,
      default: "Uncategorized",
    },
    stock: {
      type: Number,
      default: 0,
      // BUG #9: No min:0 — stock can go negative
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    discount: {
      type: Number,
      default: 0,
      // BUG #10: Discount can exceed 100% — no max validation
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Product", productSchema);
