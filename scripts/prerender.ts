// Build step after `vite build`: write the static, crawlable pages (src/seo/pages.ts), the
// sitemap and llms.txt into dist/. (The home page's JSON-LD lives in index.html itself, so the
// service worker's precache revision always matches the file that ships.)
// Runs on plain Node (type stripping), so it imports only relative .ts files.
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { buildSite, renderPage, sitemapXml, llmsTxt, type SiteInput } from '../src/seo/pages.ts'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const dist = join(root, 'dist')
const read = (p: string) => readFileSync(join(root, p), 'utf8')

const base = (process.env.SITE_URL || 'https://epsokviz.dravec.org').replace(/\/$/, '')
const viteBase = process.env.VITE_BASE || '/'
if (viteBase !== '/') {
  // Subpath build (github.io): the pages' root links wouldn't resolve, so ship only a
  // one-URL sitemap so robots.txt's Sitemap line still answers.
  const home = `https://chartres.github.io${viteBase}`
  writeFileSync(
    join(dist, 'sitemap.xml'),
    `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n  <url><loc>${home}</loc></url>\n</urlset>\n`,
  )
  console.log('prerender: subpath build, pages skipped, one-URL sitemap written')
  process.exit(0)
}

// "Article 99" followed by its title line in the pinned AI Act text; inserted articles
// ("Article 4a") come from the Digital Omnibus, where the heading opens with a quote mark.
const articleTitles: Record<string, string> = {}
for (const file of ['data/sources/ai-act.txt', 'data/sources/ai-omnibus.txt']) {
  const lines = read(file).split('\n')
  lines.forEach((l, i) => {
    const m = /^[‘']?Article (\d+[a-z]?)$/.exec(l.trim())
    const key = m?.[1]
    if (!key || articleTitles[key] || !lines[i + 1]) return
    if (file.includes('omnibus') && !/[a-z]$/.test(key)) return // only new articles from the Omnibus
    articleTitles[key] = lines[i + 1].trim()
  })
}

const input: SiteInput = {
  questions: JSON.parse(read('data/questions.json')),
  meta: JSON.parse(read('data/meta.json')),
  sources: JSON.parse(read('data/sources/registry.json')).docs,
  base,
  date: new Date().toISOString().slice(0, 10),
  articleTitles,
  // Same env as the app bundle; absent locally and in e2e, so those pages carry no script.
  beacon:
    process.env.VITE_SUPABASE_URL && (process.env.VITE_SUPABASE_PUBLISHABLE_KEY || process.env.VITE_SUPABASE_ANON_KEY)
      ? {
          url: process.env.VITE_SUPABASE_URL.replace(/\/$/, ''),
          key: (process.env.VITE_SUPABASE_PUBLISHABLE_KEY || process.env.VITE_SUPABASE_ANON_KEY)!,
          app: 'epso-kviz',
        }
      : undefined,
}

const pages = buildSite(input)
for (const p of pages) {
  const file = join(dist, p.path, 'index.html')
  mkdirSync(dirname(file), { recursive: true })
  writeFileSync(file, renderPage(p, input))
}
writeFileSync(join(dist, 'sitemap.xml'), sitemapXml(pages, input))
writeFileSync(join(dist, 'llms.txt'), llmsTxt(pages, input))

console.log(`prerender: ${pages.length} pages${input.beacon ? ' (with analytics beacon)' : ''}, sitemap, llms.txt → dist/`)
