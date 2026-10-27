import { test, expect } from '@playwright/test'

// Crawlers and AI assistants mostly don't run JavaScript: the static pages must carry the
// material as HTML text.
test.use({ javaScriptEnabled: false })

test('an AI Act article page is readable without JavaScript', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 })
  await page.goto('/ai-act/article-99/')
  await expect(page.getByRole('heading', { level: 1, name: /AI Act Article 99 \(Penalties\)/ })).toBeVisible()
  await expect(page.getByText(/top penalty bracket/).first()).toBeVisible()
  await expect(page.getByText(/^Answer: [A-D]$/).first()).toBeVisible()
  const link = page.getByRole('link', { name: /AI Act, Art 99/ }).first()
  await expect(link).toHaveAttribute('href', /eur-lex\.europa\.eu\/eli\/reg\/2024\/1689\/oj#art_99/)
  const ld = await page.locator('script[type="application/ld+json"]').first().textContent()
  expect(JSON.parse(ld!)['@type']).toBe('Quiz')
  await page.screenshot({ path: 'e2e/shots/seo-article-phone.png', fullPage: false })
})

test('the guide answers the common questions with FAQ structured data', async ({ page }) => {
  await page.goto('/guide/ad-430-26-field-1/')
  await expect(page.getByRole('heading', { level: 1 })).toContainText('AD/430/26')
  await expect(page.getByRole('cell', { name: '30 questions, 40 min' })).toBeVisible()
  const types = await page.locator('script[type="application/ld+json"]').allTextContents()
  expect(types.map((t) => JSON.parse(t)['@type'])).toContain('FAQPage')
  await page.screenshot({ path: 'e2e/shots/seo-guide-desktop.png', fullPage: false })
})

test('sitemap and llms.txt list the static pages; home carries WebApplication JSON-LD', async ({ request, page }) => {
  const sitemap = await (await request.get('/sitemap.xml')).text()
  expect(sitemap).toContain('/ai-act/article-99/')
  expect(sitemap).toContain('/guide/ad-430-26-field-1/')
  const llms = await (await request.get('/llms.txt')).text()
  expect(llms).toMatch(/verified/)
  await page.goto('/')
  const ld = await page.locator('script[type="application/ld+json"]').allTextContents()
  expect(ld.some((t) => JSON.parse(t)['@type'] === 'WebApplication')).toBe(true)
  await expect(page.getByRole('link', { name: /The AI Act, article by article/ })).toBeVisible()
})
