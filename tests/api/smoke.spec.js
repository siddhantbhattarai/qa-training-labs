// @ts-check
const { test, expect } = require("@playwright/test");

/**
 * Smoke tests — the cheapest, fastest safety net. If these fail, the build is
 * dead on arrival and there's no point running anything deeper.
 */
test.describe("Smoke — the service is alive", () => {
  test("GET /api/health reports the database is connected", async ({
    request,
  }) => {
    const res = await request.get("/api/health");
    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(body.status).toBe("ok");
    expect(body.database.state).toBe("connected");
  });

  test("the difficulty level honours the X-QA-Level header", async ({
    request,
  }) => {
    const res = await request.get("/api/lab/level", {
      headers: { "X-QA-Level": "stable" },
    });
    expect(res.ok()).toBeTruthy();
    const body = await res.json();
    expect(body.level).toBe("stable");
    expect(body.source).toBe("header");
  });

  test("GET /api/products returns the seeded catalogue", async ({
    request,
  }) => {
    const res = await request.get("/api/products", {
      headers: { "X-QA-Level": "stable" },
    });
    expect(res.ok()).toBeTruthy();
    const products = await res.json();
    expect(Array.isArray(products)).toBeTruthy();
    expect(products.length).toBeGreaterThan(0);
  });
});
