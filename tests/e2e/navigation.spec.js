// @ts-check
const { test, expect } = require("@playwright/test");

/**
 * E2E — the learn → practice journey.
 * Confirms the two-zone split: the public hub sends students into the practice
 * app via "Start Training", which lands on the login page.
 */
test.describe("Learning hub navigation", () => {
  test("home page loads the hub", async ({ page }) => {
    await page.goto("/");
    await expect(page).toHaveTitle(/QA Training Lab/);
    await expect(
      page.getByRole("heading", { name: /Learn QA Testing/i })
    ).toBeVisible();
  });

  test('"Start Training" takes a student to the login page', async ({
    page,
  }) => {
    await page.goto("/");
    // Any of the Start Training entry points should reach the login door.
    await page.locator('a[href="/pages/login.html"]').first().click();
    await expect(page).toHaveURL(/\/pages\/login\.html/);
    await expect(
      page.getByRole("heading", { name: /Start Training/i })
    ).toBeVisible();
  });
});
