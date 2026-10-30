import { test, expect, type Page } from '@playwright/test'
import { readFileSync } from 'node:fs'

// Persona: Marek again, three weeks in, with a full commonplace book. He opens the Guide tab
// to read a lesson. The guide comes first; his book is below it, folded, under its own heading
// (Pavol, 2026-10-30: "make sure it doesn't crowd out the guide").
const questions = JSON.parse(readFileSync('data/questions.json', 'utf8')) as {
  id: number
  verified?: string
  sources?: { doc: string; ref: string; quote: string }[]
}[]
const entries = questions
  .filter((q) => q.verified && q.sources?.length)
  .slice(0, 8)
  .map((q, i) => ({ ...q.sources![0], q: q.id, at: 1_790_000_000_000 + i, on: true }))

async function openGuide(page: Page, width: number) {
  await page.setViewportSize({ width, height: 844 })
  await page.addInitScript((commonplace) => {
    localStorage.setItem(
      'epso-kviz:progress:v1',
      JSON.stringify({ version: 1, stats: {}, bookmarks: [], commonplace, streak: { current: 0, best: 0, lastDate: '' }, updatedAt: 1 }),
    )
  }, entries)
  await page.goto('/')
  await page.getByRole('button', { name: 'Guide', exact: true }).click()
  await expect(page.getByRole('heading', { name: 'Study guide' })).toBeVisible()
}

for (const width of [390, 1280]) {
  test(`guide tab at ${width} px: the guide comes first, the commonplace book below it`, async ({ page }) => {
    await openGuide(page, width)
    await page.screenshot({ path: `e2e/shots/guide-tab-after-${width}.png` })

    const contents = page.getByRole('navigation', { name: 'Contents' })
    const book = page.getByRole('heading', { name: 'My commonplace book' })
    await expect(contents).toBeInViewport()
    const c = (await contents.boundingBox())!
    const b = (await book.boundingBox())!
    expect(c.y).toBeLessThan(b.y)
    // The first lesson starts before the book: the book sits after all the lessons.
    const firstLesson = page.locator('section[id] h2').first()
    expect((await firstLesson.boundingBox())!.y).toBeLessThan(b.y)
  })
}

test('the commonplace book opens from the guide and keeps its passages', async ({ page }) => {
  await openGuide(page, 390)
  await page.getByRole('link', { name: /My commonplace book/ }).click()
  const toggle = page.getByRole('button', { name: /My commonplace book/ })
  await expect(toggle).toHaveAttribute('aria-expanded', 'true')
  await expect(page.getByRole('region', { name: /Regulation \(EU\) 2024\/1689/ })).toBeVisible()
  await page.evaluate(() => document.getElementById('commonplace-title')?.scrollIntoView({ block: 'start' }))
  await page.screenshot({ path: 'e2e/shots/guide-commonplace-open-390.png' })
  await toggle.click()
  await expect(toggle).toHaveAttribute('aria-expanded', 'false')
  await expect(page.getByRole('region', { name: /Regulation \(EU\) 2024\/1689/ })).toBeHidden()
})
