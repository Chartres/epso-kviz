import { test, expect, type Page } from '@playwright/test'

// Persona: Pavol, an AD/430 Field 1 candidate, practising on his phone on the tram. He wants
// to answer from memory before the options can prompt him. By default (form B) he writes a
// few words first; he can switch to A (tap), C (wait) or none from the Practice tab, and the
// exam simulation never holds the options back.
test.use({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true })

const options = (page: Page) => page.getByRole('group', { name: 'Answer options' })

async function practiseOne(page: Page) {
  await page.getByRole('searchbox').fill('top penalty bracket')
  await page.getByRole('button', { name: 'Start practicing' }).click()
  await expect(page.getByText(/^01 \/ 1$/)).toBeVisible()
}

async function pick(page: Page, label: string) {
  await page.getByRole('button', { name: 'Practice', exact: true }).click()
  await page.getByText(label, { exact: true }).click()
  await expect(page.getByRole('radio', { name: label })).toBeChecked()
}

test('question first: B by default in the lesson, switchable to none, A and C; never in the exam', async ({ page }) => {
  await page.goto('/')

  // Default B: the daily lesson opens with the stem and a box, no options.
  await page.getByRole('button', { name: /Today's lesson/ }).click()
  await expect(page.getByText('01 / 12')).toBeVisible()
  await expect(options(page)).toHaveCount(0)
  await page.getByLabel('Your answer, in a few words').fill('the highest fine tier')
  await page.getByRole('button', { name: 'Compare with the options' }).click()
  await expect(options(page)).toBeVisible()
  await page.locator('button[data-state="idle"]').first().click()
  await expect(page.getByText('Your words:')).toBeVisible()
  await expect(page.getByText('the highest fine tier')).toBeVisible()
  await page.getByRole('button', { name: '← End' }).click()

  // B on one known question, for the screenshot.
  await page.getByRole('button', { name: 'Practice', exact: true }).click()
  await expect(page.getByRole('radio', { name: 'B · Write' })).toBeChecked()
  await practiseOne(page)
  await expect(page.getByLabel('Your answer, in a few words')).toBeVisible()
  await page.screenshot({ path: 'e2e/shots/question-first-b-390.png' })
  await page.getByRole('button', { name: '← End' }).click()

  // A: tap to reveal.
  await pick(page, 'A · Tap')
  await page.screenshot({ path: 'e2e/shots/question-first-setting-390.png', fullPage: true })
  await practiseOne(page)
  await expect(options(page)).toHaveCount(0)
  await page.screenshot({ path: 'e2e/shots/question-first-a-390.png' })
  await page.getByRole('button', { name: 'Show the four options' }).click()
  await expect(options(page)).toBeVisible()
  await page.getByRole('button', { name: '← End' }).click()

  // C: the options arrive on their own.
  await pick(page, 'C · Wait')
  await practiseOne(page)
  await expect(page.getByText(/Options in \d s/)).toBeVisible()
  await page.screenshot({ path: 'e2e/shots/question-first-c-390.png' })
  await expect(options(page)).toBeVisible({ timeout: 12_000 })
  await page.getByRole('button', { name: '← End' }).click()

  // None: today's behaviour, and the choice survives a reload.
  await pick(page, 'None')
  await page.reload()
  await page.getByRole('button', { name: 'Practice', exact: true }).click()
  await expect(page.getByRole('radio', { name: 'None' })).toBeChecked()
  await practiseOne(page)
  await expect(options(page)).toBeVisible()
  await page.screenshot({ path: 'e2e/shots/question-first-none-390.png' })
  await page.getByRole('button', { name: '← End' }).click()

  // The exam simulation shows the options at once, whatever the setting.
  await pick(page, 'A · Tap')
  await page.getByRole('button', { name: /Exam simulation/ }).click()
  await expect(page.getByText('01 / 30')).toBeVisible()
  await expect(options(page)).toBeVisible()

  // No horizontal scroll at 390 px.
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)
  expect(overflow).toBeLessThanOrEqual(0)
})
