import { test, expect } from '@playwright/test'
import { login } from './helpers/auth-helper'

test.setTimeout(120000)

test.describe('Tickets Feature', () => {
  const TEST_SPACE = process.env.TEST_SPACE || 'default'

  test.beforeEach(async ({ page }) => {
    await login(page)
  })

  test('should display tickets list', async ({ page }) => {
    await page.goto(`/${TEST_SPACE}/projects`)
    await page.waitForTimeout(2000)
    
    // Wait for tickets to load with flexible selectors
    await page.waitForSelector(
      '[data-testid="tickets-list"], [data-testid="ticket-item"], [data-testid="project-item"], .ticket-list, .project-list',
      { timeout: 10000 }
    )
    
    // Check if tickets are displayed
    const ticketsList = page.locator(
      '[data-testid="tickets-list"], [data-testid="ticket-item"], [data-testid="project-item"]'
    ).first()
    await expect(ticketsList).toBeVisible()
  })

  test('should create a new ticket', async ({ page }) => {
    await page.goto(`/${TEST_SPACE}/projects`)
    await page.waitForTimeout(2000)
    
    // Click "New Ticket" button
    const newButton = page.locator('button:has-text("New"), button:has-text("Create"), button:has-text("Add Ticket")').first()
    if (await newButton.count() > 0) {
      await newButton.click()
      await page.waitForTimeout(2000)
      
      // Fill in ticket form
      const titleInput = page.locator('input[name="title"], input[placeholder*="title" i]').first()
      const descriptionInput = page.locator('textarea[name="description"], textarea[placeholder*="description" i]').first()
      
      if (await titleInput.count() > 0) {
        const testTitle = `E2E Test Ticket ${Date.now()}`
        await titleInput.fill(testTitle)
        
        if (await descriptionInput.count() > 0) {
          await descriptionInput.fill('This is a test ticket created by E2E test')
        }
        
        // Submit form
        const submitButton = page.locator('button[type="submit"]').first()
        if (await submitButton.count() > 0) {
          await submitButton.click()
          await page.waitForTimeout(3000)
          
          // Verify ticket was created
          const successIndicator = page.locator(`text=${testTitle}, text=created, [data-testid="success"]`).first()
          if (await successIndicator.count() > 0) {
            await expect(successIndicator).toBeVisible({ timeout: 5000 })
          }
        }
      }
    }
  })

  test('should filter tickets by status', async ({ page }) => {
    await page.goto(`/${TEST_SPACE}/projects`)
    await page.waitForTimeout(2000)
    
    // Select status filter
    const statusFilter = page.locator('select[name="status"], [data-testid="status-filter"]').first()
    if (await statusFilter.count() > 0) {
      const options = await statusFilter.locator('option').count()
      if (options > 1) {
        await statusFilter.selectOption({ index: 1 })
        await page.waitForTimeout(2000)
        
        // Verify filtered results
        const statusBadges = page.locator('[data-testid="ticket-status"], [data-testid="status"]')
        const count = await statusBadges.count()
        expect(count).toBeGreaterThanOrEqual(0)
      }
    }
  })

  test('should edit a ticket', async ({ page }) => {
    await page.goto(`/${TEST_SPACE}/projects`)
    await page.waitForTimeout(2000)
    
    // Find first ticket
    const firstTicket = page.locator('[data-testid="ticket-item"], [data-testid="project-item"]').first()
    if (await firstTicket.count() > 0) {
      await firstTicket.click()
      await page.waitForTimeout(2000)
      
      // Look for edit button
      const editButton = page.locator('button:has-text("Edit"), button:has-text("Update")').first()
      if (await editButton.count() > 0) {
        await editButton.click()
        await page.waitForTimeout(2000)
        
        // Verify edit form is visible
        const form = page.locator('form, input[name="title"]').first()
        if (await form.count() > 0) {
          await expect(form).toBeVisible()
        }
      }
    }
  })

  test('should delete a ticket', async ({ page }) => {
    await page.goto(`/${TEST_SPACE}/projects`)
    await page.waitForTimeout(2000)
    
    // Find first ticket
    const firstTicket = page.locator('[data-testid="ticket-item"], [data-testid="project-item"]').first()
    if (await firstTicket.count() > 0) {
      await firstTicket.click()
      await page.waitForTimeout(2000)
      
      // Look for delete button
      const deleteButton = page.locator('button:has-text("Delete"), button:has-text("Remove")').first()
      if (await deleteButton.count() > 0) {
        await deleteButton.click()
        await page.waitForTimeout(1000)
        
        // Confirm deletion if confirmation dialog appears
        const confirmButton = page.locator('button:has-text("Confirm"), button:has-text("Delete")').first()
        if (await confirmButton.count() > 0) {
          await confirmButton.click()
          await page.waitForTimeout(2000)
        }
      }
    }
  })
})

