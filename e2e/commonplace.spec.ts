import { test, expect } from '@playwright/test'

// Persona: Marek, a data-protection lawyer sitting AD/430/26 Field 1. He learns the AI Act
// from its own wording: after a question, he copies the passage that settled it into his
// commonplace book, then rereads the book, filed by act and article, before a mock.
test('commonplace book: collect a verified passage, find it filed under its act', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 })
  await page.goto('/')
  await page.getByRole('button', { name: 'Practice', exact: true }).click()
  await page.getByRole('searchbox').fill('top penalty bracket')
  await page.getByRole('button', { name: 'Start practicing' }).click()
  await page.locator('button[data-state="idle"]').first().click()

  const collect = page.getByRole('button', { name: /copy to my commonplace book/i }).first()
  await collect.click()
  await expect(page.getByRole('button', { name: /in my commonplace book/i }).first()).toHaveAttribute('aria-pressed', 'true')
  await page.screenshot({ path: 'e2e/shots/commonplace-collect.png', fullPage: true })

  await page.getByRole('button', { name: /Next|Finish/ }).click()
  await page.getByRole('button', { name: 'Back to menu' }).click()
  await page.getByRole('button', { name: 'Guide', exact: true }).click()
  const act = page.getByRole('region', { name: /Regulation \(EU\) 2024\/1689/ })
  await expect(act).toBeVisible()
  await expect(act.getByText(/Art 99/).first()).toBeVisible()
  await expect(act.getByText(/top penalty bracket/)).toBeVisible()
  await page.screenshot({ path: 'e2e/shots/commonplace-book.png', fullPage: true })

  // It survives a reload (offline-first local progress).
  await page.reload()
  await page.getByRole('button', { name: 'Guide', exact: true }).click()
  await expect(page.getByRole('region', { name: /Regulation \(EU\) 2024\/1689/ })).toBeVisible()
})
