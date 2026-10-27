// Build step after `vite build`: write the static, crawlable pages (src/seo/pages.ts), the
// sitemap, llms.txt, and the home page's WebApplication JSON-LD into dist/.
// Runs on plain Node (type stripping), so it imports only relative .ts files.
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { buildSite, renderPage, sitemapXml, llmsTxt, type SiteInput } from '../src/seo/pages.ts'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const dist = join(root, 'dist')
const read = (p: string) => readFileSync(join(root, p), 'utf8')

const base = (process.env.SITE_URL || 'https://epsokviz.dravec.org').replace(/\/$/, '')
if ((process.env.VITE_BASE || '/') !== '/') {
  console.log('prerender: skipped (site not served from the domain root)')
  process.exit(0)
}

// "Article 99" followed by its title line in the pinned AI Act text.
const articleTitles: Record<number, string> = {}
const lines = read('data/sources/ai-act.txt').split('\n')
lines.forEach((l, i) => {
  const m = /^Article (\d+)$/.exec(l.trim())
  if (m && !articleTitles[Number(m[1])] && lines[i + 1]) articleTitles[Number(m[1])] = lines[i + 1].trim()
})

const input: SiteInput = {
  questions: JSON.parse(read('data/questions.json')),
  meta: JSON.parse(read('data/meta.json')),
  sources: JSON.parse(read('data/sources/registry.json')).docs,
  base,
  date: new Date().toISOString().slice(0, 10),
  articleTitles,
}

const pages = buildSite(input)
for (const p of pages) {
  const file = join(dist, p.path, 'index.html')
  mkdirSync(dirname(file), { recursive: true })
  writeFileSync(file, renderPage(p, input))
}
writeFileSync(join(dist, 'sitemap.xml'), sitemapXml(pages, input))
writeFileSync(join(dist, 'llms.txt'), llmsTxt(pages, input))

// Home page: WebApplication JSON-LD and plain links to the static pages for crawlers.
const app = {
  '@context': 'https://schema.org',
  '@type': 'WebApplication',
  name: 'EPSO AI Field Trainer',
  url: `${base}/`,
  applicationCategory: 'EducationalApplication',
  operatingSystem: 'Any (web, installable PWA)',
  inLanguage: 'en',
  isAccessibleForFree: true,
  offers: { '@type': 'Offer', price: '0', priceCurrency: 'EUR' },
  description:
    'Free practice trainer for the EPSO/AD/430/26 Field 1 (Artificial Intelligence) field-related MCQ, with answers checked against the official EU texts.',
}
const indexPath = join(dist, 'index.html')
const index = readFileSync(indexPath, 'utf8')
if (!index.includes('"WebApplication"')) {
  writeFileSync(
    indexPath,
    index.replace(
      '</head>',
      `<script type="application/ld+json">${JSON.stringify(app)}</script></head>`,
    ),
  )
}
console.log(`prerender: ${pages.length} pages, sitemap, llms.txt → dist/`)
