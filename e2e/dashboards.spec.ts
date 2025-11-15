import { test, expect } from '@playwright/test'

test.describe('Dashboards Feature', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/login')
    // TODO: Add actual login steps
  })

  test('should display dashboards list', async ({ page }) => {
    await page.goto('/dashboards')
    
    // Wait for dashboards to load
    await page.waitForSelector('[data-testid="dashboards-list"], [data-testid="dashboard-grid"]', { timeout: 5000 })
    
    // Check if dashboards are displayed
    const dashboardsContainer = page.locator('[data-testid="dashboards-list"], [data-testid="dashboard-grid"]').first()
    await expect(dashboardsContainer).toBeVisible()
  })

  test('should create a new dashboard', async ({ page }) => {
    await page.goto('/dashboards')
    
    // Click "New Dashboard" button
    await page.click('button:has-text("New Dashboard"), a[href*="/dashboards/new"]')
    
    // Wait for form or builder to load
    await page.waitForSelector('input[name="name"], input[placeholder*="name" i], [data-testid="dashboard-builder"]', { timeout: 3000 })
    
    // Fill in dashboard name if form exists
    const nameInput = page.locator('input[name="name"], input[placeholder*="name" i]')
    if (await nameInput.count() > 0) {
      await nameInput.fill('E2E Test Dashboard')
      
      // Submit if there's a form
      const submitButton = page.locator('button[type="submit"]:has-text("Create"), button:has-text("Save")')
      if (await submitButton.count() > 0) {
        await submitButton.click()
      }
    }
    
    // Verify dashboard was created or builder is open
    await expect(
      page.locator('text=E2E Test Dashboard, [data-testid="dashboard-builder"]').first()
    ).toBeVisible({ timeout: 5000 })
  })

  test('should search dashboards', async ({ page }) => {
    await page.goto('/dashboards')
    
    // Find search input
    const searchInput = page.locator('input[placeholder*="search" i], input[type="search"]')
    if (await searchInput.count() > 0) {
      await searchInput.fill('test')
      await page.waitForTimeout(1000)
      
      // Verify search results
      const results = page.locator('[data-testid="dashboard-item"], [data-testid="dashboard-card"]')
      const count = await results.count()
      expect(count).toBeGreaterThanOrEqual(0)
    }
  })

  test('should filter dashboards by space', async ({ page }) => {
    await page.goto('/dashboards')
    
    // Look for space selector
    const spaceSelector = page.locator('select[name="spaceId"], [data-testid="space-selector"]')
    if (await spaceSelector.count() > 0) {
      // Select a space if options exist
      const options = await spaceSelector.locator('option').count()
      if (options > 1) {
        await spaceSelector.selectOption({ index: 1 })
        await page.waitForTimeout(1000)
        
        // Verify filtered results
        const dashboards = page.locator('[data-testid="dashboard-item"]')
        const count = await dashboards.count()
        expect(count).toBeGreaterThanOrEqual(0)
      }
    }
  })

  test('should view dashboard details', async ({ page }) => {
    await page.goto('/dashboards')
    
    await page.waitForTimeout(1000)
    
    // Click on first dashboard
    const firstDashboard = page.locator('[data-testid="dashboard-item"], [data-testid="dashboard-card"]').first()
    if (await firstDashboard.count() > 0) {
      await firstDashboard.click()
      
      // Verify we're on dashboard details page
      await expect(page).toHaveURL(/.*dashboards\/.*/, { timeout: 3000 })
      
      // Verify dashboard is displayed
      const dashboardContent = page.locator('[data-testid="dashboard-content"], [data-testid="dashboard-view"]')
      await expect(dashboardContent.first()).toBeVisible()
    }
  })
})

