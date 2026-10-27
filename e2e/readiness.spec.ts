import { test, expect } from '@playwright/test'
import { readFileSync } from 'node:fs'

// Persona: Lucie, a policy officer sitting AD/430/26 Field 1. She has met 12 new questions
// in each category (two in three right on the first try) and wants to know where she stands
// against the ranking, not just the 15/30 pass mark.
const questions = JSON.parse(readFileSync('data/questions.json', 'utf8')) as { id: number; cat: string }[]

function seededProgress() {
  const stats: Record<number, unknown> = {}
  for (const cat of new Set(questions.map((q) => q.cat))) {
    questions
      .filter((q) => q.cat === cat)
      .slice(0, 12)
      .forEach((q, i) => {
        const right = i % 3 !== 0
        stats[q.id] = { seen: 1, correct: right ? 1 : 0, streak: right ? 1 : 0, lastSeen: i + 1, lastCorrect: right, first: right }
      })
  }
  return { version: 1, stats, bookmarks: [], streak: { current: 0, best: 0, lastDate: '' }, updatedAt: 12 }
}

test('readiness: the Progress tab shows a likely-score range and the ranking rule', async ({ page }) => {
  await page.addInitScript((p) => localStorage.setItem('epso-kviz:progress:v1', JSON.stringify(p)), seededProgress())
  await page.setViewportSize({ width: 390, height: 844 })
  await page.goto('/')
  await page.getByRole('button', { name: 'Progress', exact: true }).click()
  await expect(page.getByRole('heading', { name: /likely score on a fresh paper/i })).toBeVisible()
  await expect(page.getByTestId('readiness-range')).toHaveText(/^\d{1,2}–\d{1,2}$/)
  await expect(page.getByText(/about 360 top scorers/)).toBeVisible()
  await page.screenshot({ path: 'e2e/shots/readiness-phone.png', fullPage: true })
})

test('readiness: an exam result explains the ranking instead of pass/fail', async ({ page }) => {
  await page.addInitScript((p) => localStorage.setItem('epso-kviz:progress:v1', JSON.stringify(p)), seededProgress())
  await page.goto('/')
  await page.getByRole('button', { name: 'Practice', exact: true }).click()
  await page.getByRole('button', { name: /Exam simulation/ }).click()
  await page.getByRole('button', { name: '← End' }).waitFor()
  await page.getByRole('timer').waitFor()
  for (let i = 0; i < 30; i++) {
    await page.locator('button[data-state="idle"]').first().click()
    await page.getByRole('button', { name: /Next|Finish/ }).click()
  }
  await expect(page.getByText(/the ranking decides/)).toBeVisible()
  await expect(page.getByTestId('readiness-range')).toBeVisible()
  await page.screenshot({ path: 'e2e/shots/readiness-exam.png', fullPage: true })
})
