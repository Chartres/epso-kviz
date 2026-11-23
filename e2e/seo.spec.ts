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

// Persona: a candidate searching "GDPR EPSO AI practice questions" on a phone lands on the
// act page, reads the passage and a worked question, and finds the way into the trainer.
test('an EU act page beyond the AI Act is readable without JavaScript at 390 px', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 })
  await page.goto('/acts/')
  await page.getByRole('link', { name: 'GDPR', exact: true }).click()
  await expect(page.getByRole('heading', { level: 1, name: 'GDPR' })).toBeVisible()
  await expect(page.getByRole('heading', { name: 'The text' })).toBeVisible()
  await expect(page.getByText(/^Answer: [A-D]$/).first()).toBeVisible()
  await expect(page.getByRole('link', { name: /Practise with spaced repetition/ })).toBeVisible()
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBe(390)
  await page.screenshot({ path: 'e2e/shots/seo-act-phone.png', fullPage: false })
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
  expect(sitemap).toContain('/acts/gdpr/')
  const llms = await (await request.get('/llms.txt')).text()
  expect(llms).toMatch(/verified/)
  await page.goto('/')
  const ld = await page.locator('script[type="application/ld+json"]').allTextContents()
  expect(ld.some((t) => JSON.parse(t)['@type'] === 'WebApplication')).toBe(true)
  await expect(page.getByRole('link', { name: /The AI Act, article by article/ })).toBeVisible()
})

// discoverability.md: the files crawlers fetch answer with their real content type, and the
// head carries the link card (absolute og:image, summary_large_image) on home and on a
// prerendered page.
test('robots, sitemap, llms.txt, security.txt and the OG card are served as the kit says', async ({ request, page }) => {
  const robots = await request.get('/robots.txt')
  expect(robots.headers()['content-type']).toMatch(/^text\/plain/)
  const robotsText = await robots.text()
  expect(robotsText).toContain('Allow: /')
  expect(robotsText).toContain('Sitemap: https://epsokviz.dravec.org/sitemap.xml')
  const sitemap = await request.get('/sitemap.xml')
  expect(sitemap.headers()['content-type']).toMatch(/xml/)
  expect(await sitemap.text()).toContain('<loc>https://epsokviz.dravec.org/</loc>')
  const llms = await request.get('/llms.txt')
  expect(llms.headers()['content-type']).toMatch(/^text\/plain/)
  expect(await llms.text()).toMatch(/^# /)
  const security = await request.get('/.well-known/security.txt')
  expect(security.ok()).toBe(true)
  expect(await security.text()).toMatch(/^Contact: https:\/\/github\.com\/Chartres\/epso-kviz\/issues/m)
  const og = await request.get('/og.png')
  expect(og.headers()['content-type']).toBe('image/png')

  for (const path of ['/', '/guide/ad-430-26-field-1/']) {
    await page.goto(path)
    const meta = (sel: string) => page.locator(`head meta[${sel}]`).getAttribute('content')
    expect(await meta('property="og:image"')).toMatch(/^https:\/\/epsokviz\.dravec\.org\/og\.png$/)
    expect(await meta('name="twitter:card"')).toBe('summary_large_image')
    expect(await meta('property="og:url"')).toBe(`https://epsokviz.dravec.org${path}`)
    expect(await page.locator('head link[rel="canonical"]').getAttribute('href')).toBe(`https://epsokviz.dravec.org${path}`)
  }
  await page.goto('/')
  expect((await page.locator('head meta[property="og:title"]').getAttribute('content'))!.length).toBeLessThanOrEqual(45)
  const ld = await page.locator('script[type="application/ld+json"]').allTextContents()
  expect(ld.some((t) => JSON.parse(t)['@type'] === 'WebApplication')).toBe(true)
})
