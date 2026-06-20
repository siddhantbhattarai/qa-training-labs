// @ts-check
const { request } = require("@playwright/test");

/**
 * The lab starts listening immediately but connects to its in-memory MongoDB
 * (and seeds demo data) a moment later. This setup waits for the database to
 * report "ok" and guarantees the demo products/users exist, so every test
 * starts from a known, seeded baseline.
 */
const BASE_URL = process.env.BASE_URL || "http://localhost:3000";
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

module.exports = async () => {
  const ctx = await request.newContext({ baseURL: BASE_URL });

  // 1) Wait (up to 60s) for the database connection to come up.
  let ready = false;
  for (let i = 0; i < 60; i++) {
    try {
      const res = await ctx.get("/api/health");
      if (res.ok()) {
        const body = await res.json();
        if (body.status === "ok") {
          ready = true;
          break;
        }
      }
    } catch (_) {
      /* server not accepting connections yet — retry */
    }
    await sleep(1000);
  }
  if (!ready) {
    throw new Error("Lab did not become healthy within 60s — is it running?");
  }

  // 2) Make sure demo data is present.
  const list = await ctx.get("/api/products", {
    headers: { "X-QA-Level": "stable" },
  });
  const data = list.ok() ? await list.json() : [];
  const products = Array.isArray(data) ? data : data.products || [];
  if (products.length === 0) {
    // Only ever seed an instance WE started (local). Never mutate a shared
    // deployment (e.g. the Render demo) that a BASE_URL override points at.
    if (process.env.BASE_URL) {
      throw new Error(
        `No products found at ${BASE_URL} and it's an external target — ` +
          `refusing to seed a shared deployment. Seed it manually if needed.`
      );
    }
    await ctx.post("/api/seed");
  }

  await ctx.dispose();
};
