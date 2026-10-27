import { test, expect } from '@playwright/test'

test('practice journey: home → practice tab → answer → feedback', async ({ page }) => {
  await page.goto('/')
  await expect(page.getByRole('heading', { name: 'EPSO AI Field Trainer' })).toBeVisible()

  // Go to the Practice tab, narrow to one category, start.
  await page.getByRole('button', { name: 'Practice', exact: true }).click()
  await page.getByRole('button', { name: /EU Digital Policy & Strategy/ }).click()
  await page.screenshot({ path: 'e2e/shots/menu.png', fullPage: true })
  await page.getByRole('button', { name: 'Start practicing' }).click()

  await expect(page.getByText(/^01 \/ \d+$/)).toBeVisible()
  await page.locator('button[data-state="idle"]').first().click()
  await expect(page.locator('button[data-state="correct"]')).toBeVisible()
  await page.screenshot({ path: 'e2e/shots/feedback.png', fullPage: true })

  await page.getByRole('button', { name: /Next|Finish/ }).click()
  await expect(page.getByText(/^02 \/ \d+$/)).toBeVisible()
})

test('daily lesson from home: 12 questions with completion + streak', async ({
  page,
}) => {
  await page.goto('/')
  await page.getByRole('button', { name: /Today's lesson/ }).click()
  await expect(page.getByText('01 / 12')).toBeVisible()
  for (let i = 0; i < 12; i++) {
    await page.locator('button[data-state="idle"]').first().click()
    await page.getByRole('button', { name: /Next|Finish/ }).click()
  }
  await expect(page.getByText('Lesson complete')).toBeVisible()
  await expect(page.getByText(/day.*streak|days.*streak/)).toBeVisible()
  // Results screen carries the feedback card — capture it for visual review.
  await expect(page.getByRole('button', { name: /Write to the author/ })).toBeVisible()
  await page.screenshot({ path: 'e2e/shots/results.png', fullPage: true })
})

test('exam mode from practice tab: 30 questions with a timer', async ({ page }) => {
  await page.goto('/')
  await page.getByRole('button', { name: 'Practice', exact: true }).click()
  await page.getByRole('button', { name: /Exam simulation/ }).click()
  await expect(page.getByText('01 / 30')).toBeVisible()
  await expect(page.getByRole('timer')).toBeVisible()
  await page.locator('button[data-state="idle"]').first().click()
  await expect(page.locator('button[data-state="correct"]')).toHaveCount(0)
})

test('guide and stats tabs are reachable', async ({ page }) => {
  await page.goto('/')
  await page.getByRole('button', { name: 'Guide', exact: true }).click()
  await expect(page.getByRole('heading', { name: 'Study guide' })).toBeVisible()
  await expect(page.getByRole('heading', { name: /AI Act — identity card/ })).toBeVisible()
  await page.getByRole('button', { name: 'Progress', exact: true }).click()
  await expect(page.getByRole('heading', { name: 'Statistics' })).toBeVisible()
})

test('verified question: the rationale cites the official text with a EUR-Lex link', async ({ page }) => {
  await page.goto('/')
  await page.getByRole('button', { name: 'Practice', exact: true }).click()
  // One known verified question (id 1041, the top penalty bracket), so the run is deterministic.
  await page.getByRole('searchbox').fill('top penalty bracket')
  await page.getByRole('button', { name: 'Start practicing' }).click()
  await expect(page.getByText(/^01 \/ 1$/)).toBeVisible()
  await page.locator('button[data-state="idle"]').first().click()
  const source = page.getByRole('link', { name: /^AI Act, Art 99/ }).first()
  await expect(source).toBeVisible()
  await expect(source).toHaveAttribute('href', /^https:\/\/eur-lex\.europa\.eu\//)
  await expect(page.getByText(/Checked against the official text on \d{4}-\d{2}-\d{2}/)).toBeVisible()
  await page.screenshot({ path: 'e2e/shots/citation.png', fullPage: true })
})
