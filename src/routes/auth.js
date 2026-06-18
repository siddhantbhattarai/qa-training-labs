const express = require("express");
const jwt = require("jsonwebtoken");
const User = require("../models/User");
const { authenticate } = require("../middleware/auth");
const B = require("../lab/behaviors");

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
 *       Creates a new account. **Behaviour changes with the difficulty level.**
 *
 *       **Defects to find (low):**
 *       - The `role` field from the body is honoured — accounts are created
 *         with permissions the user shouldn't be able to choose.
 *       - No email-format validation ("not-an-email" is accepted).
 *       - Password rule is weak (only length >= 6).
 *       - A duplicate email returns **500** instead of **409 Conflict**.
 *
 *       At **medium/high** the obvious cases are fixed but boundary cases remain;
 *       at **stable** registration is fully correct.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [name, email, password]
 *             properties:
 *               name: { type: string, example: Jane Doe }
 *               email: { type: string, example: jane@example.com }
 *               password: { type: string, example: secret123 }
 *               role:
 *                 type: string
 *                 example: admin
 *                 description: "Should be ignored — at low it is wrongly applied."
 *     responses:
 *       201: { description: User registered }
 *       400: { description: Validation error }
 *       409: { description: Email already registered (medium+) }
 */
router.post("/register", async (req, res) => {
  const level = req.qaLevel;
  try {
    const { name, email, password, role } = req.body;

    B.validateName(level, name);
    B.validateEmail(level, email);
    B.validatePassword(level, password);

    const user = new User({
      name,
      email,
      password,
      role: B.registerRole(level, role),
    });
    await user.save();

    const { accessToken, refreshToken } = generateTokens(user);
    user.refreshToken = refreshToken;
    await user.save();

    res.status(201).json({
      message: "User registered successfully",
      user: B.serializeUser(level, user),
      accessToken,
      refreshToken,
    });
  } catch (err) {
    if (B.isDuplicateKey(err)) {
      const { status, body } = B.duplicateEmailResponse(level);
      return res.status(status).json(body);
    }
    B.sendError(res, level, err);
  }
});

/**
 * @swagger
 * /api/auth/login:
 *   post:
 *     tags: [Auth]
 *     summary: Login with email and password
 *     description: |
 *       Authenticates a user and returns JWT tokens.
 *
 *       **Defect to find (low):** failed attempts are counted but the account
 *       never locks. At **medium+** the account locks after repeated failures.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email, password]
 *             properties:
 *               email: { type: string, example: admin@qalab.com }
 *               password: { type: string, example: Admin@1234 }
 *     responses:
 *       200: { description: Login successful }
 *       400: { description: Missing credentials }
 *       401: { description: Invalid credentials }
 *       429: { description: Account locked (medium+) }
 */
router.post("/login", async (req, res) => {
  const level = req.qaLevel;
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ message: "Email and password are required" });
    }

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    B.assertNotLocked(level, user); // throws 429 when locked (medium+)

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      B.recordLoginFailure(level, user);
      await user.save();
      return res.status(401).json({ message: "Invalid credentials" });
    }

    user.loginAttempts = 0;
    user.lockUntil = null;
    user.lastLogin = new Date();
    const { accessToken, refreshToken } = generateTokens(user);
    user.refreshToken = refreshToken;
    await user.save();

    res.status(200).json({
      message: "Login successful",
      user: B.serializeUser(level, user),
      accessToken,
      refreshToken,
    });
  } catch (err) {
    B.sendError(res, level, err);
  }
});

/**
 * @swagger
 * /api/auth/refresh:
 *   post:
 *     tags: [Auth]
 *     summary: Refresh access token
 *     description: |
 *       Exchanges a refresh token for a new access token.
 *
 *       **Defect to find (low):** the old refresh token is NOT invalidated —
 *       a previously used refresh token still works. At **medium+** refresh
 *       tokens are single-use (rotated on every refresh).
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [refreshToken]
 *             properties:
 *               refreshToken: { type: string }
 *     responses:
 *       200: { description: New access token issued }
 *       401: { description: Invalid or missing refresh token }
 */
router.post("/refresh", async (req, res) => {
  const level = req.qaLevel;
  try {
    const { refreshToken } = req.body;
    if (!refreshToken) {
      return res.status(401).json({ message: "Refresh token required" });
    }

    const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);
    const user = await User.findById(decoded.id);
    if (!user) {
      return res.status(401).json({ message: "Invalid refresh token" });
    }

    // medium+: the supplied token must be the current one (single-use rotation).
    if (B.rotatesRefreshToken(level) && user.refreshToken !== refreshToken) {
      return res.status(401).json({ message: "Invalid refresh token" });
    }

    const tokens = generateTokens(user);
    if (B.rotatesRefreshToken(level)) {
      user.refreshToken = tokens.refreshToken;
      await user.save();
    }

    res.json({ accessToken: tokens.accessToken, refreshToken: tokens.refreshToken });
  } catch (err) {
    res.status(401).json({ message: "Token refresh failed" });
  }
});

/**
 * @swagger
 * /api/auth/logout:
 *   post:
 *     tags: [Auth]
 *     summary: Logout current user
 *     description: |
 *       Ends the session. **Defect to find (low/medium):** the access token
 *       still works after logout. At **high/stable** the token is rejected
 *       immediately.
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       200: { description: Logged out }
 *       401: { description: Unauthorized }
 */
router.post("/logout", authenticate, async (req, res) => {
  const level = req.qaLevel;
  try {
    req.user.refreshToken = null;
    await req.user.save();
    if (B.blacklistOnLogout(level)) {
      B.blacklistToken(req.token);
    }
    res.json({ message: "Logged out successfully" });
  } catch (err) {
    B.sendError(res, level, err);
  }
});

/**
 * @swagger
 * /api/auth/me:
 *   get:
 *     tags: [Auth]
 *     summary: Get current user profile
 *     description: |
 *       **Defect to find (low):** returns internal fields (password hash,
 *       counters) that aren't part of the documented User schema. Compare the
 *       response body against the schema in the API docs.
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       200: { description: Current user data }
 *       401: { description: Unauthorized }
 */
router.get("/me", authenticate, (req, res) => {
  res.json(B.serializeUser(req.qaLevel, req.user));
});

module.exports = router;
