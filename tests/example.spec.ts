import { expect, test } from "@playwright/test"

test.describe("Example Tests", () => {
  test("has correct title", async ({ page }) => {
    await page.goto("https://example.com")
    await expect(page).toHaveTitle(/Example Domain/)
  })

  test("has heading", async ({ page }) => {
    await page.goto("https://example.com")
    const heading = page.locator("h1")
    await expect(heading).toBeVisible()
    await expect(heading).toContainText("Example Domain")
  })

  test("has more information link", async ({ page }) => {
    await page.goto("https://example.com")
    const link = page.locator('a[href*="iana.org"]')
    await expect(link).toBeVisible()
  })
})
