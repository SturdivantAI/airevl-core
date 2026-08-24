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
    timeout: 300_000,
    reuseExistingServer: !process.env.CI,
    env: {
      // Deliberately unset Supabase vars so fallback path is exercised.
      // The NEXT_PUBLIC_ pair matters most: those are what the browser client
      // reads, Next inlines them at build time, and a developer with a populated
      // .env.local would otherwise run the whole suite against live Supabase
      // without noticing.
      SUPABASE_URL: "",
      SUPABASE_ANON_KEY: "",
      NEXT_PUBLIC_SUPABASE_URL: "",
      NEXT_PUBLIC_SUPABASE_ANON_KEY: "",
    },
  },
});
