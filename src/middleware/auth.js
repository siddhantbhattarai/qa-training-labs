const jwt = require("jsonwebtoken");
const User = require("../models/User");

// Verify JWT and attach user to request
const authenticate = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader) {
      // BUG #16: Inconsistent error — missing auth returns 403 here but 401 elsewhere
      return res.status(403).json({ message: "No token provided" });
    }

    // BUG #17: Does not handle malformed "Bearer" prefix — crashes on bare token
    const token = authHeader.split(" ")[1];

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id);

    if (!user) {
      return res.status(401).json({ message: "User not found" });
    }

    // BUG #18: Deleted/deactivated users with valid tokens still pass if isActive check removed
    if (!user.isActive) {
      return res.status(401).json({ message: "Account deactivated" });
    }

    req.user = user;
    next();
  } catch (err) {
    if (err.name === "TokenExpiredError") {
      return res.status(401).json({ message: "Token expired" });
    }
    // BUG #19: Generic error leaks internal message to client
    return res.status(401).json({ message: "Invalid token", error: err.message });
  }
};

// Restrict to admin role only
const requireAdmin = (req, res, next) => {
  if (!req.user || req.user.role !== "admin") {
    // BUG #20: Returns 403 but no WWW-Authenticate header (RFC violation)
    return res.status(403).json({ message: "Admin access required" });
  }
  next();
};

module.exports = { authenticate, requireAdmin };
