
import { test, expect } from '@playwright/test'

test('capture AdminBlogPage', async ({ page }) => {
  await page.goto('/adminblog')
  await page.waitForLoadState('networkidle')

  // Assertions: verify the page is functional (not showing errors)
  // 1. The page component should be visible
  await expect(page.getByTestId('adminblog-page')).toBeVisible({ timeout: 5000 })

  // 2. No error message should be visible
  const errorLocator = page.locator('text=/^Error:/i')
  await expect(errorLocator).not.toBeVisible()

  // 3. There should be some content (not just loading)
  const loadingLocator = page.locator('text=/^Loading/i')
  await expect(loadingLocator).not.toBeVisible()

  // All assertions passed - capture the screenshot
  await page.screenshot({
    path: 'screenshots/AdminBlogPage.png',
    fullPage: true
  })
})
