const express = require("express");
const User = require("../models/User");
const { authenticate, requireAdmin } = require("../middleware/auth");
const B = require("../lab/behaviors");

const router = express.Router();

/**
 * @swagger
 * /api/users/profile:
 *   get:
 *     tags: [Users]
 *     summary: Get the current user's profile
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       200: { description: Current user profile }
 *       401: { description: Unauthorized }
 */
router.get("/profile", authenticate, async (req, res) => {
  const level = req.qaLevel;
  try {
    const user = await User.findById(req.user._id);
    if (!user) return res.status(404).json({ message: "User not found" });
    res.json(B.serializeUser(level, user));
  } catch (err) {
    B.sendError(res, level, err);
  }
});

/**
 * @swagger
 * /api/users/profile:
 *   put:
 *     tags: [Users]
 *     summary: Update the current user's profile
 *     description: |
 *       Updates the logged-in user's own profile.
 *
 *       **Defect to find (low/medium):** "edit profile" accepts ANY field from
 *       the body, so sending `role` or `isActive` changes them — a user can
 *       silently upgrade their own account. Send extra fields and check the
 *       result. At **high/stable** only the `name` field is updatable.
 *     security: [{ bearerAuth: [] }]
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name: { type: string }
 *     responses:
 *       200: { description: Profile updated }
 */
router.put("/profile", authenticate, async (req, res) => {
  const level = req.qaLevel;
  try {
    const update = B.pickProfileUpdate(level, req.body);
    const user = await User.findByIdAndUpdate(req.user._id, update, { new: true });
    res.json({ message: "Profile updated", user: B.serializeUser(level, user) });
  } catch (err) {
    B.sendError(res, level, err);
  }
});

/**
 * @swagger
 * /api/users:
 *   get:
 *     tags: [Users]
 *     summary: Get all users (Admin only)
 *     description: |
 *       **Defect to find (low):** the response includes each user's password
 *       hash and internal fields — not part of the documented User schema.
 *       Cleaned up at **medium**, fully safe at **high/stable**.
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       200: { description: List of users }
 *       403: { description: Admin only }
 */
router.get("/", authenticate, requireAdmin, async (req, res) => {
  const level = req.qaLevel;
  try {
    const users = await User.find();
    res.json(B.serializeUsers(level, users));
  } catch (err) {
    B.sendError(res, level, err);
  }
});

/**
 * @swagger
 * /api/users/{id}:
 *   get:
 *     tags: [Users]
 *     summary: Get a user by ID (Admin only)
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200: { description: User object }
 *       404: { description: Not found }
 */
router.get("/:id", authenticate, requireAdmin, async (req, res) => {
  const level = req.qaLevel;
  try {
    B.validateObjectId(level, req.params.id);
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ message: "User not found" });
    res.json(B.serializeUser(level, user));
  } catch (err) {
    B.sendError(res, level, err);
  }
});

/**
 * @swagger
 * /api/users/{id}:
 *   patch:
 *     tags: [Users]
 *     summary: Update a user (Admin only)
 *     description: |
 *       **Defect to find (low/medium):** if a `password` is sent it is saved
 *       in plain text (the update path skips the hashing step). At **high/stable**
 *       the password is hashed correctly.
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name: { type: string }
 *               isActive: { type: boolean }
 *               role: { type: string }
 *               password: { type: string }
 *     responses:
 *       200: { description: Updated user }
 */
router.patch("/:id", authenticate, requireAdmin, async (req, res) => {
  const level = req.qaLevel;
  try {
    B.validateObjectId(level, req.params.id);
    const { name, isActive, role, password } = req.body;

    let user;
    if (B.adminUserUpdateUsesSave(level)) {
      // high/stable: load + save so the password hashing hook runs.
      user = await User.findById(req.params.id);
      if (!user) return res.status(404).json({ message: "User not found" });
      if (name !== undefined) user.name = name;
      if (isActive !== undefined) user.isActive = isActive;
      if (role !== undefined) user.role = role;
      if (password !== undefined) user.password = password; // hashed by pre-save hook
      await user.save();
    } else {
      // low/medium: direct update — a supplied password is stored in plain text.
      user = await User.findByIdAndUpdate(
        req.params.id,
        { name, isActive, role, ...(password !== undefined && { password }) },
        { new: true }
      );
      if (!user) return res.status(404).json({ message: "User not found" });
    }
    res.json({ message: "User updated", user: B.serializeUser(level, user) });
  } catch (err) {
    B.sendError(res, level, err);
  }
});

/**
 * @swagger
 * /api/users/{id}:
 *   delete:
 *     tags: [Users]
 *     summary: Delete a user (Admin only)
 *     description: |
 *       **Defects to find (low):**
 *       - An admin can delete their own account.
 *       - The user's carts and orders are left orphaned.
 *
 *       Self-delete is blocked from **medium**; cascade clean-up happens at
 *       **high/stable**.
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200: { description: Deleted }
 *       400: { description: Cannot delete yourself (medium+) }
 *       404: { description: Not found }
 */
router.delete("/:id", authenticate, requireAdmin, async (req, res) => {
  const level = req.qaLevel;
  try {
    B.validateObjectId(level, req.params.id);

    if (B.blocksAdminSelfDelete(level) && req.params.id === req.user._id.toString()) {
      return res.status(400).json({ message: "You cannot delete your own account" });
    }

    const user = await User.findByIdAndDelete(req.params.id);
    if (!user) return res.status(404).json({ message: "User not found" });

    if (B.cascadesUserDelete(level)) {
      const Cart = require("../models/Cart");
      const Order = require("../models/Order");
      await Promise.all([
        Cart.deleteMany({ user: user._id }),
        Order.deleteMany({ user: user._id }),
      ]);
    }
    res.json({ message: "User deleted" });
  } catch (err) {
    B.sendError(res, level, err);
  }
});

module.exports = router;
