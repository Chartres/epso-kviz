import { test, expect } from '@playwright/test'
import questions from '../data/questions.json' with { type: 'json' }

// Persona: Pavol, three weeks from the field-related MCQ, has worked through all but 6 of the
// governance questions. He wants a mock that tells him something about the real test, where
// every question is new: the exam draws unseen questions first and says how many it has.
test.use({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true })

const governance = (questions as { id: number; cat: string }[]).filter((q) => q.cat === 'AI Act & Governance')
const answered = governance.slice(0, governance.length - 6).map((q) => q.id)

test.beforeEach(async ({ page }) => {
  await page.addInitScript((ids: number[]) => {
    const stats: Record<number, unknown> = {}
    for (const id of ids) stats[id] = { seen: 1, correct: 1, streak: 1, lastSeen: 1, lastCorrect: true, first: true, firstSeen: 1 }
    localStorage.setItem(
      'epso-kviz:progress:v1',
      JSON.stringify({ version: 1, stats, bookmarks: [], streak: { current: 0, best: 0, lastDate: '' }, updatedAt: 1 }),
    )
    localStorage.setItem('epso-kviz:settings:v1', JSON.stringify({ questionFirst: 'none' }))
  }, answered)
})

test('the exam simulation draws unseen questions first and says how many are new', async ({ page }) => {
  await page.goto('/')
  await page.getByRole('button', { name: 'Practice', exact: true }).click()
  await expect(page.getByTestId('exam-new')).toHaveText('26 of 30 new to you; the rest you have answered before.')
  await page.screenshot({ path: 'e2e/shots/exam-unseen-390.png' })
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBe(390)

  await page.getByRole('button', { name: /Exam simulation/ }).click()
  await expect(page.getByText('01 / 30')).toBeVisible()
  // Walk the 30 stems; only 4 may be governance questions answered before.
  const seen = new Set(answered)
  const stems = new Map((questions as { id: number; q: string }[]).map((q) => [q.q, q.id]))
  let repeats = 0
  for (let i = 0; i < 30; i++) {
    const stem = (await page.locator('article h2').textContent())!.trim()
    if (seen.has(stems.get(stem)!)) repeats++
    await page.locator('button[data-state="idle"]').first().click()
    await page.getByRole('button', { name: /Next|Finish/ }).click()
  }
  expect(repeats).toBe(4)
})
