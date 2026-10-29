import { test, expect } from '@playwright/test'

// Persona: Jana, a Czech policy officer sitting AD/430/26. Verbal reasoning is eliminatory
// (pass 10/20) and taken in her language 1, Czech. She sits 20 statements in 35 minutes on
// her phone, judging each on the passage alone, then reads why.
test('verbal reasoning in Czech: a timed sitting on EUR-Lex passages, then the reasons', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 })
  await page.goto('/')
  await page.getByRole('button', { name: 'Practice', exact: true }).click()
  await page.getByRole('button', { name: /Verbal reasoning/ }).click()
  await page.getByText('Čeština').click()
  await page.getByRole('button', { name: 'Začít' }).click()

  await expect(page.getByText('Otázka 1 z 20')).toBeVisible()
  await expect(page.getByRole('timer')).toBeVisible()
  await expect(page.locator('blockquote')).toBeVisible()
  await expect(page.getByRole('link', { name: /CELEX/ })).toBeVisible()
  await expect(page.getByText('Nelze určit')).toBeVisible()
  const width = await page.evaluate(() => document.documentElement.scrollWidth)
  expect(width).toBeLessThanOrEqual(390)
  await page.screenshot({ path: 'e2e/shots/verbal-cs-question-390.png', fullPage: true })

  for (let i = 0; i < 20; i++) {
    await page.locator('input[type="radio"]').first().check()
    await page.getByRole('button', { name: i < 19 ? 'Další' : 'Dokončit' }).click()
  }
  await expect(page.getByTestId('verbal-score')).toContainText('z 20')
  await expect(page.getByText(/Minimální požadovaný počet bodů: 10 z 20/)).toBeVisible()
  await expect(page.getByTestId('solution')).toHaveCount(20)
  await page.screenshot({ path: 'e2e/shots/verbal-cs-results-390.png', fullPage: true })
})

test('verbal reasoning on a desktop, in English', async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 900 })
  await page.goto('/')
  await page.getByRole('button', { name: 'Practice', exact: true }).click()
  await page.getByRole('button', { name: /Verbal reasoning/ }).click()
  await page.getByText('English').click()
  await page.getByRole('button', { name: 'Start' }).click()
  await expect(page.getByText('Question 1 of 20')).toBeVisible()
  await expect(page.getByText('Cannot say')).toBeVisible()
  await page.screenshot({ path: 'e2e/shots/verbal-en-question-1280.png', fullPage: false })
})
