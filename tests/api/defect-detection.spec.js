// @ts-check
const { test, expect } = require("@playwright/test");
const { LEVELS, lv, registerUser, firstProductId } = require("./helpers");

/**
 * ★ The heart of the automation module ★
 *
 * Each test below asserts the *correct* behaviour (what the Stable reference
 * build does). We then run that same assertion against every difficulty level.
 *
 * For the levels where the defect still exists, we mark the test with
 * `test.fail()` — Playwright then *expects* the correctness check to fail and
 * keeps the suite green, while clearly flagging it as a known defect. If a bug
 * ever gets fixed (the assertion starts passing) Playwright reports it as an
 * "unexpected pass", nudging you to update the expectation. That is exactly how
 * a regression suite encodes "known bug here, expected fixed there".
 *
 *   ✅ expected pass   = behaviour is correct at this level
 *   ✘  expected fail   = documented defect at this level (caught by the test)
 */

// Which levels still carry each defect (correctness assertion is expected to fail).
const BUGGY = {
  invalidId: ["low"], //               leaks a 500 instead of 400
  cartNegativeQty: ["low"], //         accepts a negative quantity
  roleEscalation: ["low"], //          honours role:"admin" on register
  weakPassword: ["low", "medium"], //  accepts a weak/common password
};

test.describe("Defect detection across difficulty levels", () => {
  // ── 1. Invalid id handling ────────────────────────────────────────────────
  for (const level of LEVELS) {
    test(`invalid product id returns 400, not 500  [@${level}]`, async ({
      request,
    }) => {
      if (BUGGY.invalidId.includes(level)) test.fail();
      const res = await request.get("/api/products/not-a-valid-id", lv(level));
      expect(res.status()).toBe(400);
    });
  }

  // ── 2. Cart rejects a non-positive quantity ──────────────────────────────
  for (const level of LEVELS) {
    test(`cart rejects quantity = -1  [@${level}]`, async ({ request }) => {
      if (BUGGY.cartNegativeQty.includes(level)) test.fail();
      const { token } = await registerUser(request, level);
      const productId = await firstProductId(request);
      const res = await request.post("/api/cart/add", {
        headers: { "X-QA-Level": level, Authorization: `Bearer ${token}` },
        data: { productId, quantity: -1 },
      });
      expect(res.status()).toBe(400);
    });
  }

  // ── 3. Privilege escalation on register ──────────────────────────────────
  for (const level of LEVELS) {
    test(`register ignores role:"admin"  [@${level}]`, async ({ request }) => {
      if (BUGGY.roleEscalation.includes(level)) test.fail();
      const { status, user } = await registerUser(request, level, {
        role: "admin",
      });
      expect(status).toBe(201);
      expect(user.role).toBe("user");
    });
  }

  // ── 4. Weak password is rejected ─────────────────────────────────────────
  for (const level of LEVELS) {
    test(`weak password "password" is rejected  [@${level}]`, async ({
      request,
    }) => {
      if (BUGGY.weakPassword.includes(level)) test.fail();
      const email = `weakpw_${level}_${Date.now()}@example.com`;
      const res = await request.post("/api/auth/register", {
        headers: { "X-QA-Level": level },
        data: { name: "Weak PW", email, password: "password" },
      });
      expect(res.status()).toBe(400);
    });
  }
});
