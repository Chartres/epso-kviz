import { test, expect } from '@playwright/test'

// A returning visitor has the service worker installed. Its app-shell fallback must not
// swallow the prerendered pages, or the header links would open the app instead.
test('with the service worker active, static pages still load as documents', async ({ page }) => {
  await page.goto('/')
  await page.evaluate(async () => {
    await navigator.serviceWorker.ready
  })
  await page.reload()
  await expect.poll(() => page.evaluate(() => !!navigator.serviceWorker.controller)).toBe(true)
  for (const path of ['/acts/', '/acts/gdpr/', '/ai-act/', '/guide/ad-430-26-field-1/']) {
    await page.goto(path)
    await expect(page.locator('main h1'), path).toBeVisible()
    await expect(page.getByRole('heading', { name: 'EPSO AI Field Trainer' })).toHaveCount(0)
  }
})
