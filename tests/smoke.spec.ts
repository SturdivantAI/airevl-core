import { test, expect } from "@playwright/test";
import { academy, modules } from "../src/lib/academy/content";

const firstModuleId = modules[0].id;

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

// ─── Academy (Tier 1) ──────────────────────────────────────────────────────────

const academyRoutes = [
  { path: "/training/signin", titleContains: "Sign in" },
  { path: "/training/automation-101", titleContains: "Automation 101" },
  { path: "/training/automation-101/certificate", titleContains: "Certificate" },
  { path: `/training/automation-101/${firstModuleId}`, titleContains: "Automation 101" },
];

for (const { path, titleContains } of academyRoutes) {
  test(`academy route ${path} responds 200 and has correct title`, async ({ page }) => {
    const response = await page.goto(path);
    expect(response?.status()).toBe(200);
    await expect(page).toHaveTitle(new RegExp(titleContains));
  });
}

test("academy sign-in labels demo mode when Supabase is unconfigured", async ({ page }) => {
  await page.goto("/training/signin");
  await expect(page.getByText(academy.signin.demo_note)).toBeVisible();
});

test("unknown lesson id shows branded 404, not a crash", async ({ page }) => {
  const response = await page.goto("/training/automation-101/no-such-module");
  expect(response?.status()).toBe(404);
});

test("sitemap lists the Academy course page but not learner-state pages", async ({ request }) => {
  const res = await request.get("/sitemap.xml");
  expect(res.status()).toBe(200);
  const xml = await res.text();
  expect(xml).toContain("/training/automation-101");
  expect(xml).not.toContain("/training/signin");
  expect(xml).not.toContain("/training/automation-101/certificate");
});

// ─── Waitlist API contract ─────────────────────────────────────────────────────

test("waitlist API rejects malformed submissions", async ({ request }) => {
  const res = await request.post("/api/academy/waitlist", {
    data: { email: "not-an-email", name: "", tier_id: "bogus-tier" },
  });
  expect(res.status()).toBe(400);
  expect((await res.json()).error).toBe("invalid_fields");
});

test("waitlist API silently drops honeypot submissions", async ({ request }) => {
  const res = await request.post("/api/academy/waitlist", {
    data: {
      email: "bot@example.com",
      name: "Bot",
      tier_id: "automation-fluency",
      website: "http://spam.example",
    },
  });
  expect(res.status()).toBe(200);
  // Accepted-and-dropped: the bot sees success, nothing is stored or emailed
  expect((await res.json()).via).toBe("dropped");
});

// Demo mode starts signed out, and both the lesson body and the resume CTA are
// gated on a user — so these have to sign in first or they assert on the gate panel.
async function demoSignIn(page: import("@playwright/test").Page) {
  await page.goto("/training/signin");
  await page.getByLabel("Your name (appears on your certificate)").fill("Test Learner");
  await page.getByLabel("Work email").fill("learner@example.com");
  await page.getByRole("button", { name: "Continue in demo mode" }).click();
  await expect(page.getByRole("link", { name: "Resume course" })).toBeVisible();
}

test("lesson blocks expose position markers for resume tracking", async ({ page }) => {
  await demoSignIn(page);
  await page.goto("/training/automation-101/what-is-automation");
  // The resume observer finds blocks by attribute, so if these stop being
  // emitted, position tracking silently stops working with nothing else failing.
  const markers = page.locator("[data-block-index]");
  expect(await markers.count()).toBeGreaterThan(0);
  await expect(markers.first()).toHaveAttribute("data-block-index", "0");
});

test("course overview offers a resume entry point", async ({ page }) => {
  await demoSignIn(page);
  await page.goto("/training/automation-101");
  // Fresh learner, no stored position: the CTA still appears, pointing at
  // module 1, so there is always one click from the index into the course.
  await expect(
    page.getByRole("link", { name: /Continue where you left off|Start module 1/i })
  ).toBeVisible();
});
