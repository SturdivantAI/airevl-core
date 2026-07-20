import { defineConfig } from "@playwright/test";

export default defineConfig({
  testDir: "./tests",
  timeout: 30_000,
  retries: 0,
  use: {
    baseURL: "http://localhost:3000",
    headless: true,
  },
  webServer: {
    command: "npm run build && npm run start",
    port: 3000,
    timeout: 120_000,
    reuseExistingServer: !process.env.CI,
    env: {
      // Deliberately unset Supabase vars so fallback path is exercised
      SUPABASE_URL: "",
      SUPABASE_ANON_KEY: "",
    },
  },
});
