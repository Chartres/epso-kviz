import { test, expect } from '@playwright/test'

// Persona: Tomáš, a Czech ML engineer sitting AD/430/26. The abstract test is eliminatory and
// paired with numerical for a combined 10/20. He sits a 10-question, 10-minute set with Czech
// instructions on his phone, then reads which rule each wrong answer broke.
test('abstract reasoning in Czech: a timed sitting of figure series, then the rules explained', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 })
  await page.goto('/')
  await page.getByRole('button', { name: 'Practice', exact: true }).click()
  await page.getByRole('button', { name: /Abstract reasoning/ }).click()
  await page.getByText('Čeština').click()
  await page.getByRole('button', { name: 'Začít' }).click()

  await expect(page.getByText('Otázka 1 z 10')).toBeVisible()
  await expect(page.getByRole('timer')).toBeVisible()
  await expect(page.getByRole('list', { name: 'Řada obrazců' }).getByRole('img')).toHaveCount(5)
  await expect(page.getByRole('img', { name: /Možnost [ABCD]/ })).toHaveCount(4)
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth)
  expect(overflow).toBeLessThanOrEqual(0)
  await page.screenshot({ path: 'e2e/shots/abstract-cs-question-390.png', fullPage: true })

  for (let i = 0; i < 10; i++) {
    await page.locator('input[type="radio"]').first().check()
    await page.getByRole('button', { name: i < 9 ? 'Další' : 'Dokončit' }).click()
  }
  await expect(page.getByTestId('abstract-score')).toContainText('z 10')
  await expect(page.getByText(/Minimální požadovaný počet bodů: 10 z 20/)).toBeVisible()
  await expect(page.getByTestId('solution')).toHaveCount(10)
  await page.screenshot({ path: 'e2e/shots/abstract-cs-results-390.png', fullPage: true })
})

test('abstract reasoning on a desktop: the series reads as one row', async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 900 })
  await page.goto('/')
  await page.getByRole('button', { name: 'Practice', exact: true }).click()
  await page.getByRole('button', { name: /Abstract reasoning/ }).click()
  await page.getByText('English').click()
  await page.getByRole('button', { name: 'Start' }).click()
  const cells = page.getByRole('list', { name: 'Series of figures' }).getByRole('listitem')
  const tops = await cells.evaluateAll((els) => els.map((e) => Math.round(e.getBoundingClientRect().top)))
  expect(new Set(tops).size).toBe(1)
  await page.screenshot({ path: 'e2e/shots/abstract-en-question-1280.png', fullPage: false })
})
