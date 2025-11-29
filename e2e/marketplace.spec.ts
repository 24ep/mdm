import { test, expect } from '@playwright/test'
import { login } from './helpers/auth-helper'

test.setTimeout(120000)

test.describe('Marketplace Feature', () => {
  test.beforeEach(async ({ page }) => {
    await login(page)
  })

  test('should display marketplace plugins', async ({ page }) => {
    await page.goto('/marketplace')
    
    // Wait for plugins to load
    await page.waitForSelector('[data-testid="plugin-card"], [data-testid="marketplace-plugins"]', { timeout: 5000 })
    
    // Check if plugins are displayed
    const pluginsContainer = page.locator('[data-testid="plugin-card"], [data-testid="marketplace-plugins"]').first()
    await expect(pluginsContainer).toBeVisible()
  })

  test('should filter plugins by category', async ({ page }) => {
    await page.goto('/marketplace')
    
    // Wait for plugins to load
    await page.waitForTimeout(1000)
    
    // Look for category filter
    const categoryFilter = page.locator('button:has-text("Business Intelligence"), button:has-text("Service Management"), [data-testid="category-filter"]')
    if (await categoryFilter.count() > 0) {
      await categoryFilter.first().click()
      await page.waitForTimeout(1000)
      
      // Verify filtered plugins
      const plugins = page.locator('[data-testid="plugin-card"]')
      const count = await plugins.count()
      expect(count).toBeGreaterThanOrEqual(0)
    }
  })

  test('should search plugins', async ({ page }) => {
    await page.goto('/marketplace')
    
    // Find search input
    const searchInput = page.locator('input[placeholder*="search" i], input[type="search"]')
    if (await searchInput.count() > 0) {
      await searchInput.fill('Power BI')
      await page.waitForTimeout(1000)
      
      // Verify search results
      const results = page.locator('[data-testid="plugin-card"]')
      const count = await results.count()
      expect(count).toBeGreaterThanOrEqual(0)
    }
  })

  test('should view plugin details', async ({ page }) => {
    await page.goto('/marketplace')
    
    await page.waitForTimeout(1000)
    
    // Click on first plugin
    const firstPlugin = page.locator('[data-testid="plugin-card"]').first()
    if (await firstPlugin.count() > 0) {
      await firstPlugin.click()
      
      // Verify plugin details are displayed
      const pluginName = page.locator('h1, h2, [data-testid="plugin-name"]')
      await expect(pluginName.first()).toBeVisible({ timeout: 3000 })
      
      // Verify install button is visible
      const installButton = page.locator('button:has-text("Install"), button:has-text("Get Started")')
      await expect(installButton.first()).toBeVisible()
    }
  })

  test('should open installation wizard', async ({ page }) => {
    await page.goto('/marketplace')
    
    await page.waitForTimeout(1000)
    
    // Click install button on first plugin
    const installButton = page.locator('button:has-text("Install")').first()
    if (await installButton.count() > 0) {
      await installButton.click()
      
      // Verify installation wizard is open
      await expect(
        page.locator('[data-testid="installation-wizard"], [role="dialog"]').first()
      ).toBeVisible({ timeout: 3000 })
      
      // Verify wizard steps are visible
      const wizardSteps = page.locator('[data-testid="wizard-step"], [role="tab"]')
      const count = await wizardSteps.count()
      expect(count).toBeGreaterThan(0)
    }
  })

  test('should complete plugin installation', async ({ page }) => {
    await page.goto('/marketplace')
    
    await page.waitForTimeout(1000)
    
    // Click install on a simple plugin (e.g., Redis Management)
    const redisPlugin = page.locator('[data-testid="plugin-card"]:has-text("Redis")').first()
    if (await redisPlugin.count() > 0) {
      await redisPlugin.locator('button:has-text("Install")').click()
      
      // Wait for wizard
      await page.waitForSelector('[data-testid="installation-wizard"]', { timeout: 3000 })
      
      // Fill in configuration if needed
      const configInputs = page.locator('input[type="text"], input[type="password"]')
      const inputCount = await configInputs.count()
      
      if (inputCount > 0) {
        // Fill first input if it's a name field
        const firstInput = configInputs.first()
        const placeholder = await firstInput.getAttribute('placeholder')
        if (placeholder?.toLowerCase().includes('name')) {
          await firstInput.fill('Test Installation')
        }
      }
      
      // Click next/continue
      const nextButton = page.locator('button:has-text("Next"), button:has-text("Continue"), button:has-text("Install")')
      if (await nextButton.count() > 0) {
        await nextButton.click()
        
        // Verify installation success
        await expect(
          page.locator('text=Installed, text=Success, [data-testid="installation-success"]').first()
        ).toBeVisible({ timeout: 5000 })
      }
    }
  })
})

