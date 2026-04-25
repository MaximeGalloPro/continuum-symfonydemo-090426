import { chromium } from '@playwright/test'

async function globalSetup() {
  const browser = await chromium.launch()
  const context = await browser.newContext({
    baseURL: 'http://localhost:5173',
  })
  const page = await context.newPage()

  try {
    // Navigate to the app first (required to set localStorage for the correct origin)
    await page.goto('http://localhost:5173/', { waitUntil: 'commit' })

    // Log in via the API proxy and retrieve the JWT access token
    const accessToken = await page.evaluate(async () => {
      const response = await fetch('/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: 'jane_admin', password: 'kitten' }),
      })
      if (!response.ok) {
        throw new Error(`Login failed: ${response.status} ${response.statusText}`)
      }
      const data = await response.json()
      return data.access_token as string
    })

    // Persist the JWT token in localStorage so the API client picks it up
    await page.evaluate((token: string) => {
      localStorage.setItem('auth_token', token)
    }, accessToken)

    console.log('[global-setup] Login successful, auth token saved to localStorage')
  } catch (error) {
    console.error('[global-setup] Login failed:', error)
  }

  // Save storage state (cookies + localStorage) for all tests to reuse
  await context.storageState({ path: 'e2e/auth.json' })

  await browser.close()
}

export default globalSetup
