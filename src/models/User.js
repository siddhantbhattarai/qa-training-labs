const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

/**
 * @swagger
 * components:
 *   schemas:
 *     User:
 *       type: object
 *       properties:
 *         _id:
 *           type: string
 *         name:
 *           type: string
 *         email:
 *           type: string
 *         role:
 *           type: string
 *           enum: [user, admin]
 *         isActive:
 *           type: boolean
 *         createdAt:
 *           type: string
 *           format: date-time
 */
const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      // BUG #1: No maxLength — name can be 10,000 chars
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      // BUG #2: No regex email validation at model level
    },
    password: {
      type: String,
      required: true,
      // BUG #3: No minLength enforced here (only inconsistently in route)
    },
    role: {
      type: String,
      enum: ["user", "admin"],
      default: "user",
      // BUG #4: Role can be set directly via register endpoint
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    refreshToken: {
      type: String,
      default: null,
    },
    loginAttempts: {
      type: Number,
      default: 0,
      // BUG #5: Tracked but never used to lock account
    },
    lastLogin: {
      type: Date,
      default: null,
    },
  },
  { timestamps: true }
);

// Hash password before saving
userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();
  // BUG #6: Salt rounds = 8 (should be 10-12 for production)
  this.password = await bcrypt.hash(this.password, 8);
  next();
});

userSchema.methods.comparePassword = async function (candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

// BUG #7: toJSON does NOT strip password — raw .find() calls expose hash
userSchema.methods.toSafeObject = function () {
  const obj = this.toObject();
  delete obj.password;
  delete obj.refreshToken;
  return obj;
};

module.exports = mongoose.model("User", userSchema);
