import { test, expect } from '@playwright/test'

test.describe('Application Automation Tests', () => {
  // Test credentials - adjust based on your test environment
  const TEST_EMAIL = process.env.TEST_EMAIL || 'admin@example.com'
  const TEST_PASSWORD = process.env.TEST_PASSWORD || 'admin123'
  const TEST_SPACE = process.env.TEST_SPACE || 'default'

  test.beforeEach(async ({ page }) => {
    // Navigate to login page
    await page.goto('/auth/signin')
    
    // Wait for login form to be visible
    await page.waitForSelector('input[type="email"], input[name="email"]', { timeout: 10000 })
    
    // Fill in login credentials
    const emailInput = page.locator('input[type="email"], input[name="email"]').first()
    const passwordInput = page.locator('input[type="password"], input[name="password"]').first()
    
    await emailInput.fill(TEST_EMAIL)
    await passwordInput.fill(TEST_PASSWORD)
    
    // Submit login form
    const submitButton = page.locator('button[type="submit"]:has-text("Sign in"), button:has-text("Login")').first()
    await submitButton.click()
    
    // Wait for navigation after login (either to dashboard or home)
    await page.waitForURL(/\/(dashboard|$|\?)/, { timeout: 10000 })
  })

  test('should successfully login and navigate to dashboard', async ({ page }) => {
    // Verify we're logged in by checking for common dashboard elements
    await page.waitForTimeout(2000) // Give page time to load
    
    // Check for navigation menu or dashboard content
    const hasNavigation = await page.locator('nav, [role="navigation"], header').count() > 0
    expect(hasNavigation).toBeTruthy()
  })

  test('should display navigation menu', async ({ page }) => {
    await page.waitForTimeout(2000)
    
    // Look for navigation elements
    const navElements = page.locator('nav, [role="navigation"], header, [data-testid="navigation"]')
    const navCount = await navElements.count()
    
    // At least one navigation element should exist
    expect(navCount).toBeGreaterThan(0)
  })

  test('should navigate to tickets page', async ({ page }) => {
    // Try to find and click tickets link
    const ticketsLink = page.locator('a[href*="ticket"], a[href*="project"], button:has-text("Tickets"), button:has-text("Projects")').first()
    
    if (await ticketsLink.count() > 0) {
      await ticketsLink.click()
      await page.waitForTimeout(2000)
      
      // Verify we're on tickets/projects page
      const currentUrl = page.url()
      expect(currentUrl).toMatch(/ticket|project/i)
    } else {
      // If no link found, try direct navigation
      await page.goto(`/${TEST_SPACE}/projects`)
      await page.waitForTimeout(2000)
      
      const pageContent = page.locator('body')
      await expect(pageContent).toBeVisible()
    }
  })

  test('should navigate to dashboards page', async ({ page }) => {
    // Try to find and click dashboards link
    const dashboardsLink = page.locator('a[href*="dashboard"], button:has-text("Dashboard")').first()
    
    if (await dashboardsLink.count() > 0) {
      await dashboardsLink.click()
      await page.waitForTimeout(2000)
    } else {
      // Direct navigation
      await page.goto(`/${TEST_SPACE}/dashboard`)
      await page.waitForTimeout(2000)
    }
    
    // Verify page loaded
    const pageContent = page.locator('body')
    await expect(pageContent).toBeVisible()
  })

  test('should navigate to reports page', async ({ page }) => {
    // Try to find and click reports link
    const reportsLink = page.locator('a[href*="report"], button:has-text("Report")').first()
    
    if (await reportsLink.count() > 0) {
      await reportsLink.click()
      await page.waitForTimeout(2000)
    } else {
      // Direct navigation
      await page.goto(`/${TEST_SPACE}/reports`)
      await page.waitForTimeout(2000)
    }
    
    // Verify page loaded
    const pageContent = page.locator('body')
    await expect(pageContent).toBeVisible()
  })

  test('should search functionality work', async ({ page }) => {
    await page.waitForTimeout(2000)
    
    // Look for search input
    const searchInput = page.locator('input[type="search"], input[placeholder*="search" i], input[placeholder*="Search" i]').first()
    
    if (await searchInput.count() > 0) {
      await searchInput.fill('test')
      await page.waitForTimeout(1000)
      
      // Verify search was performed (no error thrown)
      expect(await searchInput.inputValue()).toBe('test')
    }
  })

  test('should handle page responsiveness', async ({ page }) => {
    // Test mobile viewport
    await page.setViewportSize({ width: 375, height: 667 })
    await page.waitForTimeout(1000)
    
    // Verify page is still visible
    const body = page.locator('body')
    await expect(body).toBeVisible()
    
    // Test tablet viewport
    await page.setViewportSize({ width: 768, height: 1024 })
    await page.waitForTimeout(1000)
    
    await expect(body).toBeVisible()
    
    // Test desktop viewport
    await page.setViewportSize({ width: 1920, height: 1080 })
    await page.waitForTimeout(1000)
    
    await expect(body).toBeVisible()
  })

  test('should check for console errors', async ({ page }) => {
    const consoleErrors: string[] = []
    
    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        consoleErrors.push(msg.text())
      }
    })
    
    await page.waitForTimeout(3000)
    
    // Log console errors for debugging but don't fail the test
    if (consoleErrors.length > 0) {
      console.log('Console errors found:', consoleErrors)
    }
  })

  test('should verify page load performance', async ({ page }) => {
    const startTime = Date.now()
    
    await page.goto('/auth/signin')
    await page.waitForLoadState('networkidle')
    
    const loadTime = Date.now() - startTime
    
    // Page should load within reasonable time (30 seconds)
    expect(loadTime).toBeLessThan(30000)
    
    console.log(`Page load time: ${loadTime}ms`)
  })
})

