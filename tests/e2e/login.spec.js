// @ts-check
const { test, expect } = require("@playwright/test");

/**
 * E2E — the demo login flow a student uses to enter the practice app.
 * Uses the seeded demo user (also pre-filled by the "User" button on the page).
 */
test.describe("Login", () => {
  test("a demo user can sign in and reach the dashboard", async ({ page }) => {
    await page.goto("/pages/login.html");

    await page.fill("#email", "user@qalab.com");
    await page.fill("#password", "User@1234");
    await page.click("#submitBtn");

    // On success the app redirects into the practice app.
    await expect(page).toHaveURL(/\/pages\/dashboard\.html/, {
      timeout: 15_000,
    });
  });

  test("invalid credentials show an error and stay on the login page", async ({
    page,
  }) => {
    await page.goto("/pages/login.html");

    await page.fill("#email", "user@qalab.com");
    await page.fill("#password", "definitely-wrong");
    await page.click("#submitBtn");

    await expect(page.locator("#alertContainer .alert")).toBeVisible();
    await expect(page).toHaveURL(/\/pages\/login\.html/);
  });
});
