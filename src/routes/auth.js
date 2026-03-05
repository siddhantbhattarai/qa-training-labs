const express = require("express");
const jwt = require("jsonwebtoken");
const User = require("../models/User");
const { authenticate } = require("../middleware/auth");

const router = express.Router();

const generateTokens = (user) => {
  const accessToken = jwt.sign(
    { id: user._id, role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || "1h" }
  );
  const refreshToken = jwt.sign(
    { id: user._id },
    process.env.JWT_REFRESH_SECRET,
    { expiresIn: process.env.JWT_REFRESH_EXPIRES_IN || "7d" }
  );
  return { accessToken, refreshToken };
};

/**
 * @swagger
 * /api/auth/register:
 *   post:
 *     tags: [Auth]
 *     summary: Register a new user
 *     description: |
 *       Creates a new user account. 
 *       
 *       **🐛 Bugs to find:**
 *       - `role` field in body is accepted and applied directly (privilege escalation)
 *       - No email format validation
 *       - Password length check is only >= 6 (too weak)
 *       - Duplicate email returns 500 instead of 409
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [name, email, password]
 *             properties:
 *               name:
 *                 type: string
 *                 example: Jane Doe
 *               email:
 *                 type: string
 *                 example: jane@example.com
 *               password:
 *                 type: string
 *                 example: secret123
 *               role:
 *                 type: string
 *                 example: admin
 *                 description: "⚠️ BUG: This field should be ignored but is applied"
 *     responses:
 *       201:
 *         description: User registered successfully
 *       400:
 *         description: Missing fields or password too short
 *       500:
 *         description: Server error (also fires on duplicate email — BUG)
 */
router.post("/register", async (req, res) => {
  try {
    const { name, email, password, role } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ message: "Name, email and password are required" });
    }

    // BUG #21: Password only checked >= 6 chars. No complexity requirement.
    if (password.length < 6) {
      return res.status(400).json({ message: "Password must be at least 6 characters" });
    }

    // BUG #22: role is accepted from body — anyone can self-register as admin
    const user = new User({ name, email, password, role });
    await user.save();

    const { accessToken, refreshToken } = generateTokens(user);
    user.refreshToken = refreshToken;
    await user.save();

    res.status(201).json({
      message: "User registered successfully",
      user: user.toSafeObject(),
      accessToken,
      refreshToken,
    });
  } catch (err) {
    // BUG #23: Duplicate key (email) error returns 500 + raw mongo error
    res.status(500).json({ message: "Registration failed", error: err.message });
  }
});

/**
 * @swagger
 * /api/auth/login:
 *   post:
 *     tags: [Auth]
 *     summary: Login with email and password
 *     description: |
 *       Authenticates user and returns JWT tokens.
 *
 *       **🐛 Bugs to find:**
 *       - No rate limiting on login (brute-force possible)
 *       - `loginAttempts` is tracked but account is never locked
 *       - Returns same error message for wrong email vs wrong password (good) BUT response time differs (timing attack)
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email, password]
 *             properties:
 *               email:
 *                 type: string
 *                 example: admin@qalab.com
 *               password:
 *                 type: string
 *                 example: Admin@1234
 *     responses:
 *       200:
 *         description: Login successful
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 user:
 *                   $ref: '#/components/schemas/User'
 *                 accessToken:
 *                   type: string
 *                 refreshToken:
 *                   type: string
 *       400:
 *         description: Missing credentials
 *       401:
 *         description: Invalid credentials
 */
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: "Email and password are required" });
    }

    const user = await User.findOne({ email });

    if (!user) {
      // BUG #24: Returns 401 for missing user — timing is faster than wrong password
      return res.status(401).json({ message: "Invalid credentials" });
    }

    const isMatch = await user.comparePassword(password);

    if (!isMatch) {
      // Increment attempts but never lock — BUG #5 manifest
      user.loginAttempts += 1;
      await user.save();
      return res.status(401).json({ message: "Invalid credentials" });
    }

    user.loginAttempts = 0;
    user.lastLogin = new Date();
    const { accessToken, refreshToken } = generateTokens(user);
    user.refreshToken = refreshToken;
    await user.save();

    res.status(200).json({
      message: "Login successful",
      user: user.toSafeObject(),
      accessToken,
      refreshToken,
    });
  } catch (err) {
    res.status(500).json({ message: "Login failed", error: err.message });
  }
});

/**
 * @swagger
 * /api/auth/refresh:
 *   post:
 *     tags: [Auth]
 *     summary: Refresh access token
 *     description: |
 *       Exchange a valid refresh token for a new access token.
 *
 *       **🐛 Bugs to find:**
 *       - JWT_REFRESH_SECRET is the same as JWT_SECRET (see .env) — refresh tokens are interchangeable
 *       - Old refresh token is NOT invalidated after refresh
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [refreshToken]
 *             properties:
 *               refreshToken:
 *                 type: string
 *     responses:
 *       200:
 *         description: New access token issued
 *       401:
 *         description: Invalid or missing refresh token
 */
router.post("/refresh", async (req, res) => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      return res.status(401).json({ message: "Refresh token required" });
    }

    const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);
    const user = await User.findById(decoded.id);

    if (!user || user.refreshToken !== refreshToken) {
      return res.status(401).json({ message: "Invalid refresh token" });
    }

    const { accessToken, refreshToken: newRefresh } = generateTokens(user);
    // BUG #25: Old refresh token stored in DB not immediately rotated/invalidated in all paths
    user.refreshToken = newRefresh;
    await user.save();

    res.json({ accessToken, refreshToken: newRefresh });
  } catch (err) {
    res.status(401).json({ message: "Token refresh failed", error: err.message });
  }
});

/**
 * @swagger
 * /api/auth/logout:
 *   post:
 *     tags: [Auth]
 *     summary: Logout current user
 *     description: Invalidates the stored refresh token server-side.
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Logged out
 *       401:
 *         description: Unauthorized
 */
router.post("/logout", authenticate, async (req, res) => {
  try {
    req.user.refreshToken = null;
    await req.user.save();
    // BUG #26: Access token is NOT blacklisted — still valid until expiry
    res.json({ message: "Logged out successfully" });
  } catch (err) {
    res.status(500).json({ message: "Logout failed" });
  }
});

/**
 * @swagger
 * /api/auth/me:
 *   get:
 *     tags: [Auth]
 *     summary: Get current user profile
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Current user data
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/User'
 *       401:
 *         description: Unauthorized
 */
router.get("/me", authenticate, (req, res) => {
  // BUG #27: Returns full user object without calling toSafeObject — exposes loginAttempts, etc.
  res.json(req.user);
});

module.exports = router;
