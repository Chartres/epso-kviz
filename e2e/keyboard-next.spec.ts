import { test, expect } from '@playwright/test'

// Keyboard users advance with Enter after answering: one press moves exactly one question,
// whether focus sits on the clicked option or on the Next button itself.
test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => localStorage.setItem('epso-kviz:settings:v1', JSON.stringify({ questionFirst: 'none' })))
})

test('Enter after clicking an option moves to the next question', async ({ page }) => {
  await page.goto('/')
  await page.getByRole('button', { name: /Today's lesson/ }).click()
  await expect(page.getByText('01 / 12')).toBeVisible()
  await page.locator('button[data-state="idle"]').first().click()
  await page.keyboard.press('Enter')
  await expect(page.getByText('02 / 12')).toBeVisible()
})

test('Enter on a focused Next button moves exactly one question', async ({ page }) => {
  await page.goto('/')
  await page.getByRole('button', { name: /Today's lesson/ }).click()
  await page.locator('button[data-state="idle"]').first().click()
  await page.getByRole('button', { name: /Next/ }).focus()
  await page.keyboard.press('Enter')
  await expect(page.getByText('02 / 12')).toBeVisible()
  await expect(page.getByText('03 / 12')).toHaveCount(0)
})
