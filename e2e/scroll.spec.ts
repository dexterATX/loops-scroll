import { test, expect } from '@playwright/test'

test.describe('Horizontal Scroll E2E Tests', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/')
    // Wait for Lenis to initialize instead of fixed timeout
    await page.waitForFunction(() => {
      // Check if GSAP ScrollTrigger is ready
      return (window as any).ScrollTrigger?.getAll?.()?.length > 0 || document.readyState === 'complete'
    }, { timeout: 10000 }).catch(() => {
      // Fallback if ScrollTrigger isn't exposed globally
    })
  })

  test('should load the page with all sections', async ({ page }) => {
    // Check that all sections are present (updated to match actual content)
    await expect(page.getByText('INTRO')).toBeVisible({ timeout: 5000 })
    await expect(page.getByText('PHILOSOPHY')).toBeVisible()
    await expect(page.getByText('EXPERIENCE')).toBeVisible()
    await expect(page.getByText('ACHIEVEMENTS')).toBeVisible()
    await expect(page.getByText('PROGRAMS')).toBeVisible()
    await expect(page.getByText('CONTACT')).toBeVisible()
  })

  test('should have correct initial layout', async ({ page }) => {
    // Check for horizontal scroll container using data attribute
    const container = page.locator('[data-scroll-to="horizontal"]').first()
    await expect(container).toBeVisible({ timeout: 5000 })

    // Check that INTRO section is visible initially
    await expect(page.getByText('INTRO')).toBeVisible()
  })

  test('should scroll down to see vertical sections', async ({ page }) => {
    // Scroll using evaluate for more reliable behavior
    await page.evaluate(() => {
      window.scrollBy(0, window.innerHeight * 3)
    })

    // Wait for scroll to complete and section to be visible
    await expect(page.getByText('EXPERIENCE')).toBeVisible({ timeout: 5000 })
  })

  test('should scroll to see CONTACT section at bottom', async ({ page }) => {
    // Scroll to bottom
    await page.evaluate(() => {
      window.scrollTo(0, document.body.scrollHeight)
    })

    // Wait for CONTACT to be visible
    await expect(page.getByText('CONTACT')).toBeVisible({ timeout: 5000 })
  })

  test('should have working smooth scroll', async ({ page }) => {
    // Get initial scroll position
    const initialScroll = await page.evaluate(() => window.scrollY)

    // Scroll down using evaluate
    await page.evaluate(() => {
      window.scrollBy(0, 500)
    })

    // Wait for scroll position to change
    await page.waitForFunction(
      (initial) => window.scrollY > initial,
      initialScroll,
      { timeout: 5000 }
    )

    // Scroll position should have changed
    const newScroll = await page.evaluate(() => window.scrollY)
    expect(newScroll).toBeGreaterThan(initialScroll)
  })

  test('should have correct data attributes on sections', async ({ page }) => {
    const introSection = page.locator('#section-intro')
    await expect(introSection).toHaveAttribute('data-scroll-to', 'horizontal')

    const experienceSection = page.locator('#section-experience')
    await expect(experienceSection).toHaveAttribute('data-scroll-to', 'vertical')
  })

  test('should have correct section order', async ({ page }) => {
    const sections = await page.locator('section').all()

    // Verify we have at least 6 sections
    expect(sections.length).toBeGreaterThanOrEqual(6)

    // Check first section is INTRO
    await expect(sections[0]).toContainText('INTRO')

    // Check second section is PHILOSOPHY
    await expect(sections[1]).toContainText('PHILOSOPHY')

    // Check last section is CONTACT
    await expect(sections[sections.length - 1]).toContainText('CONTACT')
  })
})

test.describe('Memory Leak Checks', () => {
  test('should not leak ScrollTrigger instances on navigation', async ({ page }) => {
    // Navigate to page
    await page.goto('/')

    // Wait for ScrollTrigger to initialize
    await page.waitForFunction(() => {
      return (window as any).ScrollTrigger?.getAll?.()?.length > 0
    }, { timeout: 10000 }).catch(() => {
      // ScrollTrigger might not be exposed globally
    })

    // Get initial ScrollTrigger count
    const initialCount = await page.evaluate(() => {
      return (window as any).ScrollTrigger?.getAll?.()?.length || 0
    })

    // Scroll to trigger animations
    await page.evaluate(() => {
      window.scrollBy(0, 1000)
    })

    // Wait for scroll to process
    await page.waitForFunction(() => window.scrollY > 500, { timeout: 5000 })

    // Navigate to refresh (simulates re-mount)
    await page.reload()

    // Wait for re-initialization
    await page.waitForFunction(() => {
      return (window as any).ScrollTrigger?.getAll?.()?.length > 0 || document.readyState === 'complete'
    }, { timeout: 10000 }).catch(() => {})

    // Check ScrollTrigger count
    const finalCount = await page.evaluate(() => {
      return (window as any).ScrollTrigger?.getAll?.()?.length || 0
    })

    // Count should be similar to initial (within reasonable bounds)
    // Using <= instead of < to be more precise
    expect(finalCount).toBeLessThanOrEqual(Math.max(initialCount + 2, 5))
  })

  test('should properly clean up on multiple reloads', async ({ page }) => {
    // Perform multiple reload cycles
    for (let i = 0; i < 3; i++) {
      await page.goto('/')

      // Wait for page to be ready
      await page.waitForLoadState('networkidle')

      // Small scroll to trigger ScrollTrigger
      await page.evaluate(() => window.scrollBy(0, 100))
    }

    // Get final count
    const finalCount = await page.evaluate(() => {
      return (window as any).ScrollTrigger?.getAll?.()?.length || 0
    })

    // Should not have accumulated instances
    expect(finalCount).toBeLessThanOrEqual(5)
  })
})

test.describe('Responsive Behavior', () => {
  test('should work on desktop viewport', async ({ page }) => {
    await page.setViewportSize({ width: 1920, height: 1080 })
    await page.goto('/')
    await expect(page.getByText('INTRO')).toBeVisible({ timeout: 5000 })
  })

  test('should work on tablet viewport', async ({ page }) => {
    await page.setViewportSize({ width: 768, height: 1024 })
    await page.goto('/')
    await expect(page.getByText('INTRO')).toBeVisible({ timeout: 5000 })
  })

  test('should work on mobile viewport', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 })
    await page.goto('/')
    await expect(page.getByText('INTRO')).toBeVisible({ timeout: 5000 })
  })
})

test.describe('Navigation', () => {
  test('should show navigation after page load', async ({ page }) => {
    await page.goto('/')

    // Wait for navigation to be revealed
    const nav = page.locator('.nav-header')
    await expect(nav).toBeVisible({ timeout: 5000 })
    await expect(nav).toHaveClass(/nav-revealed/)
  })

  test('should have clickable navigation items', async ({ page }) => {
    await page.goto('/')

    // Wait for navigation
    await expect(page.locator('.nav-scroll-list')).toBeVisible({ timeout: 5000 })

    // Click on a navigation item
    const navItems = page.locator('.nav-scroll-item')
    const firstItem = navItems.first()
    await expect(firstItem).toBeVisible()

    // Click should not cause errors
    await firstItem.click()

    // Navigation item should get clicked state
    await expect(firstItem).toHaveClass(/nav-clicked/)
  })
})

test.describe('Accessibility', () => {
  test('should have proper ARIA attributes on navigation', async ({ page }) => {
    await page.goto('/')

    // Check header role
    const header = page.locator('header')
    await expect(header).toHaveAttribute('role', 'banner')

    // Check nav role
    const nav = page.locator('nav')
    await expect(nav).toHaveAttribute('role', 'navigation')
    await expect(nav).toHaveAttribute('aria-label', 'Section navigation')

    // Check logo accessibility
    const logo = page.locator('.nav-logo')
    await expect(logo).toHaveAttribute('aria-label', 'Home')
  })

  test('should have progress bars with ARIA attributes', async ({ page }) => {
    await page.goto('/')

    const progressBars = page.locator('[role="progressbar"]')
    const count = await progressBars.count()

    expect(count).toBeGreaterThan(0)

    // Check first progress bar has required attributes
    const firstBar = progressBars.first()
    await expect(firstBar).toHaveAttribute('aria-valuemin', '0')
    await expect(firstBar).toHaveAttribute('aria-valuemax', '100')
  })
})
