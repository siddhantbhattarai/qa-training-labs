const express = require("express");
const User = require("../models/User");
const { authenticate, requireAdmin } = require("../middleware/auth");

const router = express.Router();

/**
 * @swagger
 * /api/users:
 *   get:
 *     tags: [Users]
 *     summary: Get all users (Admin only)
 *     description: |
 *       Returns all registered users.
 *
 *       **🐛 Bugs to find:**
 *       - Returns password hash in response (toSafeObject not called)
 *       - No pagination
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of users (with password hashes — BUG)
 *       403:
 *         description: Admin only
 */
router.get("/", authenticate, requireAdmin, async (req, res) => {
  try {
    // BUG #53: .select("-password") not used — password hashes are returned
    const users = await User.find();
    res.json(users);
  } catch (err) {
    res.status(500).json({ message: "Failed to get users" });
  }
});

/**
 * @swagger
 * /api/users/{id}:
 *   get:
 *     tags: [Users]
 *     summary: Get user by ID (Admin only)
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
 *         description: User object (includes password hash — BUG)
 *       404:
 *         description: Not found
 */
router.get("/:id", authenticate, requireAdmin, async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ message: "User not found" });
    // BUG #54: Password hash exposed again
    res.json(user);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

/**
 * @swagger
 * /api/users/{id}:
 *   patch:
 *     tags: [Users]
 *     summary: Update user (Admin only)
 *     description: |
 *       **🐛 Bugs to find:**
 *       - Admin can update password to plaintext (no hash step for direct updates)
 *       - No validation on role field — can set arbitrary string
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               isActive:
 *                 type: boolean
 *               role:
 *                 type: string
 *     responses:
 *       200:
 *         description: Updated user
 */
router.patch("/:id", authenticate, requireAdmin, async (req, res) => {
  try {
    const { name, isActive, role } = req.body;
    // BUG #55: If password is sent in body, findByIdAndUpdate bypasses pre-save hook — stores plaintext
    const user = await User.findByIdAndUpdate(
      req.params.id,
      { name, isActive, role },
      { new: true }
    );
    if (!user) return res.status(404).json({ message: "User not found" });
    res.json({ message: "User updated", user: user.toSafeObject() });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

/**
 * @swagger
 * /api/users/{id}:
 *   delete:
 *     tags: [Users]
 *     summary: Delete user (Admin only)
 *     description: |
 *       Hard deletes a user.
 *
 *       **🐛 Bugs to find:**
 *       - Admin can delete themselves
 *       - Orphaned carts and orders remain after user deletion
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
 *         description: Deleted
 *       404:
 *         description: Not found
 */
router.delete("/:id", authenticate, requireAdmin, async (req, res) => {
  try {
    // BUG #56: Admin can delete their own account
    // BUG #57: No cascade — Cart and Orders for this user remain
    const user = await User.findByIdAndDelete(req.params.id);
    if (!user) return res.status(404).json({ message: "User not found" });
    res.json({ message: "User deleted" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
