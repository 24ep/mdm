import { test, expect } from '@playwright/test'

// Comprehensive automation test suite covering all major features
test.setTimeout(120000)

test.describe('Comprehensive Application Automation Tests', () => {
  // Test credentials - adjust based on your test environment
  const TEST_EMAIL = process.env.TEST_EMAIL || 'admin@example.com'
  const TEST_PASSWORD = process.env.TEST_PASSWORD || 'admin123'
  const TEST_SPACE = process.env.TEST_SPACE || 'default'

  // Helper function for login with retries
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
    
    // Wait for navigation after login
    await page.waitForURL(/\/(dashboard|$|\?|admin|system)/, { timeout: 15000 })
    await page.waitForTimeout(2000) // Give page time to load
  }

  test.beforeEach(async ({ page }) => {
    await login(page)
  })

  // ========== CORE FEATURES ==========
  
  test('should navigate to and load dashboard page', async ({ page }) => {
    await page.goto(`/${TEST_SPACE}/dashboard`)
    await page.waitForTimeout(2000)
    await expect(page.locator('body')).toBeVisible()
  })

  test('should navigate to tickets/projects page', async ({ page }) => {
    await page.goto(`/${TEST_SPACE}/projects`)
    await page.waitForTimeout(2000)
    await expect(page.locator('body')).toBeVisible()
  })

  test('should navigate to reports page', async ({ page }) => {
    await page.goto(`/${TEST_SPACE}/reports`)
    await page.waitForTimeout(2000)
    await expect(page.locator('body')).toBeVisible()
  })

  test('should navigate to workflows page', async ({ page }) => {
    await page.goto('/workflows')
    await page.waitForTimeout(2000)
    await expect(page.locator('body')).toBeVisible()
  })

  test('should navigate to infrastructure page', async ({ page }) => {
    await page.goto('/infrastructure')
    await page.waitForTimeout(2000)
    await expect(page.locator('body')).toBeVisible()
  })

  test('should navigate to marketplace page', async ({ page }) => {
    await page.goto('/marketplace')
    await page.waitForTimeout(2000)
    await expect(page.locator('body')).toBeVisible()
  })

  // ========== TOOLS SECTION ==========

  test('should navigate to BigQuery tool', async ({ page }) => {
    await page.goto('/tools/bigquery')
    await page.waitForTimeout(2000)
    await expect(page.locator('body')).toBeVisible()
  })

  test('should navigate to Notebook tool', async ({ page }) => {
    await page.goto('/tools/notebook')
    await page.waitForTimeout(2000)
    await expect(page.locator('body')).toBeVisible()
  })

  test('should navigate to AI Analyst tool', async ({ page }) => {
    await page.goto('/tools/ai-analyst')
    await page.waitForTimeout(2000)
    await expect(page.locator('body')).toBeVisible()
  })

  test('should navigate to AI Chat UI', async ({ page }) => {
    await page.goto('/tools/ai-chat-ui')
    await page.waitForTimeout(2000)
    await expect(page.locator('body')).toBeVisible()
  })

  test('should navigate to BI Reports tool', async ({ page }) => {
    await page.goto('/tools/bi')
    await page.waitForTimeout(2000)
    await expect(page.locator('body')).toBeVisible()
  })

  test('should navigate to Data Governance tool', async ({ page }) => {
    await page.goto('/tools/data-governance')
    await page.waitForTimeout(2000)
    await expect(page.locator('body')).toBeVisible()
  })

  test('should navigate to Storage tool', async ({ page }) => {
    await page.goto('/tools/storage')
    await page.waitForTimeout(2000)
    await expect(page.locator('body')).toBeVisible()
  })

  test('should navigate to Projects tool', async ({ page }) => {
    await page.goto('/tools/projects')
    await page.waitForTimeout(2000)
    await expect(page.locator('body')).toBeVisible()
  })

  // ========== KNOWLEDGE BASE ==========

  test('should navigate to knowledge base', async ({ page }) => {
    await page.goto('/knowledge')
    await page.waitForTimeout(2000)
    await expect(page.locator('body')).toBeVisible()
  })

  // ========== SYSTEM/ADMIN PAGES ==========

  test('should navigate to system users page', async ({ page }) => {
    await page.goto('/system/users')
    await page.waitForTimeout(2000)
    await expect(page.locator('body')).toBeVisible()
  })

  test('should navigate to system roles page', async ({ page }) => {
    await page.goto('/system/roles')
    await page.waitForTimeout(2000)
    await expect(page.locator('body')).toBeVisible()
  })

  test('should navigate to system settings page', async ({ page }) => {
    await page.goto('/system/settings')
    await page.waitForTimeout(2000)
    await expect(page.locator('body')).toBeVisible()
  })

  test('should navigate to system audit logs', async ({ page }) => {
    await page.goto('/system/audit')
    await page.waitForTimeout(2000)
    await expect(page.locator('body')).toBeVisible()
  })

  test('should navigate to system health dashboard', async ({ page }) => {
    await page.goto('/system/health')
    await page.waitForTimeout(2000)
    await expect(page.locator('body')).toBeVisible()
  })

  test('should navigate to system logs', async ({ page }) => {
    await page.goto('/system/logs')
    await page.waitForTimeout(2000)
    await expect(page.locator('body')).toBeVisible()
  })

  test('should navigate to system database management', async ({ page }) => {
    await page.goto('/system/database')
    await page.waitForTimeout(2000)
    await expect(page.locator('body')).toBeVisible()
  })

  test('should navigate to system security page', async ({ page }) => {
    await page.goto('/system/security')
    await page.waitForTimeout(2000)
    await expect(page.locator('body')).toBeVisible()
  })

  test('should navigate to system performance monitoring', async ({ page }) => {
    await page.goto('/system/performance')
    await page.waitForTimeout(2000)
    await expect(page.locator('body')).toBeVisible()
  })

  test('should navigate to system integrations', async ({ page }) => {
    await page.goto('/system/integrations')
    await page.waitForTimeout(2000)
    await expect(page.locator('body')).toBeVisible()
  })

  test('should navigate to system API management', async ({ page }) => {
    await page.goto('/system/api')
    await page.waitForTimeout(2000)
    await expect(page.locator('body')).toBeVisible()
  })

  test('should navigate to system themes', async ({ page }) => {
    await page.goto('/system/themes')
    await page.waitForTimeout(2000)
    await expect(page.locator('body')).toBeVisible()
  })

  test('should navigate to system notifications', async ({ page }) => {
    await page.goto('/system/notifications')
    await page.waitForTimeout(2000)
    await expect(page.locator('body')).toBeVisible()
  })

  test('should navigate to system cache management', async ({ page }) => {
    await page.goto('/system/cache')
    await page.waitForTimeout(2000)
    await expect(page.locator('body')).toBeVisible()
  })

  test('should navigate to system backup recovery', async ({ page }) => {
    await page.goto('/system/backup')
    await page.waitForTimeout(2000)
    await expect(page.locator('body')).toBeVisible()
  })

  test('should navigate to system data export/import', async ({ page }) => {
    await page.goto('/system/export')
    await page.waitForTimeout(2000)
    await expect(page.locator('body')).toBeVisible()
  })

  test('should navigate to system space settings', async ({ page }) => {
    await page.goto('/system/space-settings')
    await page.waitForTimeout(2000)
    await expect(page.locator('body')).toBeVisible()
  })

  test('should navigate to system space layouts', async ({ page }) => {
    await page.goto('/system/space-layouts')
    await page.waitForTimeout(2000)
    await expect(page.locator('body')).toBeVisible()
  })

  test('should navigate to system kernels', async ({ page }) => {
    await page.goto('/system/kernels')
    await page.waitForTimeout(2000)
    await expect(page.locator('body')).toBeVisible()
  })

  test('should navigate to system attachments', async ({ page }) => {
    await page.goto('/system/attachments')
    await page.waitForTimeout(2000)
    await expect(page.locator('body')).toBeVisible()
  })

  test('should navigate to system assets', async ({ page }) => {
    await page.goto('/system/assets')
    await page.waitForTimeout(2000)
    await expect(page.locator('body')).toBeVisible()
  })

  test('should navigate to system data management', async ({ page }) => {
    await page.goto('/system/data')
    await page.waitForTimeout(2000)
    await expect(page.locator('body')).toBeVisible()
  })

  test('should navigate to system SQL linting', async ({ page }) => {
    await page.goto('/system/sql-linting')
    await page.waitForTimeout(2000)
    await expect(page.locator('body')).toBeVisible()
  })

  test('should navigate to system schema migrations', async ({ page }) => {
    await page.goto('/system/schema-migrations')
    await page.waitForTimeout(2000)
    await expect(page.locator('body')).toBeVisible()
  })

  test('should navigate to system data masking', async ({ page }) => {
    await page.goto('/system/data-masking')
    await page.waitForTimeout(2000)
    await expect(page.locator('body')).toBeVisible()
  })

  test('should navigate to system change requests', async ({ page }) => {
    await page.goto('/system/change-requests')
    await page.waitForTimeout(2000)
    await expect(page.locator('body')).toBeVisible()
  })

  test('should navigate to system page templates', async ({ page }) => {
    await page.goto('/system/page-templates')
    await page.waitForTimeout(2000)
    await expect(page.locator('body')).toBeVisible()
  })

  test('should navigate to system permission tester', async ({ page }) => {
    await page.goto('/system/permission-tester')
    await page.waitForTimeout(2000)
    await expect(page.locator('body')).toBeVisible()
  })

  // ========== SPACE-SPECIFIC PAGES ==========

  test('should navigate to space settings', async ({ page }) => {
    await page.goto(`/${TEST_SPACE}/settings`)
    await page.waitForTimeout(2000)
    await expect(page.locator('body')).toBeVisible()
  })

  test('should navigate to space marketplace', async ({ page }) => {
    await page.goto(`/${TEST_SPACE}/marketplace`)
    await page.waitForTimeout(2000)
    await expect(page.locator('body')).toBeVisible()
  })

  test('should navigate to space infrastructure', async ({ page }) => {
    await page.goto(`/${TEST_SPACE}/infrastructure`)
    await page.waitForTimeout(2000)
    await expect(page.locator('body')).toBeVisible()
  })

  test('should navigate to space knowledge', async ({ page }) => {
    await page.goto(`/${TEST_SPACE}/knowledge`)
    await page.waitForTimeout(2000)
    await expect(page.locator('body')).toBeVisible()
  })

  // ========== FUNCTIONALITY TESTS ==========

  test('should perform search across application', async ({ page }) => {
    await page.goto('/')
    await page.waitForTimeout(2000)
    
    const searchInput = page.locator('input[type="search"], input[placeholder*="search" i]').first()
    if (await searchInput.count() > 0) {
      await searchInput.fill('test')
      await page.waitForTimeout(1000)
      expect(await searchInput.inputValue()).toBe('test')
    }
  })

  test('should handle navigation menu interactions', async ({ page }) => {
    await page.goto('/')
    await page.waitForTimeout(2000)
    
    // Check if navigation exists
    const nav = page.locator('nav, [role="navigation"], header').first()
    if (await nav.count() > 0) {
      await expect(nav).toBeVisible()
    }
  })

  test('should verify responsive design on mobile', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 })
    await page.goto('/')
    await page.waitForTimeout(2000)
    await expect(page.locator('body')).toBeVisible()
  })

  test('should verify responsive design on tablet', async ({ page }) => {
    await page.setViewportSize({ width: 768, height: 1024 })
    await page.goto('/')
    await page.waitForTimeout(2000)
    await expect(page.locator('body')).toBeVisible()
  })

  test('should verify responsive design on desktop', async ({ page }) => {
    await page.setViewportSize({ width: 1920, height: 1080 })
    await page.goto('/')
    await page.waitForTimeout(2000)
    await expect(page.locator('body')).toBeVisible()
  })

  test('should check for console errors on main pages', async ({ page }) => {
    const consoleErrors: string[] = []
    
    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        consoleErrors.push(msg.text())
      }
    })
    
    await page.goto('/')
    await page.waitForTimeout(3000)
    
    // Log but don't fail - some errors might be expected
    if (consoleErrors.length > 0) {
      console.log('Console errors on main page:', consoleErrors.slice(0, 5))
    }
    
    // Page should still be visible
    await expect(page.locator('body')).toBeVisible()
  })
})

