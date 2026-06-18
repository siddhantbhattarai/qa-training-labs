const jwt = require("jsonwebtoken");
const User = require("../models/User");
const {
  missingTokenStatus,
  tokenErrorResponse,
  isTokenBlacklisted,
} = require("../lab/behaviors");

// Verify JWT and attach user to request.
// Behaviour (missing/invalid token handling, logout invalidation) varies by
// the active QA level — see src/lab/behaviors.js.
const authenticate = async (req, res, next) => {
  const level = req.qaLevel || "low";
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader) {
      // Defect at low: status code is inconsistent with the rest of the API.
      return res
        .status(missingTokenStatus(level))
        .json({ message: "No token provided" });
    }

    // Tolerate "Bearer <token>" and a bare token (low used to crash on this).
    const parts = authHeader.split(" ");
    const token = parts.length === 2 ? parts[1] : parts[0];

    // After logout, the token is rejected at high/stable (session truly ended).
    if (isTokenBlacklisted(token)) {
      return res.status(401).json({ message: "Session has ended. Please log in again." });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id);

    if (!user) {
      return res.status(401).json({ message: "User not found" });
    }
    if (!user.isActive) {
      return res.status(401).json({ message: "Account deactivated" });
    }

    req.user = user;
    req.token = token;
    next();
  } catch (err) {
    const { status, body } = tokenErrorResponse(level, err);
    return res.status(status).json(body);
  }
};

// Restrict to admin role only.
const requireAdmin = (req, res, next) => {
  if (!req.user || req.user.role !== "admin") {
    return res.status(403).json({ message: "Admin access required" });
  }
  next();
};

module.exports = { authenticate, requireAdmin };
