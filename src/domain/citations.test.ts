import { describe, it, expect } from 'vitest'
import { ALL_QUESTIONS, META } from './questions'
import {
  SOURCES,
  normalizeQuote,
  citationLabel,
  citationUrl,
  MIN_QUOTE_LENGTH,
} from './citations'
import type { CategoryName } from './types'

describe('citation helpers', () => {
  it('normalizes whitespace, quotes and dashes so line-wrapped text still matches', () => {
    expect(normalizeQuote('the  provider’s\n“duty” — here')).toBe('the provider\'s "duty" - here')
  })

  it('labels a citation with the document short name and reference', () => {
    expect(citationLabel({ doc: 'ai-act', ref: 'Art 99(3)', quote: '' })).toBe('AI Act, Art 99(3)')
  })

  it('links articles, recitals and annexes to their EUR-Lex anchors', () => {
    const base = 'https://eur-lex.europa.eu/eli/reg/2024/1689/oj'
    expect(citationUrl({ doc: 'ai-act', ref: 'Art 99(3)', quote: '' })).toBe(`${base}#art_99`)
    expect(citationUrl({ doc: 'ai-act', ref: 'Art 6(1)(a)', quote: '' })).toBe(`${base}#art_6`)
    expect(citationUrl({ doc: 'ai-act', ref: 'Recital 12', quote: '' })).toBe(`${base}#rct_12`)
    expect(citationUrl({ doc: 'ai-act', ref: 'Annex III', quote: '' })).toBe(`${base}#anx_III`)
    expect(citationUrl({ doc: 'apply-ai', ref: 'Section 2', quote: '' })).toBe(SOURCES['apply-ai'].url)
  })
})

// The verified bank: every citation must quote its source verbatim (after whitespace and
// typography normalization), checked against the pinned snapshot in data/sources/.
const raw = import.meta.glob<string>('../../data/sources/*.txt', {
  query: '?raw',
  import: 'default',
  eager: true,
})
const snapshots = new Map<string, string>()
function snapshot(doc: string): string {
  if (!snapshots.has(doc)) snapshots.set(doc, normalizeQuote(raw[`../../data/sources/${doc}.txt`] ?? ''))
  return snapshots.get(doc)!
}

const cited = ALL_QUESTIONS.filter((q) => q.sources?.length)

describe('verified bank', () => {
  it('every registered source has a pinned snapshot', () => {
    for (const doc of Object.keys(SOURCES)) expect(snapshot(doc).length, doc).toBeGreaterThan(1000)
  })

  it('every citation names a registered source, a reference, and a long-enough quote', () => {
    for (const q of cited) {
      for (const c of q.sources!) {
        expect(SOURCES[c.doc], `q${q.id}: unknown source ${c.doc}`).toBeDefined()
        expect(c.ref.trim(), `q${q.id}: empty ref`).not.toBe('')
        expect(c.quote.length, `q${q.id}: quote too short`).toBeGreaterThanOrEqual(MIN_QUOTE_LENGTH)
      }
    }
  })

  it('every quote appears verbatim in the pinned source text', () => {
    const misses: string[] = []
    for (const q of cited) {
      for (const c of q.sources!) {
        if (!snapshot(c.doc).includes(normalizeQuote(c.quote)))
          misses.push(`q${q.id} ${c.doc} ${c.ref}: "${c.quote.slice(0, 60)}…"`)
      }
    }
    expect(misses).toEqual([])
  })

  it('a question is marked verified only when it carries citations', () => {
    for (const q of ALL_QUESTIONS) {
      if (q.verified) expect(q.sources?.length, `q${q.id}`).toBeGreaterThan(0)
      if (q.verified) expect(q.verified).toMatch(/^\d{4}-\d{2}-\d{2}$/)
    }
  })

  // Ratchet: coverage may only go up. Raise these when more of the bank is verified.
  const FLOOR: Record<CategoryName, number> = {
    'AI Act & Governance': 72,
    'EU Digital Policy & Strategy': 67,
    'AI Engineering & Operations': 0,
  }
  // Needs the full bank; skipped on the public sample (a clone without the private bank).
  it.skipIf(META.sample)('verified coverage stays at or above the floor per category', () => {
    for (const [cat, floor] of Object.entries(FLOOR)) {
      const n = ALL_QUESTIONS.filter((q) => q.cat === cat && q.verified).length
      expect(n, cat).toBeGreaterThanOrEqual(floor)
    }
  })
})
