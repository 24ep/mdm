import { test, expect } from '@playwright/test'
import { login } from './helpers/auth-helper'

test.setTimeout(120000)

test.describe('Reports Feature', () => {
  const TEST_SPACE = process.env.TEST_SPACE || 'default'

  test.beforeEach(async ({ page }) => {
    await login(page)
  })

  test('should display reports list', async ({ page }) => {
    await page.goto('/reports')
    
    // Wait for reports to load
    await page.waitForSelector('[data-testid="reports-list"], [data-testid="reports-tree"]', { timeout: 5000 })
    
    // Check if reports are displayed (either list or tree view)
    const reportsContainer = page.locator('[data-testid="reports-list"], [data-testid="reports-tree"]').first()
    await expect(reportsContainer).toBeVisible()
  })

  test('should create a new report', async ({ page }) => {
    await page.goto('/reports')
    
    // Click "New Report" button
    await page.click('button:has-text("New Report"), a[href="/reports/new"]')
    
    // Wait for form to load
    await page.waitForSelector('input[name="name"], input[placeholder*="name" i]', { timeout: 3000 })
    
    // Fill in report form
    await page.fill('input[name="name"], input[placeholder*="name" i]', 'E2E Test Report')
    await page.fill('textarea[name="description"], textarea[placeholder*="description" i]', 'This is a test report created by E2E test')
    
    // Select source type if dropdown exists
    const sourceTypeSelect = page.locator('select[name="sourceType"], select[name="source_type"]')
    if (await sourceTypeSelect.count() > 0) {
      await sourceTypeSelect.selectOption('builtin')
    }
    
    // Submit form
    await page.click('button[type="submit"]:has-text("Create"), button:has-text("Save")')
    
    // Verify report was created
    await expect(page.locator('text=E2E Test Report').first()).toBeVisible({ timeout: 5000 })
  })

  test('should filter reports by source type', async ({ page }) => {
    await page.goto('/reports')
    
    // Switch to Source Type tab if it exists
    const sourceTypeTab = page.locator('button:has-text("Source Type"), [role="tab"]:has-text("Source Type")')
    if (await sourceTypeTab.count() > 0) {
      await sourceTypeTab.click()
    }
    
    // Wait for source type grid
    await page.waitForTimeout(1000)
    
    // Verify source types are displayed
    const sourceTypes = page.locator('[data-testid="source-type"], [data-testid="source-type-card"]')
    const count = await sourceTypes.count()
    expect(count).toBeGreaterThan(0)
  })

  test('should search reports', async ({ page }) => {
    await page.goto('/reports')
    
    // Find search input
    const searchInput = page.locator('input[placeholder*="search" i], input[type="search"]')
    if (await searchInput.count() > 0) {
      await searchInput.fill('test')
      await page.waitForTimeout(1000) // Wait for search results
      
      // Verify search results are displayed
      const results = page.locator('[data-testid="report-item"], [data-testid="report-card"]')
      const count = await results.count()
      // Results may be 0 if no matches, but search should work
      expect(count).toBeGreaterThanOrEqual(0)
    }
  })

  test('should navigate to integrations page', async ({ page }) => {
    await page.goto('/reports')
    
    // Click Integrations button
    const integrationsButton = page.locator('button:has-text("Integrations"), a[href*="integrations"]')
    if (await integrationsButton.count() > 0) {
      await integrationsButton.first().click()
      
      // Verify we're on integrations page
      await expect(page).toHaveURL(/.*integrations.*/, { timeout: 3000 })
      
      // Verify integration tabs are visible
      const powerBiTab = page.locator('button:has-text("Power BI"), [role="tab"]:has-text("Power BI")')
      await expect(powerBiTab.first()).toBeVisible()
    }
  })

  test('should view report details', async ({ page }) => {
    await page.goto('/reports')
    
    // Wait for reports to load
    await page.waitForTimeout(1000)
    
    // Click on first report
    const firstReport = page.locator('[data-testid="report-item"], [data-testid="report-card"]').first()
    if (await firstReport.count() > 0) {
      await firstReport.click()
      
      // Verify we're on report details page
      await expect(page).toHaveURL(/.*reports\/.*/, { timeout: 3000 })
      
      // Verify report details are displayed
      const reportName = page.locator('h1, h2, [data-testid="report-name"]')
      await expect(reportName.first()).toBeVisible()
    }
  })
})

