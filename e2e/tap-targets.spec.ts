import { test, expect, type Page } from '@playwright/test'

// Persona: a candidate practising on a phone with one thumb. Every control on the primary
// screens is at least 44 px in both directions (links marked data-inline, in running text, excepted).
test.use({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true })

async function smallTargets(page: Page): Promise<string[]> {
  return page.evaluate(() =>
    [...document.querySelectorAll('main button, main a, main label, nav button')]
      // Links in running text are exempt (WCAG 2.5.8) only when marked data-inline.
      .filter((e) => (e as HTMLElement).offsetParent !== null && !e.closest('[data-inline]'))
      .map((e) => ({ e, r: e.getBoundingClientRect() }))
      .filter(({ r }) => r.width > 0 && (r.height < 44 || r.width < 44))
      .map(({ e, r }) => `${(e.getAttribute('aria-label') || e.textContent || '').trim().slice(0, 30)} ${Math.round(r.width)}x${Math.round(r.height)}`),
  )
}

test('primary screens have no tap target under 44 px', async ({ page }) => {
  await page.addInitScript(() => localStorage.setItem('epso-kviz:settings:v1', JSON.stringify({ questionFirst: 'none' })))
  await page.goto('/')
  expect(await smallTargets(page), 'home').toEqual([])
  await page.getByRole('button', { name: /Today's lesson/ }).click()
  await page.locator('button[data-state="idle"]').first().click()
  expect(await smallTargets(page), 'lesson feedback').toEqual([])
  await page.getByRole('button', { name: '← End' }).click()
  await page.getByRole('button', { name: 'Practice', exact: true }).click()
  expect(await smallTargets(page), 'practice tab').toEqual([])
  await page.getByRole('button', { name: 'Guide', exact: true }).click()
  expect(await smallTargets(page), 'guide tab').toEqual([])
  // A verified question, so the citation links under its passages are measured too.
  await page.getByRole('button', { name: 'Practice', exact: true }).click()
  await page.getByRole('searchbox').fill('top penalty bracket')
  await page.getByRole('button', { name: 'Start practicing' }).click()
  await page.locator('button[data-state="idle"]').first().click()
  await expect(page.getByRole('link', { name: /AI Act, Art 99/ }).first()).toBeVisible()
  expect(await smallTargets(page), 'verified feedback').toEqual([])
  await page.getByRole('button', { name: '← End' }).click()
  expect(await smallTargets(page), 'home with an unfinished round').toEqual([])
  await page.getByRole('button', { name: 'Practice', exact: true }).click()
  await page.getByRole('searchbox').fill('')
  await page.getByRole('button', { name: /Exam simulation/ }).click()
  expect(await smallTargets(page), 'exam').toEqual([])
})
