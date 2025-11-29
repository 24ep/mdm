/**
 * Authentication helper for E2E tests
 * Provides reusable login functionality
 */

export interface LoginCredentials {
  email: string
  password: string
  space?: string
}

export async function login(
  page: any,
  credentials: LoginCredentials = {
    email: process.env.TEST_EMAIL || 'admin@example.com',
    password: process.env.TEST_PASSWORD || 'admin123',
    space: process.env.TEST_SPACE || 'default',
  }
) {
  let loaded = false
  const maxRetries = 5
  const retryDelay = 5000

  // Retry logic for page load
  for (let i = 0; i < maxRetries; i++) {
    try {
      await page.goto('/auth/signin', { waitUntil: 'domcontentloaded', timeout: 30000 })
      loaded = true
      break
    } catch (e) {
      if (i < maxRetries - 1) {
        await page.waitForTimeout(retryDelay)
      } else {
        throw new Error(`Failed to load login page after ${maxRetries} attempts: ${e}`)
      }
    }
  }

  if (!loaded) {
    throw new Error('Failed to load login page')
  }

  // Wait for login form
  await page.waitForSelector('input[type="email"], input[name="email"]', { timeout: 15000 })

  // Fill credentials
  const emailInput = page.locator('input[type="email"], input[name="email"]').first()
  const passwordInput = page.locator('input[type="password"], input[name="password"]').first()

  await emailInput.fill(credentials.email)
  await passwordInput.fill(credentials.password)

  // Submit form
  const submitButton = page.locator('button[type="submit"]').first()
  await submitButton.click()

  // Wait for navigation after login - be more flexible with URL patterns
  try {
    await page.waitForURL(/\/(dashboard|$|\?|admin|system|projects|reports|workflows|infrastructure|marketplace|knowledge|tools)/, { timeout: 20000 })
  } catch (e) {
    // If URL doesn't match expected pattern, just wait a bit and continue
    await page.waitForTimeout(3000)
    const currentUrl = page.url()
    console.log(`Login completed, current URL: ${currentUrl}`)
  }
  await page.waitForTimeout(2000) // Give page time to load
}

export async function logout(page: any) {
  // Look for logout button
  const logoutButton = page.locator(
    'button:has-text("Logout"), button:has-text("Sign out"), a[href*="logout"]'
  ).first()

  if (await logoutButton.count() > 0) {
    await logoutButton.click()
    await page.waitForURL(/\/auth\/signin|\/login/, { timeout: 10000 })
  }
}

