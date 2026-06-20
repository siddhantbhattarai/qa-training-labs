// @ts-check
const { defineConfig, devices } = require("@playwright/test");

/**
 * QA Training Lab — automation harness config.
 *
 * One framework (Playwright Test) covers both layers you'll automate as a QA:
 *   • API tests   (tests/api)  — fast checks of status codes & business rules
 *   • E2E UI tests (tests/e2e) — drive the real browser like a user
 *
 * By default this boots the lab itself (`npm start`) and tests against it.
 * To test a deployed instance instead:  BASE_URL=https://… npx playwright test
 */
const BASE_URL = process.env.BASE_URL || "http://localhost:3000";

module.exports = defineConfig({
  testDir: "./tests",
  // The lab keeps shared state (carts, seeded data), so run serially for
  // deterministic, easy-to-read results while you're learning.
  fullyParallel: false,
  workers: 1,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  timeout: 30_000,
  expect: { timeout: 10_000 },
  reporter: process.env.CI
    ? [["list"], ["html", { open: "never" }]]
    : [["list"]],

  // Waits for the DB to connect and demo data to be seeded before any test.
  globalSetup: require.resolve("./tests/global-setup.js"),

  use: {
    baseURL: BASE_URL,
    trace: "on-first-retry",
    screenshot: "only-on-failure",
  },

  projects: [
    { name: "api", testDir: "./tests/api" },
    {
      name: "e2e",
      testDir: "./tests/e2e",
      use: { ...devices["Desktop Chrome"] },
    },
  ],

  // Auto-start the lab unless we're pointed at an external BASE_URL.
  webServer: process.env.BASE_URL
    ? undefined
    : {
        // Launch with node directly (not "npm start") so it works anywhere
        // node is available, without depending on npm being on PATH.
        command: "node src/server.js",
        url: "http://localhost:3000/api/health",
        reuseExistingServer: !process.env.CI,
        timeout: 60_000,
      },
});
