import { test, expect } from '@playwright/test'

// Persona: Zuzana, a Slovak data scientist sitting AD/430/26. The reasoning tests are
// eliminatory and taken in her language 1, Slovak, and no prep she has found offers them in
// Slovak. She sits a 10-question, 20-minute numerical set on her phone and reads the solutions.
test('numerical reasoning in Slovak: a timed sitting, then worked solutions', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 })
  await page.goto('/')
  await page.getByRole('button', { name: 'Practice', exact: true }).click()
  await page.getByRole('button', { name: /Numerical reasoning/ }).click()
  await page.getByText('Slovenčina').click()
  await page.getByRole('button', { name: 'Začať' }).click()

  await expect(page.getByText('Otázka 1 z 10')).toBeVisible()
  await expect(page.getByRole('timer')).toBeVisible()
  await expect(page.getByRole('table')).toBeVisible()
  await expect(page.getByText(/Fiktívne údaje/)).toBeVisible()
  await page.screenshot({ path: 'e2e/shots/numerical-sk-question.png', fullPage: true })

  for (let i = 0; i < 10; i++) {
    await page.locator('input[type="radio"]').first().check()
    await page.getByRole('button', { name: i < 9 ? 'Ďalej' : 'Dokončiť' }).click()
  }
  await expect(page.getByText('z 10', { exact: false }).first()).toBeVisible()
  await expect(page.getByText(/Minimálny požadovaný počet bodov: 10 z 20/)).toBeVisible()
  await expect(page.getByTestId('solution')).toHaveCount(10)
  await page.screenshot({ path: 'e2e/shots/numerical-sk-results.png', fullPage: true })
})
