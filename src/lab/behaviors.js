/**
 * QA Training Lab — Level-aware Behaviours
 * ------------------------------------------------------------------
 * This is the single source of truth for HOW each intentional bug
 * behaves at each difficulty level (low / medium / high / stable).
 *
 * Route handlers stay readable: instead of hard-coding a bug, they call
 * a helper here and pass `req.qaLevel`. Want to know exactly what differs
 * between levels? It's all in this one file — and it lines up 1:1 with
 * the answer keys in /SOLUTIONS.
 *
 * Convention:
 *   - Validation helpers THROW a `LabError` (status + message) on failure.
 *     Routes catch it via `sendError(res, level, err)`.
 *   - Serializer helpers return a cleaned object.
 *   - "Strategy" helpers return booleans/values the route acts on.
 */

const mongoose = require("mongoose");

const LEVELS = ["low", "medium", "high", "stable"];
const at = (level) => LEVELS.indexOf(level); // numeric rank for >=/<= checks

/** A controlled error that maps directly to an HTTP response. */
class LabError extends Error {
  constructor(status, message) {
    super(message);
    this.name = "LabError";
    this.status = status;
    this.isLabError = true;
  }
}

/** Central catch helper used by every route. */
function sendError(res, level, err) {
  if (err && err.isLabError) {
    return res.status(err.status).json({ message: err.message });
  }
  return res.status(mapMongooseError(level, err).status).json(
    mapMongooseError(level, err).body
  );
}

/**
 * Mongoose / runtime errors → status + body, by level.
 * Defect being taught: wrong status codes & unhelpful error responses.
 * low    : 500 + raw internal error text (a tester should flag both)
 * medium : 400 (better) but the raw internal message still leaks through
 * high   : 400 with a clean, generic message
 * stable : 400 with a clean message, no internal details — correct.
 */
function mapMongooseError(level, err) {
  const isValidation =
    err && (err.name === "ValidationError" || err.name === "CastError");
  if (level === "low") {
    return {
      status: isValidation ? 500 : 500,
      body: { message: "Server error", error: err && err.message },
    };
  }
  if (level === "medium") {
    return {
      status: isValidation ? 400 : 500,
      body: { message: "Request failed", error: err && err.message },
    };
  }
  return {
    status: isValidation ? 400 : 500,
    body: { message: isValidation ? "Invalid request data" : "Server error" },
  };
}

/* ════════════════════════════════════════════════════════════════════
 *  AUTH
 * ══════════════════════════════════════════════════════════════════ */

/**
 * Role assignment at registration (BUG #4, #22).
 * Defect: a field the user should NOT control (`role`) is honoured from the
 * request body, so the account is created with the wrong permissions.
 */
function registerRole(level, requestedRole) {
  // low: whatever `role` the form sends is saved as-is → wrong account type.
  if (level === "low") return requestedRole || "user";
  // medium+: registration always creates a plain user.
  // (At medium the same defect still hides in PUT /users/profile — see pickProfileUpdate.)
  return "user";
}

/** Password strength (BUG #3, #21). Throws LabError(400) when too weak. */
function validatePassword(level, password) {
  if (!password) throw new LabError(400, "Password is required");
  const rules = {
    low: { min: 6 },
    medium: { min: 8 },
    high: { min: 8, needsLetterAndNumber: true },
    stable: { min: 8, needsLetterAndNumber: true, needsMixedCaseSpecial: true },
  }[level];

  if (password.length < rules.min) {
    throw new LabError(400, `Password must be at least ${rules.min} characters`);
  }
  if (rules.needsLetterAndNumber && !(/[a-zA-Z]/.test(password) && /\d/.test(password))) {
    throw new LabError(400, "Password must contain letters and numbers");
  }
  if (rules.needsMixedCaseSpecial) {
    const strong =
      /[a-z]/.test(password) &&
      /[A-Z]/.test(password) &&
      /\d/.test(password) &&
      /[^a-zA-Z0-9]/.test(password);
    const common = ["password", "12345678", "qwerty", "letmein", "admin123"];
    if (!strong) {
      throw new LabError(
        400,
        "Password must include upper & lower case, a number and a special character"
      );
    }
    if (common.includes(password.toLowerCase())) {
      throw new LabError(400, "Password is too common");
    }
  }
}

/** Email format validation (BUG #2). Throws on invalid (above low). */
function validateEmail(level, email) {
  if (!email) throw new LabError(400, "Email is required");
  if (level === "low") return; // anything goes — "not-an-email" is accepted
  // medium: naive check — only requires an "@", so "a@b" still slips through.
  if (level === "medium") {
    if (!email.includes("@")) throw new LabError(400, "Invalid email format");
    return;
  }
  // high: requires something@something.tld but still allows odd local parts.
  if (level === "high") {
    if (!/^.+@.+\..+$/.test(email)) throw new LabError(400, "Invalid email format");
    return;
  }
  // stable: RFC-ish, trims and rejects whitespace/edge cases.
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
  if (!re.test(email)) throw new LabError(400, "Invalid email format");
}

/** Name length guard (BUG #1). */
function validateName(level, name) {
  if (!name || !String(name).trim()) throw new LabError(400, "Name is required");
  if (level === "low" || level === "medium") return; // no max length
  if (String(name).length > 100) throw new LabError(400, "Name is too long (max 100)");
}

/** Duplicate-email handling on the catch path (BUG #23). */
function isDuplicateKey(err) {
  return err && err.code === 11000;
}
function duplicateEmailResponse(level) {
  // Defect being taught: a duplicate email should be a clean 409 Conflict,
  // not a 500 crash. (low returns the wrong status code.)
  if (level === "low") return { status: 500, body: { message: "Registration failed" } };
  return { status: 409, body: { message: "Email already registered" } };
}

/** Account lockout after repeated failed logins (BUG #5). */
function loginLockPolicy(level) {
  return {
    low: { enabled: false },
    medium: { enabled: true, max: 10, windowMs: 5 * 60 * 1000 },
    high: { enabled: true, max: 5, windowMs: 15 * 60 * 1000 },
    stable: { enabled: true, max: 5, windowMs: 15 * 60 * 1000 },
  }[level];
}
function assertNotLocked(level, user) {
  const policy = loginLockPolicy(level);
  if (!policy.enabled) return;
  if (user.lockUntil && user.lockUntil > new Date()) {
    throw new LabError(429, "Account temporarily locked. Try again later.");
  }
}
function recordLoginFailure(level, user) {
  const policy = loginLockPolicy(level);
  user.loginAttempts = (user.loginAttempts || 0) + 1;
  if (policy.enabled && user.loginAttempts >= policy.max) {
    user.lockUntil = new Date(Date.now() + policy.windowMs);
    user.loginAttempts = 0;
  }
}

/** Refresh-token rotation (BUG #25): should the old token be invalidated? */
function rotatesRefreshToken(level) {
  return at(level) >= at("medium");
}

/* ── Auth middleware behaviours (BUG #16–#20, #26) ──────────────────── */

/** Status code for a completely missing Authorization header (BUG #16). */
function missingTokenStatus(level) {
  return level === "low" ? 403 : 401; // low is inconsistent with the rest of the API
}

/** Response for a bad/expired/malformed token (BUG #17, #19). */
function tokenErrorResponse(level, err) {
  if (err && err.name === "TokenExpiredError") {
    return { status: 401, body: { message: "Token expired" } };
  }
  if (level === "low") {
    // returns the raw internal library message instead of a clean one
    return { status: 401, body: { message: "Invalid token", error: err && err.message } };
  }
  return { status: 401, body: { message: "Invalid or malformed token" } };
}

// In-memory list of logged-out tokens. Populated on logout at high/stable.
// Defect being taught: after logout the session should end — at low/medium
// the same token keeps working, which a tester can verify by reusing it.
const tokenBlacklist = new Set();
function blacklistOnLogout(level) {
  return at(level) >= at("high");
}
function blacklistToken(token) {
  if (token) tokenBlacklist.add(token);
}
function isTokenBlacklisted(token) {
  return tokenBlacklist.has(token);
}

/* ════════════════════════════════════════════════════════════════════
 *  SERIALIZERS  (control which fields the API response returns)
 * ══════════════════════════════════════════════════════════════════ */

/**
 * User serialization (BUG #7, #27, #53, #54).
 * Defect: API responses return internal fields that aren't part of the
 * documented contract (password hash, internal counters). A tester should
 * compare the response body against the documented User schema.
 */
function serializeUser(level, userDoc) {
  const obj = userDoc.toObject ? userDoc.toObject() : { ...userDoc };
  if (level === "low") return obj; // returns password hash + internal fields
  if (level === "medium") {
    delete obj.password; // hash hidden, but other internal fields still returned
    return obj;
  }
  // high/stable: only safe, public-facing fields
  delete obj.password;
  delete obj.refreshToken;
  delete obj.loginAttempts;
  delete obj.lockUntil;
  delete obj.__v;
  return obj;
}
function serializeUsers(level, docs) {
  return docs.map((d) => serializeUser(level, d));
}

/** Product serialization (BUG #31): hide internal `createdBy` above low. */
function serializeProduct(level, productDoc) {
  const obj = productDoc.toObject ? productDoc.toObject() : { ...productDoc };
  if (level === "low") return obj;
  delete obj.createdBy;
  delete obj.__v;
  return obj;
}

/* ════════════════════════════════════════════════════════════════════
 *  USERS
 * ══════════════════════════════════════════════════════════════════ */

/**
 * Profile self-update field handling.
 * Defect: "Edit profile" should only change a user's own profile fields
 * (e.g. name). At low/medium it accepts ANY field from the body, so editing
 * your profile can silently change your `role` or `isActive` — a data-integrity
 * defect a tester catches by sending extra fields and checking the result.
 */
function pickProfileUpdate(level, body) {
  // low & medium: whole body is applied → unexpected fields (role/isActive) stick.
  if (level === "low" || level === "medium") {
    const { _id, password, refreshToken, ...rest } = body || {};
    return rest;
  }
  // high/stable: only the fields a user is allowed to change.
  const out = {};
  if (typeof body.name === "string") out.name = body.name;
  return out;
}

/** Admin updating another user (BUG #55: plaintext password via update). */
function adminUserUpdateUsesSave(level) {
  // low/medium: route uses findByIdAndUpdate → pre-save hook skipped → plaintext.
  // high/stable: route loads the doc and uses .save() → password gets hashed.
  return at(level) >= at("high");
}

/** Admin self-delete guard (BUG #56). */
function blocksAdminSelfDelete(level) {
  return at(level) >= at("medium");
}

/** Cascade carts/orders on user delete (BUG #57). */
function cascadesUserDelete(level) {
  return at(level) >= at("high");
}

/* ════════════════════════════════════════════════════════════════════
 *  PRODUCTS
 * ══════════════════════════════════════════════════════════════════ */

/** Build list filter + pagination (BUG #28 + ignored `page`). */
function buildProductListing(level, query) {
  const filter = {};
  if (query.category) filter.category = query.category;

  // low: returns inactive products too. medium+: hide them.
  if (level !== "low") filter.isActive = true;

  // low/medium: `page` is accepted but ignored (no pagination).
  if (level === "low" || level === "medium") {
    return { filter, skip: 0, limit: 0, paginated: false };
  }
  // high/stable: real pagination.
  const page = Math.max(1, parseInt(query.page, 10) || 1);
  const limit = Math.min(50, Math.max(1, parseInt(query.limit, 10) || 10));
  return { filter, skip: (page - 1) * limit, limit, paginated: true, page };
}

/** ObjectId validation (BUG #29: bad id → 500). */
function validateObjectId(level, id) {
  if (level === "low") return; // invalid id falls through to a CastError → 500
  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw new LabError(400, "Invalid id format");
  }
}

/** Product create/update field validation (BUG #8, #10, #30). */
function validateProductInput(level, body, { partial = false } = {}) {
  const has = (k) => body[k] !== undefined && body[k] !== null;

  if (!partial) {
    if (!body.name || !String(body.name).trim())
      throw new LabError(400, "Product name is required");
    if (!has("price")) throw new LabError(400, "Price is required");
  }
  if (level === "low") return; // negative price & discount > 100 all accepted

  // medium: rejects negative price, but discount > 100% still slips through.
  if (has("price") && Number(body.price) < 0)
    throw new LabError(400, "Price cannot be negative");
  if (level === "medium") return;

  // high: also caps discount, but allows price === 0 ("free" item).
  if (has("discount") && (Number(body.discount) < 0 || Number(body.discount) > 100))
    throw new LabError(400, "Discount must be between 0 and 100");
  if (level === "high") return;

  // stable: full validation incl. non-zero price and non-negative stock.
  if (has("price") && Number(body.price) <= 0)
    throw new LabError(400, "Price must be greater than 0");
  if (has("stock") && Number(body.stock) < 0)
    throw new LabError(400, "Stock cannot be negative");
}

/**
 * Product update field handling (BUG #33).
 * Defect: "edit product" should only touch known product fields. At low it
 * writes whatever the body contains (e.g. an unintended `createdBy` change);
 * at medium it still lets unexpected fields through. A tester sends extra
 * fields and checks the saved record.
 */
function pickProductUpdate(level, body) {
  if (level === "low") return { ...body }; // any field, including ones that shouldn't change
  if (level === "medium") {
    // strips createdBy, but still lets the caller flip isActive / other fields
    const { _id, createdBy, ...rest } = body || {};
    return rest;
  }
  const allowed = ["name", "description", "price", "category", "stock", "discount", "isActive"];
  const out = {};
  for (const key of allowed) if (body[key] !== undefined) out[key] = body[key];
  return out;
}

/** Delete strategy (BUG #34: hard delete, no reference check). */
function productDeleteStrategy(level) {
  // low/medium: hard delete (orphans cart/order refs).
  // high/stable: soft delete (isActive=false) so references stay valid.
  return at(level) >= at("high") ? "soft" : "hard";
}

/* ════════════════════════════════════════════════════════════════════
 *  CART
 * ══════════════════════════════════════════════════════════════════ */

/** Quantity + stock + active validation on add (BUG #11, #36, #37, #38). */
function validateCartAdd(level, product, quantity) {
  const qty = Number(quantity);
  if (level === "low") return qty || 1; // 0, negative, NaN → coerced, anything goes

  if (!Number.isInteger(qty) || qty <= 0)
    throw new LabError(400, "Quantity must be a positive integer");

  if (level === "medium") {
    // checks the product isn't fully out of stock, but not against the qty asked for.
    if (product.stock <= 0) throw new LabError(409, "Product is out of stock");
    return qty;
  }

  // high/stable: must be active AND have enough stock for the requested qty.
  if (!product.isActive) throw new LabError(409, "Product is not available");
  if (qty > product.stock)
    throw new LabError(409, `Only ${product.stock} in stock`);
  return qty;
}

/** Add vs merge duplicate cart lines (BUG #39). */
function addOrMergeCartItem(level, cart, product, qty) {
  if (at(level) >= at("high")) {
    const existing = cart.items.find(
      (i) => i.product.toString() === product._id.toString()
    );
    if (existing) {
      existing.quantity += qty;
      return;
    }
  }
  cart.items.push({ product: product._id, quantity: qty, priceAtAdd: product.price });
}

/** Cart total, with float rounding above low (BUG #12, #35). */
function computeCartTotal(level, items) {
  const raw = items.reduce((sum, i) => sum + i.priceAtAdd * i.quantity, 0);
  if (level === "low") return raw; // 29.99 * 3 = 89.97000000000001
  return Math.round(raw * 100) / 100;
}

/** Remove cart item; 404 when missing above low (BUG #40). */
function removeCartItem(level, cart, itemId) {
  const before = cart.items.length;
  cart.items = cart.items.filter((i) => i._id.toString() !== itemId);
  if (level === "low") return; // silent success even if nothing was removed
  if (cart.items.length === before) {
    throw new LabError(404, "Item not found in cart");
  }
}

/* ════════════════════════════════════════════════════════════════════
 *  ORDERS
 * ══════════════════════════════════════════════════════════════════ */

/** Pre-flight checks before placing an order (BUG #41, #44). */
function validateOrderPlacement(level, cart, body) {
  if (level === "low") return; // empty cart → £0 order, no address needed

  if (!cart || cart.items.length === 0)
    throw new LabError(400, "Cannot place an order with an empty cart");
  if (level === "medium") return; // address still optional

  // high/stable: a shipping address is mandatory.
  const addr = body && body.shippingAddress;
  if (!addr || !addr.street || !addr.city || !addr.country)
    throw new LabError(400, "A complete shipping address is required");
}

/** Price used for each order line (BUG #43: stale snapshot vs current). */
function orderLinePrice(level, cartItem) {
  // low/medium/high: use the stale snapshot captured at add-time.
  // stable: use the product's CURRENT price.
  if (at(level) >= at("stable") && cartItem.product && typeof cartItem.product.price === "number") {
    return cartItem.product.price;
  }
  return cartItem.priceAtAdd;
}

/** Decrement stock when an order is placed (BUG #42). */
function decrementsStockOnOrder(level) {
  return at(level) >= at("high");
}

/** Clear the cart after checkout (BUG #45). */
function clearsCartAfterOrder(level) {
  return at(level) >= at("high");
}

/**
 * Order ownership rule (BUG #47, #50).
 * Defect: the spec says a user may only see/act on their OWN orders, but the
 * app doesn't enforce it — so order #1234 (someone else's) is reachable.
 * A tester verifies this by logging in as user A and requesting user B's order.
 * action: "view" | "cancel". Admins are allowed (per spec).
 */
function assertOrderAccess(level, order, user, action) {
  if (user.role === "admin") return;
  const owns = order.user.toString() === user._id.toString();

  if (level === "low") return; // rule not enforced anywhere
  if (level === "medium") {
    // viewing is now restricted, but cancelling still ignores the rule.
    if (action === "view" && !owns) throw new LabError(403, "Not your order");
    return;
  }
  // high/stable: rule enforced for every action.
  if (!owns) throw new LabError(403, "Not your order");
}

/** Order status transition rules (BUG #13, #48, #49). */
const ORDER_STATUSES = ["pending", "processing", "shipped", "delivered", "cancelled"];
const ORDER_TRANSITIONS = {
  pending: ["processing", "cancelled"],
  processing: ["shipped", "cancelled"],
  shipped: ["delivered"],
  delivered: [],
  cancelled: [],
};
function validateStatusChange(level, current, next) {
  if (level === "low") return; // any → any, invalid enum slips to a 500 later
  if (!ORDER_STATUSES.includes(next))
    throw new LabError(400, `Invalid status. Allowed: ${ORDER_STATUSES.join(", ")}`);
  if (level === "medium") return; // enum validated, but no state machine
  // high/stable: enforce the lifecycle.
  if (!ORDER_TRANSITIONS[current].includes(next)) {
    throw new LabError(409, `Cannot move an order from "${current}" to "${next}"`);
  }
}

/** Can this order be cancelled right now? (BUG #51) */
function assertCancellable(level, order) {
  if (level === "low") return; // even delivered orders can be cancelled
  if (order.status === "cancelled") throw new LabError(409, "Order is already cancelled");
  if (level === "medium") return; // delivered still (wrongly) cancellable
  if (order.status === "delivered")
    throw new LabError(409, "Delivered orders cannot be cancelled");
}

/** Restore stock when an order is cancelled (BUG #52). */
function restoresStockOnCancel(level) {
  return at(level) >= at("stable");
}

/* ════════════════════════════════════════════════════════════════════
 *  SEED / DESTRUCTIVE
 * ══════════════════════════════════════════════════════════════════ */

/** Require admin auth on the destructive reset endpoint (BUG #58). */
function resetRequiresAdmin(level) {
  return at(level) >= at("high");
}

/* ════════════════════════════════════════════════════════════════════
 *  GENERIC PAGINATION + ERROR ENVELOPE
 * ══════════════════════════════════════════════════════════════════ */

/**
 * Global error response (defect: unfriendly errors).
 * At low the raw internal stack trace is dumped into the JSON response —
 * a tester should flag that an end user sees developer internals.
 */
function errorEnvelope(level, err) {
  const body = { message: "Internal server error" };
  if (level === "low") body.stack = err && err.stack;
  return body;
}

module.exports = {
  LabError,
  sendError,
  mapMongooseError,
  // auth
  registerRole,
  validatePassword,
  validateEmail,
  validateName,
  isDuplicateKey,
  duplicateEmailResponse,
  assertNotLocked,
  recordLoginFailure,
  rotatesRefreshToken,
  missingTokenStatus,
  tokenErrorResponse,
  blacklistOnLogout,
  blacklistToken,
  isTokenBlacklisted,
  // serializers
  serializeUser,
  serializeUsers,
  serializeProduct,
  // users
  pickProfileUpdate,
  adminUserUpdateUsesSave,
  blocksAdminSelfDelete,
  cascadesUserDelete,
  // products
  buildProductListing,
  validateObjectId,
  validateProductInput,
  pickProductUpdate,
  productDeleteStrategy,
  // cart
  validateCartAdd,
  addOrMergeCartItem,
  computeCartTotal,
  removeCartItem,
  // orders
  validateOrderPlacement,
  orderLinePrice,
  decrementsStockOnOrder,
  clearsCartAfterOrder,
  assertOrderAccess,
  validateStatusChange,
  assertCancellable,
  restoresStockOnCancel,
  ORDER_STATUSES,
  // seed
  resetRequiresAdmin,
  // generic
  errorEnvelope,
};
