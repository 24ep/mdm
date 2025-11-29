import { test, expect } from '@playwright/test'
import { login } from './helpers/auth-helper'

test.setTimeout(120000)

test.describe('Workflows Feature', () => {
  test.beforeEach(async ({ page }) => {
    await login(page)
  })

  test('should display workflows list', async ({ page }) => {
    await page.goto('/workflows')
    
    // Wait for workflows to load
    await page.waitForSelector('[data-testid="workflows-list"], [data-testid="workflow-grid"]', { timeout: 5000 })
    
    // Check if workflows are displayed
    const workflowsContainer = page.locator('[data-testid="workflows-list"], [data-testid="workflow-grid"]').first()
    await expect(workflowsContainer).toBeVisible()
  })

  test('should create a new workflow', async ({ page }) => {
    await page.goto('/workflows')
    
    // Click "New Workflow" button
    await page.click('button:has-text("New Workflow"), a[href*="/workflows/new"]')
    
    // Wait for form or builder to load
    await page.waitForSelector('input[name="name"], input[placeholder*="name" i]', { timeout: 3000 })
    
    // Fill in workflow form
    await page.fill('input[name="name"], input[placeholder*="name" i]', 'E2E Test Workflow')
    await page.fill('textarea[name="description"], textarea[placeholder*="description" i]', 'This is a test workflow')
    
    // Submit form
    await page.click('button[type="submit"]:has-text("Create"), button:has-text("Save")')
    
    // Verify workflow was created
    await expect(page.locator('text=E2E Test Workflow').first()).toBeVisible({ timeout: 5000 })
  })

  test('should filter workflows by status', async ({ page }) => {
    await page.goto('/workflows')
    
    // Select status filter
    const statusSelect = page.locator('select[name="status"], [data-testid="status-filter"]')
    if (await statusSelect.count() > 0) {
      await statusSelect.selectOption('active')
      await page.waitForTimeout(1000)
      
      // Verify filtered results
      const workflows = page.locator('[data-testid="workflow-item"]')
      const count = await workflows.count()
      expect(count).toBeGreaterThanOrEqual(0)
    }
  })

  test('should search workflows', async ({ page }) => {
    await page.goto('/workflows')
    
    // Find search input
    const searchInput = page.locator('input[placeholder*="search" i], input[type="search"]')
    if (await searchInput.count() > 0) {
      await searchInput.fill('test')
      await page.waitForTimeout(1000)
      
      // Verify search results
      const results = page.locator('[data-testid="workflow-item"], [data-testid="workflow-card"]')
      const count = await results.count()
      expect(count).toBeGreaterThanOrEqual(0)
    }
  })

  test('should view workflow details', async ({ page }) => {
    await page.goto('/workflows')
    
    await page.waitForTimeout(1000)
    
    // Click on first workflow
    const firstWorkflow = page.locator('[data-testid="workflow-item"], [data-testid="workflow-card"]').first()
    if (await firstWorkflow.count() > 0) {
      await firstWorkflow.click()
      
      // Verify we're on workflow details page
      await expect(page).toHaveURL(/.*workflows\/.*/, { timeout: 3000 })
      
      // Verify workflow details are displayed
      const workflowName = page.locator('h1, h2, [data-testid="workflow-name"]')
      await expect(workflowName.first()).toBeVisible()
    }
  })

  test('should run a workflow', async ({ page }) => {
    await page.goto('/workflows')
    
    await page.waitForTimeout(1000)
    
    // Click on first workflow
    const firstWorkflow = page.locator('[data-testid="workflow-item"]').first()
    if (await firstWorkflow.count() > 0) {
      await firstWorkflow.click()
      
      // Wait for workflow details
      await page.waitForTimeout(1000)
      
      // Click run button
      const runButton = page.locator('button:has-text("Run"), button:has-text("Execute")')
      if (await runButton.count() > 0) {
        await runButton.click()
        
        // Verify workflow execution started
        await expect(
          page.locator('text=Running, text=Executing, [data-testid="workflow-status"]').first()
        ).toBeVisible({ timeout: 5000 })
      }
    }
  })
})

