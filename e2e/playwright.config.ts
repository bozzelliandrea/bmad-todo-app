import { defineConfig, devices } from "@playwright/test";

/**
 * Playwright E2E test configuration for bmad-todo-app.
 *
 * Prerequisite: both services must be running before executing tests.
 *   - Frontend: http://localhost:5173  (npm run dev inside frontend/)
 *   - Backend:  http://localhost:8000  (uvicorn inside backend/)
 *   OR run the full stack with: docker compose up
 *
 * If you want Playwright to start the dev server automatically, uncomment the
 * `webServer` block below and adjust the commands to match your local setup.
 */
export default defineConfig({
  testDir: "./tests",
  fullyParallel: false, // keep sequential so DB state is predictable
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: 1, // single worker – tests share a real backend DB
  reporter: [["html", { open: "never" }], ["list"]],

  use: {
    baseURL: "http://localhost:5173",
    trace: "on-first-retry",
    screenshot: "only-on-failure",
    video: "retain-on-failure",
  },

  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
    {
      name: "Mobile Safari",
      use: { ...devices["iPhone 13"] },
    },
  ],

  // Uncomment to have Playwright start the stack automatically (requires Docker):
  // webServer: {
  //   command: 'docker compose up --build',
  //   url: 'http://localhost:5173',
  //   reuseExistingServer: !process.env.CI,
  //   timeout: 120_000,
  // },
});
