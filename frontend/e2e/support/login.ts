import type { Page } from '@playwright/test'
import { credentials, type JourneyCredential } from '../fixtures/credentials'

const LABEL_USERNAME = /email|nom d'utilisateur|username|identifiant/i
const LABEL_PASSWORD = /mot de passe|password/i
const ROLE_SUBMIT = /se connecter|connexion|log ?in|sign ?in/i

function resolveCredential(username: string): JourneyCredential {
  if (credentials.length === 0) {
    throw new Error('No test credentials available — run the e2e-journey phase to populate fixtures/credentials.ts')
  }
  const found = credentials.find((c) => c.username === username || c.email === username)
  return found ?? credentials[0]
}

export async function loginAs(page: Page, username: string): Promise<void> {
  const c = resolveCredential(username)
  const identifier = c.username ?? c.email

  await page.goto('/login')
  await page.getByLabel(LABEL_USERNAME).fill(identifier)
  await page.getByLabel(LABEL_PASSWORD).fill(c.password)
  await page.getByRole('button', { name: ROLE_SUBMIT }).click()
  await page.waitForURL((url) => !url.pathname.endsWith('/login'), { timeout: 5000 })
}
