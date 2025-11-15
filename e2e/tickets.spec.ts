import { test, expect } from '@playwright/test'

test.describe('Tickets Feature', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to login page and authenticate
    // This is a placeholder - adjust based on your auth flow
    await page.goto('/login')
    // Add login steps here
  })

  test('should display tickets list', async ({ page }) => {
    await page.goto('/[space]/projects')
    
    // Wait for tickets to load
    await page.waitForSelector('[data-testid="tickets-list"]', { timeout: 5000 })
    
    // Check if tickets are displayed
    const ticketsList = page.locator('[data-testid="tickets-list"]')
    await expect(ticketsList).toBeVisible()
  })

  test('should create a new ticket', async ({ page }) => {
    await page.goto('/[space]/projects')
    
    // Click "New Ticket" button
    await page.click('button:has-text("New Ticket")')
    
    // Fill in ticket form
    await page.fill('input[name="title"]', 'E2E Test Ticket')
    await page.fill('textarea[name="description"]', 'This is a test ticket created by E2E test')
    
    // Submit form
    await page.click('button[type="submit"]')
    
    // Verify ticket was created
    await expect(page.locator('text=E2E Test Ticket')).toBeVisible()
  })

  test('should filter tickets by status', async ({ page }) => {
    await page.goto('/[space]/projects')
    
    // Select status filter
    await page.selectOption('select[name="status"]', 'TODO')
    
    // Wait for filtered results
    await page.waitForTimeout(1000)
    
    // Verify all displayed tickets have TODO status
    const statusBadges = page.locator('[data-testid="ticket-status"]')
    const count = await statusBadges.count()
    
    for (let i = 0; i < count; i++) {
      await expect(statusBadges.nth(i)).toHaveText('TODO')
    }
  })
})

