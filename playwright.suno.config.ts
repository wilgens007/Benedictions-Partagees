import { defineConfig, devices } from "@playwright/test";
import { spawnSync } from "node:child_process";

const baseURL = process.env.SUNO_TEST_BASE_URL
  ?? (process.env.REPLIT_DEV_DOMAIN ? `https://${process.env.REPLIT_DEV_DOMAIN}` : undefined);
if (!baseURL) {
  throw new Error("Set SUNO_TEST_BASE_URL to the running app URL before testing Suno playback.");
}

// Replit's Nix Chromium wrapper includes the shared libraries that a downloaded
// Playwright browser does not. Other environments use Playwright's own browser.
const nixChromium = process.env.REPLIT_DEV_DOMAIN
  ? spawnSync("which", ["chromium"], { encoding: "utf8" }).stdout?.trim()
  : undefined;
const executablePath = process.env.SUNO_TEST_BROWSER_PATH || nixChromium || undefined;
const chromiumLaunchOptions = executablePath
  ? { launchOptions: { executablePath } }
  : {};
const webkitProject = {
  // Playwright's Linux WebKit with iPhone-sized/touch emulation is useful
  // coverage, but it is not MobileSafari running on iOS.
  name: "iphone-webkit-emulation",
  use: { ...devices["iPhone 13"], viewport: { width: 390, height: 844 } },
};

export default defineConfig({
  testDir: "./tests/browser",
  testMatch: "sunoPlayback.spec.ts",
  timeout: 90_000,
  expect: { timeout: 20_000 },
  workers: 1,
  retries: 0,
  outputDir: "generated-artifacts/suno-browser",
  reporter: [["list"]],
  use: {
    baseURL,
    screenshot: "only-on-failure",
    trace: "retain-on-failure",
    // Keep the normal user-gesture autoplay policy: no force-play browser flags.
  },
  projects: [
    {
      name: "desktop-chromium",
      use: {
        ...devices["Desktop Chrome"],
        viewport: { width: 1280, height: 800 },
        ...chromiumLaunchOptions,
      },
    },
    {
      name: "phone-chromium",
      use: {
        ...devices["Pixel 7"],
        viewport: { width: 390, height: 844 },
        ...chromiumLaunchOptions,
      },
    },
    ...(process.env.SUNO_TEST_WEBKIT === "1" ? [webkitProject] : []),
  ],
});
