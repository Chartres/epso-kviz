import { describe, it, expect } from 'vitest'
import { ALL_QUESTIONS, META } from '@/domain/questions'
import { SOURCES } from '@/domain/citations'
import { NAVIGATE_FALLBACK_DENYLIST } from './routes'
import { buildSite, renderPage, sitemapXml, llmsTxt, articleOf, esc, type SiteInput } from './pages'

const input: SiteInput = {
  questions: ALL_QUESTIONS,
  sources: SOURCES,
  meta: META,
  base: 'https://epsokviz.dravec.org',
  date: '2026-10-27',
}
const site = buildSite(input)
const page = (path: string) => site.find((p) => p.path === path)

describe('articleOf', () => {
  it('maps AI Act refs, and Omnibus refs to the AI Act article they amend', () => {
    expect(articleOf({ doc: 'ai-act', ref: 'Art 99(3)', quote: '' })).toBe('99')
    expect(articleOf({ doc: 'ai-omnibus', ref: 'Art 1(5) (replacing AI Act Art 4)', quote: '' })).toBe('4')
    expect(articleOf({ doc: 'ai-omnibus', ref: 'Art 1(6) (inserting AI Act Art 4a(1)(a))', quote: '' })).toBe('4a')
    expect(articleOf({ doc: 'ai-act', ref: 'Recital 12', quote: '' })).toBeNull()
    expect(articleOf({ doc: 'gdpr', ref: 'Art 35(3)', quote: '' })).toBeNull()
  })
})

describe('prerendered site', () => {
  it('has an AI Act article page per article that a verified question cites', () => {
    const art99 = page('/ai-act/article-99/')!
    expect(art99).toBeDefined()
    expect(art99.title).toMatch(/AI Act Article 99/)
    const q1041 = ALL_QUESTIONS.find((q) => q.id === 1041)!
    expect(art99.body).toContain(q1041.q)
    expect(art99.body).toContain(`Answer: ${q1041.correct.toUpperCase()}`)
    expect(art99.body).toContain('https://eur-lex.europa.eu/eli/reg/2024/1689/oj#art_99')
    expect(page('/ai-act/')!.body).toContain('/ai-act/article-99/')
  })

  it('gives an inserted article (4a) its own page instead of filing it under Article 4', () => {
    const cites4a = ALL_QUESTIONS.filter((q) => q.verified && q.sources?.some((c) => /AI Act Art 4a/.test(c.ref)))
    if (cites4a.length) {
      expect(page('/ai-act/article-4a/')).toBeDefined()
      for (const q of cites4a.filter((q) => !q.sources!.some((c) => articleOf(c) === '4')))
        expect(page('/ai-act/article-4/')?.body ?? '').not.toContain(q.q)
    }
  })

  it('has a page per other EU act that at least two verified questions cite, and an index', () => {
    const count = (doc: string) =>
      ALL_QUESTIONS.filter((q) => q.verified && q.sources?.some((c) => c.doc === doc)).length
    const gdpr = page('/acts/gdpr/')!
    expect(gdpr).toBeDefined()
    expect(gdpr.title).toContain(SOURCES.gdpr.short)
    const q = ALL_QUESTIONS.find((x) => x.verified && x.sources?.some((c) => c.doc === 'gdpr'))!
    expect(gdpr.body).toContain(esc(q.q))
    expect(gdpr.body).toContain(SOURCES.gdpr.url)
    expect(gdpr.jsonLd[0]['@type']).toBe('Quiz')
    // the AI Act and the Omnibus have their article pages; a one-question act gets no thin page
    expect(page('/acts/ai-act/')).toBeUndefined()
    expect(page('/acts/ai-omnibus/')).toBeUndefined()
    for (const doc of Object.keys(SOURCES)) {
      if (doc === 'ai-act' || doc === 'ai-omnibus') continue
      expect(Boolean(page(`/acts/${doc}/`)), doc).toBe(count(doc) >= 2)
    }
    const index = page('/acts/')!
    expect(index.body).toContain('/acts/gdpr/')
    expect(page('/guide/ad-430-26-field-1/')!.body).toContain('/acts/')
  })

  it('shows only the passages from the act itself on its page, and only verified questions', () => {
    const dsa = page('/acts/dsa/')!
    const text = dsa.body.split('<h2>The text</h2>')[1].split('<h2>Practice questions</h2>')[0]
    const docs = [...text.matchAll(/data-doc="([^"]+)"/g)].map((m) => m[1])
    expect(docs.length).toBeGreaterThan(0)
    expect(new Set(docs)).toEqual(new Set(['dsa']))
    for (const q of ALL_QUESTIONS.filter((x) => !x.verified)) expect(dsa.body).not.toContain(esc(q.q))
  })

  it('keeps every prerendered page out of the service worker\'s app-shell fallback', () => {
    for (const p of site) expect(NAVIGATE_FALLBACK_DENYLIST.some((r) => r.test(p.path)), p.path).toBe(true)
    expect(NAVIGATE_FALLBACK_DENYLIST.some((r) => r.test('/'))).toBe(false)
  })

  it('keeps descriptions short enough for a search result', () => {
    for (const p of site.filter((x) => x.path.startsWith('/acts/'))) expect(p.description.length, p.path).toBeLessThanOrEqual(200)
  })

  it('puts verified engineering questions first and tops the page up with a labelled sample', () => {
    const eng = page('/questions/engineering/')!
    const v = ALL_QUESTIONS.filter((q) => q.cat === 'AI Engineering & Operations' && q.verified)
    expect(v.length).toBeGreaterThan(0)
    expect(eng.body).toContain(`the ${v.length} that a public text does settle are verified and come first`)
    expect(eng.body.match(/class="q"/g)).toHaveLength(20)
    const first = eng.body.indexOf(esc(v[0].q))
    const firstUnverified = eng.body.indexOf(esc(ALL_QUESTIONS.find((q) => q.cat === 'AI Engineering & Operations' && !q.verified)!.q))
    expect(first).toBeGreaterThan(-1)
    expect(first).toBeLessThan(firstUnverified)
    expect(llmsTxt(site, input)).toContain(`${v.length} of the 80 AI-engineering questions are cited`)
  })

  it('says plainly that most engineering questions are practice judgments (Pavol, 2026-11-04: A)', () => {
    const eng = page('/questions/engineering/')!
    expect(eng.body).toContain('practice judgments')
    expect(eng.body).toMatch(/no public text decides/i)
    expect(eng.body).not.toContain('not yet cited')
    expect(llmsTxt(site, input)).toMatch(/practice judgments/)
    expect(page('/questions/governance/')!.body).not.toContain('practice judgments')
  })

  it('states the paper composition from meta, not a hard-coded number', () => {
    const per = META.exam.composition[0].count
    expect(page('/questions/governance/')!.body).toContain(`${META.exam.totalQuestions}-question paper draws ${per} from each`)
  })

  it('dates each page by its newest verification, not by the build', () => {
    const xml = sitemapXml(site, { ...input, date: '2099-01-01' })
    const newest = ALL_QUESTIONS.map((q) => q.verified ?? '').sort().pop()!
    expect(xml).toContain(`<lastmod>${newest}</lastmod>`)
    expect(xml).not.toMatch(/ai-act\/article-99\/<\/loc><lastmod>2099/)
  })

  it('puts only verified questions on the AI Act pages', () => {
    const unverified = ALL_QUESTIONS.filter((q) => q.cat === 'AI Act & Governance' && !q.verified)
    const aiPages = site.filter((p) => p.path.startsWith('/ai-act/article-'))
    for (const q of unverified) for (const p of aiPages) expect(p.body).not.toContain(q.q)
  })

  it('has a guide to the test with the notice numbers and FAQPage JSON-LD', () => {
    const guide = page('/guide/ad-430-26-field-1/')!
    expect(guide.body).toContain(`${META.exam.totalQuestions} questions`)
    expect(guide.body).toContain(`${META.exam.timeLimitMinutes} minutes`)
    const ld = guide.jsonLd.find((x) => x['@type'] === 'FAQPage') as { mainEntity: unknown[] }
    expect(ld.mainEntity.length).toBeGreaterThanOrEqual(5)
  })

  it('has a question page per category with Quiz JSON-LD', () => {
    for (const c of META.categories) {
      const p = page(`/questions/${c.id}/`)!
      expect(p).toBeDefined()
      expect(p.jsonLd.some((x) => x['@type'] === 'Quiz')).toBe(true)
    }
  })

  it('gives every page a unique path, a title, a description, and escaped text', () => {
    expect(new Set(site.map((p) => p.path)).size).toBe(site.length)
    for (const p of site) {
      expect(p.title.length).toBeGreaterThan(10)
      expect(p.description.length).toBeGreaterThan(40)
      expect(p.body).not.toMatch(/<script/i)
    }
    const html = renderPage(site[0], input)
    expect(html).toMatch(/^<!doctype html>/)
    expect(html).toContain(`<link rel="canonical" href="https://epsokviz.dravec.org${site[0].path}">`)
    expect(html).toContain('application/ld+json')
  })

  it('carries the analytics beacon only when the build has the Supabase config, and marks cited links for it', () => {
    const p = page('/ai-act/article-99/')!
    expect(renderPage(p, input)).not.toContain('<script>')
    const html = renderPage(p, { ...input, beacon: { url: 'https://abc.supabase.co', key: 'sb_publishable_x', app: 'epso-kviz' } })
    expect(html).toMatch(/<script>\(function\(\)\{.*page_view.*<\/script>\n<\/body>/s)
    expect(html).toContain('https://abc.supabase.co/rest/v1/events')
    expect(p.body).toMatch(/<a href="[^"]+" rel="noopener" data-doc="ai-act" data-ref="Art 99\(\d\)/)
  })

  it('lists every page in the sitemap, and llms.txt states the verified counts honestly', () => {
    const xml = sitemapXml(site, input)
    for (const p of site) expect(xml).toContain(`<loc>https://epsokviz.dravec.org${p.path}</loc>`)
    expect(xml).toContain('<loc>https://epsokviz.dravec.org/</loc>')
    const txt = llmsTxt(site, input)
    const verified = ALL_QUESTIONS.filter((q) => q.verified).length
    expect(txt).toContain(`${verified} of ${ALL_QUESTIONS.length}`)
    expect(txt).toMatch(/unofficial/i)
  })
})
