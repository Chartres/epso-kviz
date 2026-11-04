import { test, expect, type Page } from '@playwright/test'

// Persona: a candidate practising on a phone with one thumb. Every control on the primary
// screens is at least 44 px in both directions (inline text links and hidden radios excepted).
test.use({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true })

async function smallTargets(page: Page): Promise<string[]> {
  return page.evaluate(() =>
    [...document.querySelectorAll('main button, main a, main label, nav button')]
      .filter((e) => (e as HTMLElement).offsetParent !== null && !e.closest('p'))
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
  await page.getByRole('button', { name: 'Practice', exact: true }).click()
  await page.getByRole('button', { name: /Exam simulation/ }).click()
  expect(await smallTargets(page), 'exam').toEqual([])
})
