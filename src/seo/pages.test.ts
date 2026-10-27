import { describe, it, expect } from 'vitest'
import { ALL_QUESTIONS, META } from '@/domain/questions'
import { SOURCES } from '@/domain/citations'
import { buildSite, renderPage, sitemapXml, llmsTxt, articleOf, type SiteInput } from './pages'

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
    expect(articleOf({ doc: 'ai-act', ref: 'Art 99(3)', quote: '' })).toBe(99)
    expect(articleOf({ doc: 'ai-omnibus', ref: 'Art 1(5) (replacing AI Act Art 4)', quote: '' })).toBe(4)
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
