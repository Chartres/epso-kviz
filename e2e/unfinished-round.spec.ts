import { test, expect, type Page } from '@playwright/test'

// Persona: Pavlína, an AD/430 Field 1 candidate on a Czech phone. She starts the daily lesson
// on the tram, answers eight questions in form B (write first), and gets off. That evening the
// lesson waits on home with "Pokračovat"; she picks it up at question 9 and finishes. The streak
// counts only then. Pavol's rule for all quiz apps, 2026-11-01.
test.use({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true, locale: 'cs-CZ' })

const card = (page: Page) => page.getByRole('region', { name: 'Rozpracovaný trénink' })
const pad = (n: number) => String(n).padStart(2, '0')

/** One question in form B: write, compare, pick the first option, then Next. */
async function answerB(page: Page, n: number, total: number) {
  await expect(page.getByText(`${pad(n)} / ${total}`)).toBeVisible()
  await page.getByLabel('Your answer, in a few words').fill(`answer ${n}`)
  await page.getByRole('button', { name: 'Compare with the options' }).click()
  await page.locator('button[data-state="idle"]').first().click()
  await page.getByRole('button', { name: /Next|Finish/ }).click()
}

test('a lesson left at 8 of 12 waits on home and resumes at question 9', async ({ page }) => {
  await page.goto('/')
  await expect(card(page)).toHaveCount(0)

  await page.getByRole('button', { name: /Today's lesson/ }).click()
  for (let n = 1; n <= 8; n++) await answerB(page, n, 12)
  const ninth = await page.locator('article h2').textContent()
  await page.getByRole('button', { name: '← End' }).click()

  // Home: the round waits, the answers count, the streak does not.
  await expect(card(page)).toBeVisible()
  await expect(page.getByTestId('unfinished-count')).toHaveText('8 / 12')
  await expect(page.getByRole('button', { name: 'Pokračovat' })).toBeVisible()
  await expect(page.getByRole('button', { name: 'Nový trénink' })).toBeVisible()
  await expect(page.getByTestId('stat-answered')).toHaveText('8')
  await expect(page.getByLabel('0 days streak')).toBeVisible()

  // It survives a reload (this device's storage).
  await page.reload()
  await expect(card(page)).toBeVisible()
  await page.screenshot({ path: 'e2e/shots/unfinished-home-390.png' })

  // Pokračovat: the same round at question 9, still question first.
  await page.getByRole('button', { name: 'Pokračovat' }).click()
  await expect(page.getByText('09 / 12')).toBeVisible()
  await expect(page.getByLabel('Your answer, in a few words')).toBeVisible()
  await expect(page.locator('article h2')).toHaveText(ninth!)
  await page.screenshot({ path: 'e2e/shots/unfinished-resumed-390.png' })

  for (let n = 9; n <= 12; n++) await answerB(page, n, 12)
  await expect(page.getByText('Lesson complete')).toBeVisible()
  await expect(page.getByText(/1\s*day streak/)).toBeVisible()

  await page.getByRole('button', { name: 'Back to menu' }).click()
  await expect(card(page)).toHaveCount(0)
})

test('Nový trénink replaces the round; an exam left early is not kept', async ({ page }) => {
  await page.goto('/')
  await page.getByRole('button', { name: /Today's lesson/ }).click()
  for (let n = 1; n <= 3; n++) await answerB(page, n, 12)
  await page.getByRole('button', { name: '← End' }).click()
  await expect(page.getByTestId('unfinished-count')).toHaveText('3 / 12')

  await page.getByRole('button', { name: 'Nový trénink' }).click()
  await expect(page.getByText('01 / 12')).toBeVisible()
  await page.getByRole('button', { name: '← End' }).click()
  await expect(card(page)).toHaveCount(0)

  // Exam: answers count in progress, but nothing waits and no attempt is recorded.
  await page.getByRole('button', { name: 'Practice', exact: true }).click()
  await page.getByRole('button', { name: /Exam simulation/ }).click()
  await expect(page.getByText('01 / 30')).toBeVisible()
  await page.locator('button[data-state="idle"]').first().click()
  await page.getByRole('button', { name: /Next|Finish/ }).click()
  await page.getByRole('button', { name: '← End' }).click()
  await expect(card(page)).toHaveCount(0)
  await expect(page.getByTestId('stat-answered')).toHaveText('4')
})
