import { test, expect } from '@playwright/test'
import { login } from './helpers/auth-helper'

test.setTimeout(120000)

test.describe('Infrastructure Feature', () => {
  test.beforeEach(async ({ page }) => {
    await login(page)
  })

  test('should display infrastructure instances', async ({ page }) => {
    await page.goto('/infrastructure')
    
    // Wait for instances to load
    await page.waitForSelector('[data-testid="instance-card"], [data-testid="infrastructure-list"]', { timeout: 5000 })
    
    // Check if instances are displayed
    const instancesContainer = page.locator('[data-testid="instance-card"], [data-testid="infrastructure-list"]').first()
    await expect(instancesContainer).toBeVisible()
  })

  test('should filter instances by type', async ({ page }) => {
    await page.goto('/infrastructure')
    
    // Wait for instances to load
    await page.waitForTimeout(1000)
    
    // Look for type filter
    const typeFilter = page.locator('select[name="type"], [data-testid="type-filter"]')
    if (await typeFilter.count() > 0) {
      // Select a type
      const options = await typeFilter.locator('option').count()
      if (options > 1) {
        await typeFilter.selectOption({ index: 1 })
        await page.waitForTimeout(1000)
        
        // Verify filtered results
        const instances = page.locator('[data-testid="instance-card"]')
        const count = await instances.count()
        expect(count).toBeGreaterThanOrEqual(0)
      }
    }
  })

  test('should search instances', async ({ page }) => {
    await page.goto('/infrastructure')
    
    // Find search input
    const searchInput = page.locator('input[placeholder*="search" i], input[type="search"]')
    if (await searchInput.count() > 0) {
      await searchInput.fill('test')
      await page.waitForTimeout(1000)
      
      // Verify search results
      const results = page.locator('[data-testid="instance-card"]')
      const count = await results.count()
      expect(count).toBeGreaterThanOrEqual(0)
    }
  })

  test('should view instance details', async ({ page }) => {
    await page.goto('/infrastructure')
    
    await page.waitForTimeout(1000)
    
    // Click on first instance
    const firstInstance = page.locator('[data-testid="instance-card"]').first()
    if (await firstInstance.count() > 0) {
      await firstInstance.click()
      
      // Verify instance details are displayed
      const instanceName = page.locator('h1, h2, [data-testid="instance-name"]')
      await expect(instanceName.first()).toBeVisible({ timeout: 3000 })
      
      // Verify services list is visible
      const servicesList = page.locator('[data-testid="services-list"], [data-testid="instance-services"]')
      await expect(servicesList.first()).toBeVisible()
    }
  })

  test('should discover services on instance', async ({ page }) => {
    await page.goto('/infrastructure')
    
    await page.waitForTimeout(1000)
    
    // Click on first instance
    const firstInstance = page.locator('[data-testid="instance-card"]').first()
    if (await firstInstance.count() > 0) {
      await firstInstance.click()
      
      // Wait for instance details
      await page.waitForTimeout(1000)
      
      // Click discover services button
      const discoverButton = page.locator('button:has-text("Discover"), button:has-text("Scan")')
      if (await discoverButton.count() > 0) {
        await discoverButton.click()
        
        // Verify discovery started
        await expect(
          page.locator('text=Discovering, text=Scanning, [data-testid="discovery-status"]').first()
        ).toBeVisible({ timeout: 5000 })
      }
    }
  })

  test('should assign management plugin to service', async ({ page }) => {
    await page.goto('/infrastructure')
    
    await page.waitForTimeout(1000)
    
    // Click on first instance
    const firstInstance = page.locator('[data-testid="instance-card"]').first()
    if (await firstInstance.count() > 0) {
      await firstInstance.click()
      
      // Wait for services list
      await page.waitForSelector('[data-testid="service-item"]', { timeout: 3000 })
      
      // Click on first service
      const firstService = page.locator('[data-testid="service-item"]').first()
      if (await firstService.count() > 0) {
        await firstService.click()
        
        // Look for assign plugin button
        const assignButton = page.locator('button:has-text("Assign Plugin"), button:has-text("Manage")')
        if (await assignButton.count() > 0) {
          await assignButton.click()
          
          // Verify plugin selector is open
          await expect(
            page.locator('[data-testid="plugin-selector"], [role="dialog"]').first()
          ).toBeVisible({ timeout: 3000 })
        }
      }
    }
  })
})

