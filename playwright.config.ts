import { defineConfig, devices } from "@playwright/test"
import type { TelegramReporterOptions } from "./src/types"

/**
 * See https://playwright.dev/docs/test-configuration.
 */
export default defineConfig({
  testDir: "./tests",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: [
    ["list"],
    // Use string path for the reporter to avoid instantiation issues
    [
      "./src/telegram-reporter.ts",
      {
        botToken: process.env.TELEGRAM_BOT_TOKEN || "",
        chatId: process.env.TELEGRAM_CHAT_ID || "",
        reportType: "detailed",
        sendOn: "always",
      } satisfies TelegramReporterOptions,
    ],
  ],
  use: {
    trace: "on-first-retry",
  },

  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
  ],
})
