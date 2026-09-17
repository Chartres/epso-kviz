import { test, expect } from '@playwright/test'

// Phone viewport on Chromium (iPhone-13-sized) — avoids needing the WebKit build.
test.use({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true })

test('mobile UX walkthrough with screenshots', async ({ page }) => {
  await page.goto('/')
  await page.screenshot({ path: 'e2e/shots/m-menu.png', fullPage: true })

  // Practise a category to stress the layout.
  await page.getByRole('button', { name: 'Practice', exact: true }).click()
  await page.screenshot({ path: 'e2e/shots/m-practice.png', fullPage: true })
  await page.getByRole('button', { name: /AI Act & Governance/ }).click()
  await page.getByRole('button', { name: 'Start practicing' }).click()
  await expect(page.getByText(/01 \//)).toBeVisible()
  await page.screenshot({ path: 'e2e/shots/m-question.png', fullPage: true })

  // Answer the first option (locks + reveals verdict).
  await page.locator('button[data-state="idle"]').first().click()

  // The sticky action bar (verdict + Next) must be on screen WITHOUT scrolling,
  // even on a long question. Scroll back to the top first to prove it.
  await page.evaluate(() => window.scrollTo(0, 0))
  const nextBtn = page.getByRole('button', { name: /Next|Finish/ })
  await expect(nextBtn).toBeInViewport()
  await page.screenshot({ path: 'e2e/shots/m-answered-top.png' })

  // Full page too, to inspect the reflow of the correct-answer label.
  await page.screenshot({ path: 'e2e/shots/m-answered-full.png', fullPage: true })

  await nextBtn.click()
  await expect(page.getByText(/02 \//)).toBeVisible()
})
