import { test, expect } from "@playwright/test";

// ─── Marketing routes respond 200 and render titles ───────────────────────────

const marketingRoutes = [
  { path: "/", titleContains: "AiRevl" },
  { path: "/solutions", titleContains: "Solutions" },
  { path: "/training", titleContains: "Training" },
  { path: "/demos", titleContains: "Demos" },
  { path: "/about", titleContains: "About" },
  { path: "/contact", titleContains: "Contact" },
  { path: "/privacy", titleContains: "Privacy" },
  { path: "/terms", titleContains: "Terms" },
];

for (const { path, titleContains } of marketingRoutes) {
  test(`marketing route ${path} responds 200 and has correct title`, async ({ page }) => {
    const response = await page.goto(path);
    expect(response?.status()).toBe(200);
    await expect(page).toHaveTitle(new RegExp(titleContains));
  });
}

// ─── Marketing pages contain no console chrome ─────────────────────────────────

test("marketing pages do not show sidebar", async ({ page }) => {
  await page.goto("/");
  const sidebar = page.locator('aside[class*="fixed"]');
  await expect(sidebar).toHaveCount(0);
});

// ─── Console demo pages show the synthetic-data banner ─────────────────────────

const consoleDemoRoutes = ["/demos/telemetry", "/demos/security"];

for (const path of consoleDemoRoutes) {
  test(`console demo ${path} shows synthetic-data banner`, async ({ page }) => {
    const response = await page.goto(path);
    expect(response?.status()).toBe(200);
    // The ConsoleDemoBanner contains "Interactive demo" text
    await expect(page.getByText("Interactive demo")).toBeVisible();
  });
}

// ─── Redirects ─────────────────────────────────────────────────────────────────

test("/telemetry redirects to /demos/telemetry", async ({ page }) => {
  const response = await page.goto("/telemetry");
  expect(response?.url()).toContain("/demos/telemetry");
});

// ─── Branded 404 ───────────────────────────────────────────────────────────────

test("unknown URL shows branded 404", async ({ page }) => {
  const response = await page.goto("/this-route-does-not-exist");
  expect(response?.status()).toBe(404);
  await expect(page.getByText("Signal lost")).toBeVisible();
});

// ─── Contact form ──────────────────────────────────────────────────────────────

test("contact form: fill, consent, submit (mocked API)", async ({ page }) => {
  // Intercept the API call — do NOT hit Formspree in CI
  await page.route("/api/contact", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({ success: true }),
    });
  });

  await page.goto("/contact");

  await page.fill('input[name="name"]', "Test User");
  await page.fill('input[name="email"]', "test@example.com");
  await page.fill('input[name="subject"]', "Test Org");
  await page.fill('textarea[name="message"]', "Hello from smoke test");

  // Tick consent checkbox
  await page.check('input[type="checkbox"]');

  // Submit
  await page.click('button[type="submit"]');

  // Should show success message
  await expect(page.getByText("Message received")).toBeVisible({ timeout: 10_000 });
});

// ─── Fallback assertion ────────────────────────────────────────────────────────

test("telemetry demo shows sample-data chip when Supabase is unavailable", async ({ page }) => {
  // The webServer already runs with SUPABASE_URL="" so fallback should engage
  await page.goto("/demos/telemetry");
  await expect(page.getByTestId("sample-data-chip")).toBeVisible();
});
