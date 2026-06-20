// @ts-check
/** Shared helpers for the API specs. */

const LEVELS = ["low", "medium", "high", "stable"];
const lv = (level) => ({ headers: { "X-QA-Level": level } });

/** A password that satisfies every level's strength rules. */
const STRONG_PASSWORD = "Str0ng@Pass1";

/** Register a brand-new user and return { token, user }. */
async function registerUser(request, level, overrides = {}) {
  const email = `auto_${level}_${Date.now()}_${Math.floor(
    Math.random() * 1e6
  )}@example.com`;
  const res = await request.post("/api/auth/register", {
    headers: { "X-QA-Level": level },
    data: {
      name: "Auto Tester",
      email,
      password: STRONG_PASSWORD,
      ...overrides,
    },
  });
  const body = await res.json().catch(() => ({}));
  return { status: res.status(), token: body.accessToken, user: body.user, body };
}

/** Grab the id of the first seeded product (using the stable/correct build). */
async function firstProductId(request) {
  const res = await request.get("/api/products", lv("stable"));
  const products = await res.json();
  const list = Array.isArray(products) ? products : products.products || [];
  return list[0]?._id;
}

module.exports = { LEVELS, lv, STRONG_PASSWORD, registerUser, firstProductId };
