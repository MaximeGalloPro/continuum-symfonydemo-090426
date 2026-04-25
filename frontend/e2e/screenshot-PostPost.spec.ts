
import { test, expect } from '@playwright/test'

test('capture PostPostPage', async ({ page }) => {
  await page.goto('/posts/lorem-ipsum')
  await page.waitForLoadState('networkidle')

  // Assertions: verify the page is functional (not showing errors)
  // 1. The page component should be visible
  await expect(page.getByTestId('post-post-page')).toBeVisible({ timeout: 5000 })

  // 2. No "not found" message - catches pages with unresolved params or missing data
  const notFoundLocator = page.locator('text=/not found/i')
  await expect(notFoundLocator).not.toBeVisible()

  // 3. No error message should be visible
  const errorLocator = page.locator('text=/^Error:/i')
  await expect(errorLocator).not.toBeVisible()

  // 4. There should be some content (not just loading)
  const loadingLocator = page.locator('text=/^Loading/i')
  await expect(loadingLocator).not.toBeVisible()

  // All assertions passed - capture the screenshot
  await page.screenshot({
    path: 'screenshots/PostPostPage.png',
    fullPage: true
  })
})
