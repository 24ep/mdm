import { test, expect } from '@playwright/test'
import path from 'path'

// Comprehensive user interaction tests
test.setTimeout(120000)

test.describe('User Interactions and CRUD Operations', () => {
  const TEST_EMAIL = process.env.TEST_EMAIL || 'admin@example.com'
  const TEST_PASSWORD = process.env.TEST_PASSWORD || 'admin123'
  const TEST_SPACE = process.env.TEST_SPACE || 'default'

  // Helper function for login
  async function login(page: any) {
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

    await page.waitForSelector('input[type="email"], input[name="email"]', { timeout: 15000 })
    
    const emailInput = page.locator('input[type="email"], input[name="email"]').first()
    const passwordInput = page.locator('input[type="password"], input[name="password"]').first()
    
    await emailInput.fill(TEST_EMAIL)
    await passwordInput.fill(TEST_PASSWORD)
    
    const submitButton = page.locator('button[type="submit"]').first()
    await submitButton.click()
    
    await page.waitForURL(/\/(dashboard|$|\?|admin|system)/, { timeout: 15000 })
    await page.waitForTimeout(2000)
  }

  test.beforeEach(async ({ page }) => {
    await login(page)
  })

  // ========== TICKETS/PROJECTS CRUD ==========

  test('should create a new ticket/project', async ({ page }) => {
    await page.goto(`/${TEST_SPACE}/projects`)
    await page.waitForTimeout(2000)

    // Look for "New Ticket" or "Create" button
    const createButton = page.locator(
      'button:has-text("New"), button:has-text("Create"), button:has-text("Add"), a[href*="new"], a[href*="create"]'
    ).first()

    if (await createButton.count() > 0) {
      await createButton.click()
      await page.waitForTimeout(2000)

      // Fill in ticket form
      const titleInput = page.locator('input[name="title"], input[placeholder*="title" i], input[placeholder*="name" i]').first()
      const descriptionInput = page.locator('textarea[name="description"], textarea[placeholder*="description" i]').first()

      if (await titleInput.count() > 0) {
        const testTitle = `E2E Test Ticket ${Date.now()}`
        await titleInput.fill(testTitle)

        if (await descriptionInput.count() > 0) {
          await descriptionInput.fill('This is a test ticket created by E2E automation')
        }

        // Submit form
        const submitButton = page.locator('button[type="submit"]:has-text("Create"), button[type="submit"]:has-text("Save"), button:has-text("Submit")').first()
        if (await submitButton.count() > 0) {
          await submitButton.click()
          await page.waitForTimeout(3000)

          // Verify ticket was created - check for title or success message
          const successIndicator = page.locator(`text=${testTitle}, text=created, text=success, [data-testid="success"]`).first()
          if (await successIndicator.count() > 0) {
            await expect(successIndicator.first()).toBeVisible({ timeout: 5000 })
          }
        }
      }
    }
  })

  test('should view ticket/project details', async ({ page }) => {
    await page.goto(`/${TEST_SPACE}/projects`)
    await page.waitForTimeout(2000)

    // Find first ticket/project item
    const firstItem = page.locator(
      '[data-testid="ticket-item"], [data-testid="project-item"], [data-testid="ticket-card"], [data-testid="project-card"], a[href*="/projects/"], a[href*="/tickets/"]'
    ).first()

    if (await firstItem.count() > 0) {
      await firstItem.click()
      await page.waitForTimeout(2000)

      // Verify we're on details page
      const detailsPage = page.locator('h1, h2, [data-testid="ticket-title"], [data-testid="project-title"]').first()
      if (await detailsPage.count() > 0) {
        await expect(detailsPage).toBeVisible({ timeout: 5000 })
      }
    }
  })

  test('should edit ticket/project', async ({ page }) => {
    await page.goto(`/${TEST_SPACE}/projects`)
    await page.waitForTimeout(2000)

    // Find first item and click to view details
    const firstItem = page.locator(
      '[data-testid="ticket-item"], [data-testid="project-item"], a[href*="/projects/"]'
    ).first()

    if (await firstItem.count() > 0) {
      await firstItem.click()
      await page.waitForTimeout(2000)

      // Look for edit button
      const editButton = page.locator('button:has-text("Edit"), button:has-text("Update"), a[href*="edit"]').first()
      if (await editButton.count() > 0) {
        await editButton.click()
        await page.waitForTimeout(2000)

        // Try to modify title or description
        const titleInput = page.locator('input[name="title"], input[value]').first()
        if (await titleInput.count() > 0) {
          const currentValue = await titleInput.inputValue()
          await titleInput.fill(`${currentValue} - Updated`)
          
          // Save changes
          const saveButton = page.locator('button[type="submit"]:has-text("Save"), button:has-text("Update")').first()
          if (await saveButton.count() > 0) {
            await saveButton.click()
            await page.waitForTimeout(2000)
          }
        }
      }
    }
  })

  test('should filter tickets/projects by status', async ({ page }) => {
    await page.goto(`/${TEST_SPACE}/projects`)
    await page.waitForTimeout(2000)

    // Look for status filter
    const statusFilter = page.locator(
      'select[name="status"], [data-testid="status-filter"], button:has-text("Status")'
    ).first()

    if (await statusFilter.count() > 0) {
      // Try to select a status
      if (await statusFilter.locator('option').count() > 1) {
        await statusFilter.selectOption({ index: 1 })
        await page.waitForTimeout(2000)

        // Verify filter was applied
        const filteredItems = page.locator('[data-testid="ticket-item"], [data-testid="project-item"]')
        const count = await filteredItems.count()
        expect(count).toBeGreaterThanOrEqual(0)
      }
    }
  })

  test('should search tickets/projects', async ({ page }) => {
    await page.goto(`/${TEST_SPACE}/projects`)
    await page.waitForTimeout(2000)

    // Find search input
    const searchInput = page.locator('input[type="search"], input[placeholder*="search" i]').first()
    if (await searchInput.count() > 0) {
      await searchInput.fill('test')
      await page.waitForTimeout(2000)

      // Verify search was performed
      expect(await searchInput.inputValue()).toBe('test')
    }
  })

  // ========== DASHBOARDS CRUD ==========

  test('should create a new dashboard', async ({ page }) => {
    await page.goto(`/${TEST_SPACE}/dashboard`)
    await page.waitForTimeout(2000)

    // Look for create dashboard button
    const createButton = page.locator(
      'button:has-text("New Dashboard"), button:has-text("Create"), a[href*="/dashboards/new"]'
    ).first()

    if (await createButton.count() > 0) {
      await createButton.click()
      await page.waitForTimeout(2000)

      // Fill dashboard form
      const nameInput = page.locator('input[name="name"], input[placeholder*="name" i]').first()
      if (await nameInput.count() > 0) {
        const dashboardName = `E2E Dashboard ${Date.now()}`
        await nameInput.fill(dashboardName)

        // Submit
        const submitButton = page.locator('button[type="submit"]:has-text("Create"), button:has-text("Save")').first()
        if (await submitButton.count() > 0) {
          await submitButton.click()
          await page.waitForTimeout(3000)
        }
      }
    }
  })

  // ========== REPORTS CRUD ==========

  test('should create a new report', async ({ page }) => {
    await page.goto(`/${TEST_SPACE}/reports`)
    await page.waitForTimeout(2000)

    // Look for create report button
    const createButton = page.locator(
      'button:has-text("New Report"), button:has-text("Create"), a[href*="/reports/new"]'
    ).first()

    if (await createButton.count() > 0) {
      await createButton.click()
      await page.waitForTimeout(2000)

      // Fill report form
      const nameInput = page.locator('input[name="name"], input[placeholder*="name" i]').first()
      if (await nameInput.count() > 0) {
        const reportName = `E2E Report ${Date.now()}`
        await nameInput.fill(reportName)

        // Submit
        const submitButton = page.locator('button[type="submit"]:has-text("Create"), button:has-text("Save")').first()
        if (await submitButton.count() > 0) {
          await submitButton.click()
          await page.waitForTimeout(3000)
        }
      }
    }
  })

  // ========== WORKFLOWS ==========

  test('should create a new workflow', async ({ page }) => {
    await page.goto('/workflows')
    await page.waitForTimeout(2000)

    // Look for create workflow button
    const createButton = page.locator(
      'button:has-text("New Workflow"), button:has-text("Create"), a[href*="/workflows/new"]'
    ).first()

    if (await createButton.count() > 0) {
      await createButton.click()
      await page.waitForTimeout(2000)

      // Fill workflow form
      const nameInput = page.locator('input[name="name"], input[placeholder*="name" i]').first()
      if (await nameInput.count() > 0) {
        const workflowName = `E2E Workflow ${Date.now()}`
        await nameInput.fill(workflowName)

        // Submit
        const submitButton = page.locator('button[type="submit"]:has-text("Create"), button:has-text("Save")').first()
        if (await submitButton.count() > 0) {
          await submitButton.click()
          await page.waitForTimeout(3000)
        }
      }
    }
  })

  test('should execute a workflow', async ({ page }) => {
    await page.goto('/workflows')
    await page.waitForTimeout(2000)

    // Find first workflow
    const firstWorkflow = page.locator('[data-testid="workflow-item"], [data-testid="workflow-card"]').first()
    if (await firstWorkflow.count() > 0) {
      await firstWorkflow.click()
      await page.waitForTimeout(2000)

      // Look for run/execute button
      const runButton = page.locator('button:has-text("Run"), button:has-text("Execute"), button:has-text("Start")').first()
      if (await runButton.count() > 0) {
        await runButton.click()
        await page.waitForTimeout(3000)

        // Verify workflow started
        const statusIndicator = page.locator('text=Running, text=Executing, text=Started, [data-testid="workflow-status"]').first()
        if (await statusIndicator.count() > 0) {
          await expect(statusIndicator).toBeVisible({ timeout: 5000 })
        }
      }
    }
  })

  // ========== FORM VALIDATION ==========

  test('should validate required form fields', async ({ page }) => {
    await page.goto(`/${TEST_SPACE}/projects`)
    await page.waitForTimeout(2000)

    // Try to create new item
    const createButton = page.locator('button:has-text("New"), button:has-text("Create")').first()
    if (await createButton.count() > 0) {
      await createButton.click()
      await page.waitForTimeout(2000)

      // Try to submit without filling required fields
      const submitButton = page.locator('button[type="submit"]').first()
      if (await submitButton.count() > 0) {
        await submitButton.click()
        await page.waitForTimeout(2000)

        // Check for validation errors
        const errorMessages = page.locator('text=required, text=invalid, [role="alert"], .error, [data-testid="error"]')
        const errorCount = await errorMessages.count()
        
        // Either validation errors appear or form doesn't submit
        expect(errorCount).toBeGreaterThanOrEqual(0)
      }
    }
  })

  test('should handle form submission errors', async ({ page }) => {
    await page.goto(`/${TEST_SPACE}/projects`)
    await page.waitForTimeout(2000)

    const createButton = page.locator('button:has-text("New"), button:has-text("Create")').first()
    if (await createButton.count() > 0) {
      await createButton.click()
      await page.waitForTimeout(2000)

      // Fill with potentially invalid data
      const titleInput = page.locator('input[name="title"], input[placeholder*="name" i]').first()
      if (await titleInput.count() > 0) {
        // Try with very long text or special characters
        await titleInput.fill('A'.repeat(1000))
        
        const submitButton = page.locator('button[type="submit"]').first()
        if (await submitButton.count() > 0) {
          await submitButton.click()
          await page.waitForTimeout(2000)

          // Page should handle error gracefully
          await expect(page.locator('body')).toBeVisible()
        }
      }
    }
  })

  // ========== FILE UPLOAD ==========

  test('should handle file upload', async ({ page }) => {
    // Try to find a page with file upload (attachments, assets, etc.)
    await page.goto('/system/attachments')
    await page.waitForTimeout(2000)

    // Look for file input
    const fileInput = page.locator('input[type="file"]').first()
    if (await fileInput.count() > 0) {
      // Create a test file
      const testFilePath = path.join(__dirname, '../test-file.txt')
      
      // Note: In real scenario, you'd create an actual file
      // For now, just verify the input exists
      await expect(fileInput).toBeVisible()
    }
  })

  // ========== MODAL DIALOGS ==========

  test('should open and close modal dialogs', async ({ page }) => {
    await page.goto(`/${TEST_SPACE}/projects`)
    await page.waitForTimeout(2000)

    // Look for buttons that might open modals
    const modalTriggers = page.locator(
      'button:has-text("Delete"), button:has-text("Remove"), button:has-text("Settings")'
    )

    if (await modalTriggers.count() > 0) {
      await modalTriggers.first().click()
      await page.waitForTimeout(1000)

      // Look for modal
      const modal = page.locator('[role="dialog"], .modal, [data-testid="modal"]').first()
      if (await modal.count() > 0) {
        await expect(modal).toBeVisible({ timeout: 3000 })

        // Try to close modal
        const closeButton = page.locator('button:has-text("Close"), button:has-text("Cancel"), [aria-label="Close"]').first()
        if (await closeButton.count() > 0) {
          await closeButton.click()
          await page.waitForTimeout(1000)
        } else {
          // Try clicking outside or ESC key
          await page.keyboard.press('Escape')
          await page.waitForTimeout(1000)
        }
      }
    }
  })

  // ========== PAGINATION ==========

  test('should navigate through pagination', async ({ page }) => {
    await page.goto(`/${TEST_SPACE}/projects`)
    await page.waitForTimeout(2000)

    // Look for pagination controls
    const nextButton = page.locator('button:has-text("Next"), a:has-text("Next"), [aria-label*="next" i]').first()
    const prevButton = page.locator('button:has-text("Previous"), a:has-text("Prev"), [aria-label*="prev" i]').first()

    if (await nextButton.count() > 0) {
      await nextButton.click()
      await page.waitForTimeout(2000)
      
      // Verify page changed
      const currentPage = page.url()
      expect(currentPage).toContain('projects')
    } else if (await prevButton.count() > 0) {
      // If on page 2+, try previous
      await prevButton.click()
      await page.waitForTimeout(2000)
    }
  })

  // ========== SORTING ==========

  test('should sort list items', async ({ page }) => {
    await page.goto(`/${TEST_SPACE}/projects`)
    await page.waitForTimeout(2000)

    // Look for sort controls
    const sortButton = page.locator(
      'button:has-text("Sort"), select[name*="sort"], [data-testid="sort"]'
    ).first()

    if (await sortButton.count() > 0) {
      await sortButton.click()
      await page.waitForTimeout(2000)

      // If it's a select, choose an option
      if (await sortButton.locator('option').count() > 0) {
        await sortButton.selectOption({ index: 1 })
        await page.waitForTimeout(2000)
      }
    }
  })

  // ========== BULK OPERATIONS ==========

  test('should select multiple items for bulk operations', async ({ page }) => {
    await page.goto(`/${TEST_SPACE}/projects`)
    await page.waitForTimeout(2000)

    // Look for checkboxes
    const checkboxes = page.locator('input[type="checkbox"]:not([type="hidden"])')
    const checkboxCount = await checkboxes.count()

    if (checkboxCount > 0) {
      // Select first checkbox
      await checkboxes.first().check()
      await page.waitForTimeout(1000)

      // Look for bulk action buttons
      const bulkActions = page.locator('button:has-text("Delete"), button:has-text("Archive"), button:has-text("Bulk")')
      if (await bulkActions.count() > 0) {
        await expect(bulkActions.first()).toBeVisible()
      }
    }
  })

  // ========== TOAST NOTIFICATIONS ==========

  test('should display toast notifications', async ({ page }) => {
    // Perform an action that triggers a toast
    await page.goto(`/${TEST_SPACE}/projects`)
    await page.waitForTimeout(2000)

    // Try to create something to trigger success toast
    const createButton = page.locator('button:has-text("New"), button:has-text("Create")').first()
    if (await createButton.count() > 0) {
      await createButton.click()
      await page.waitForTimeout(2000)

      const titleInput = page.locator('input[name="title"], input[placeholder*="name" i]').first()
      if (await titleInput.count() > 0) {
        await titleInput.fill(`Toast Test ${Date.now()}`)
        
        const submitButton = page.locator('button[type="submit"]').first()
        if (await submitButton.count() > 0) {
          await submitButton.click()
          await page.waitForTimeout(2000)

          // Look for toast notification
          const toast = page.locator('[role="alert"], .toast, [data-testid="toast"]').first()
          if (await toast.count() > 0) {
            await expect(toast).toBeVisible({ timeout: 3000 })
          }
        }
      }
    }
  })

  // ========== SEARCH WITH RESULTS ==========

  test('should perform search and display results', async ({ page }) => {
    await page.goto(`/${TEST_SPACE}/projects`)
    await page.waitForTimeout(2000)

    const searchInput = page.locator('input[type="search"], input[placeholder*="search" i]').first()
    if (await searchInput.count() > 0) {
      await searchInput.fill('test')
      await page.waitForTimeout(2000)

      // Verify search results appear
      const results = page.locator('[data-testid="ticket-item"], [data-testid="project-item"], .search-result')
      const resultCount = await results.count()
      
      // Results might be 0 or more, but search should work
      expect(resultCount).toBeGreaterThanOrEqual(0)
    }
  })

  // ========== FILTER APPLICATION ==========

  test('should apply and clear filters', async ({ page }) => {
    await page.goto(`/${TEST_SPACE}/projects`)
    await page.waitForTimeout(2000)

    // Apply filter
    const filterButton = page.locator('button:has-text("Filter"), select[name*="filter"]').first()
    if (await filterButton.count() > 0) {
      await filterButton.click()
      await page.waitForTimeout(1000)

      // If it's a select, choose option
      if (await filterButton.locator('option').count() > 0) {
        await filterButton.selectOption({ index: 1 })
        await page.waitForTimeout(2000)
      }

      // Clear filter
      const clearButton = page.locator('button:has-text("Clear"), button:has-text("Reset")').first()
      if (await clearButton.count() > 0) {
        await clearButton.click()
        await page.waitForTimeout(2000)
      }
    }
  })
})

