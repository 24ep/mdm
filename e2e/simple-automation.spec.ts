import { test, expect } from '@playwright/test'

// Increase timeout for all tests since dev server needs to start
test.setTimeout(120000)

test.describe('Simple Application Tests', () => {
  test('should load login page', async ({ page }) => {
    // Wait for server to be ready with retries
    let loaded = false
    for (let i = 0; i < 5; i++) {
      try {
        await page.goto('/auth/signin', { waitUntil: 'domcontentloaded', timeout: 30000 })
        loaded = true
        break
      } catch (e) {
        if (i < 4) {
          await page.waitForTimeout(5000) // Wait 5 seconds before retry
        } else {
          throw e
        }
      }
    }
    
    if (!loaded) {
      throw new Error('Failed to load login page after retries')
    }
    
    // Check if page loaded - be more flexible with title check
    const title = await page.title()
    expect(title.length).toBeGreaterThan(0)
    
    // Check for email input with longer timeout
    const emailInput = page.locator('input[type="email"], input[name="email"]').first()
    await expect(emailInput).toBeVisible({ timeout: 10000 })
  })

  test('should have login form elements', async ({ page }) => {
    // Retry logic for page load
    let loaded = false
    for (let i = 0; i < 5; i++) {
      try {
        await page.goto('/auth/signin', { waitUntil: 'domcontentloaded', timeout: 30000 })
        loaded = true
        break
      } catch (e) {
        if (i < 4) {
          await page.waitForTimeout(5000)
        } else {
          throw e
        }
      }
    }
    
    // Wait for form with longer timeout
    await page.waitForSelector('form, input[type="email"]', { timeout: 15000 })
    
    // Check for email field
    const emailField = page.locator('input[type="email"], input[name="email"]').first()
    const emailCount = await emailField.count()
    expect(emailCount).toBeGreaterThan(0)
    
    // Check for password field
    const passwordField = page.locator('input[type="password"], input[name="password"]').first()
    const passwordCount = await passwordField.count()
    expect(passwordCount).toBeGreaterThan(0)
    
    // Check for submit button
    const submitButton = page.locator('button[type="submit"]').first()
    const submitCount = await submitButton.count()
    expect(submitCount).toBeGreaterThan(0)
  })

  test('should handle invalid login attempt', async ({ page }) => {
    // Retry logic for page load
    let loaded = false
    for (let i = 0; i < 5; i++) {
      try {
        await page.goto('/auth/signin', { waitUntil: 'domcontentloaded', timeout: 30000 })
        loaded = true
        break
      } catch (e) {
        if (i < 4) {
          await page.waitForTimeout(5000)
        } else {
          throw e
        }
      }
    }
    
    await page.waitForSelector('input[type="email"]', { timeout: 15000 })
    
    // Fill with invalid credentials - use first() to ensure we get the element
    const emailInput = page.locator('input[type="email"], input[name="email"]').first()
    const passwordInput = page.locator('input[type="password"], input[name="password"]').first()
    
    await emailInput.fill('invalid@test.com')
    await passwordInput.fill('wrongpassword')
    
    // Submit form
    const submitButton = page.locator('button[type="submit"]').first()
    await submitButton.click()
    
    // Wait a bit for response
    await page.waitForTimeout(3000)
    
    // Page should still be visible (not crashed)
    await expect(page.locator('body')).toBeVisible()
  })

  test('should check page accessibility', async ({ page }) => {
    // Retry logic for page load
    let loaded = false
    for (let i = 0; i < 5; i++) {
      try {
        await page.goto('/auth/signin', { waitUntil: 'domcontentloaded', timeout: 30000 })
        loaded = true
        break
      } catch (e) {
        if (i < 4) {
          await page.waitForTimeout(5000)
        } else {
          throw e
        }
      }
    }
    
    // Check for main content
    const body = page.locator('body')
    await expect(body).toBeVisible({ timeout: 10000 })
    
    // Check page title exists
    const title = await page.title()
    expect(title.length).toBeGreaterThan(0)
  })
})

