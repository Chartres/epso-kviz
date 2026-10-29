import { describe, it, expect } from 'vitest'
import { makeRng } from '../rng'
import { LANGS } from './numerical'
import { ANSWERS, ATTRIBUTION, ITEMS, PASSAGES, VERBAL, buildVerbalTest, passageOf, scoreVerbal } from './verbal'

describe('verbal reasoning: format from the notice', () => {
  it('is 20 questions in 35 minutes, pass 10/20', () => {
    expect(VERBAL.questions).toBe(20)
    expect(VERBAL.minutes).toBe(35)
    expect(VERBAL.pass).toBe(10)
  })
})

describe('passages', () => {
  it('are at least 12, each from EUR-Lex with a CELEX number, in Czech, Slovak and English', () => {
    expect(PASSAGES.length).toBeGreaterThanOrEqual(12)
    expect(new Set(PASSAGES.map((p) => p.id)).size).toBe(PASSAGES.length)
    for (const p of PASSAGES) {
      expect(p.celex, p.id).toMatch(/^3\d{4}[RLD]\d{4}$/)
      expect(p.id.startsWith(p.celex)).toBe(true)
      expect(p.url).toMatch(/^https:\/\/eur-lex\.europa\.eu\/eli\//)
      for (const l of LANGS) {
        expect(p.act[l].length, `${p.id} ${l}`).toBeGreaterThan(10)
        expect(p.text[l].split(/\s+/).length, `${p.id} ${l}`).toBeGreaterThan(80)
      }
    }
  })

  it('carry the EUR-Lex reuse attribution (Commission Decision 2011/833/EU)', () => {
    expect(ATTRIBUTION).toMatch(/European Union/)
    expect(ATTRIBUTION).toMatch(/2011\/833\/EU/)
  })
})

describe('items', () => {
  it('number at least 60, each pointing at a passage that exists', () => {
    expect(ITEMS.length).toBeGreaterThanOrEqual(60)
    expect(new Set(ITEMS.map((i) => i.id)).size).toBe(ITEMS.length)
    const ids = new Set(PASSAGES.map((p) => p.id))
    for (const it of ITEMS) expect(ids.has(it.passage), `${it.id} -> ${it.passage}`).toBe(true)
  })

  it('have a valid key and a statement and explanation in every language', () => {
    for (const it of ITEMS) {
      expect(ANSWERS).toContain(it.answer)
      for (const l of LANGS) {
        expect(it.statement[l].length, `${it.id} ${l}`).toBeGreaterThan(15)
        expect(it.why[l].length, `${it.id} ${l}`).toBeGreaterThan(10)
      }
    }
  })

  it('give every passage enough statements for a sitting, and every key a fair share', () => {
    for (const p of PASSAGES)
      expect(ITEMS.filter((i) => i.passage === p.id).length, p.id).toBeGreaterThanOrEqual(VERBAL.perPassage)
    for (const a of ANSWERS) expect(ITEMS.filter((i) => i.answer === a).length / ITEMS.length, a).toBeGreaterThan(0.25)
  })

  // An explanation that quotes the passage must quote it exactly, in that language.
  it('quote their passage verbatim in each explanation', () => {
    const norm = (s: string) => s.toLowerCase().replace(/\s+/g, ' ')
    for (const it of ITEMS)
      for (const l of LANGS) {
        const text = norm(passageOf(it).text[l])
        const quotes = [...it.why[l].matchAll(l === 'en' ? /"([^"]+)"/g : /„([^“]+)“/g)].map((m) => m[1])
        for (const q of quotes)
          for (const frag of q.split('…').map((f) => norm(f.trim().replace(/[.,]$/, ''))).filter((f) => f.length > 3))
            expect(text.includes(frag), `${it.id} ${l}: "${frag}"`).toBe(true)
      }
  })
})

describe('a sitting', () => {
  it('has 20 distinct items, with statements on the same passage kept together', () => {
    for (let seed = 1; seed <= 50; seed++) {
      const test = buildVerbalTest(makeRng(seed))
      expect(test).toHaveLength(VERBAL.questions)
      expect(new Set(test.map((i) => i.id)).size).toBe(VERBAL.questions)
      const seen: string[] = []
      for (const it of test) {
        if (seen.at(-1) !== it.passage) {
          expect(seen, `seed ${seed}`).not.toContain(it.passage)
          seen.push(it.passage)
        }
      }
    }
  })

  it('is deterministic for a seed and varies across seeds', () => {
    expect(buildVerbalTest(makeRng(7))).toEqual(buildVerbalTest(makeRng(7)))
    expect(buildVerbalTest(makeRng(7))).not.toEqual(buildVerbalTest(makeRng(8)))
  })

  it('scores one point per matching key, none for a blank', () => {
    const test = buildVerbalTest(makeRng(3))
    expect(scoreVerbal(test, test.map((i) => i.answer))).toBe(20)
    expect(scoreVerbal(test, [])).toBe(0)
  })
})
