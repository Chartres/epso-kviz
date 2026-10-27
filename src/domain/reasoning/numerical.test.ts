import { describe, it, expect } from 'vitest'
import { makeRng } from '../rng'
import {
  NUMERICAL,
  LANGS,
  TEMPLATES,
  generateItem,
  buildNumericalTest,
  scoreNumerical,
  type NumItem,
} from './numerical'

const cell = (item: NumItem, row: number, col: number) => item.table.rows[row].values[col]

describe('numerical reasoning: format from the notice', () => {
  it('is 10 questions in 20 minutes', () => {
    expect(NUMERICAL.questions).toBe(10)
    expect(NUMERICAL.minutes).toBe(20)
  })
})

describe('generated items', () => {
  it('are deterministic for a seed and language', () => {
    expect(generateItem('pct-change', makeRng(42), 'cs')).toEqual(generateItem('pct-change', makeRng(42), 'cs'))
  })

  it('every template, in every language, yields four distinct options with the answer among them', () => {
    for (const t of TEMPLATES)
      for (const lang of LANGS)
        for (let seed = 1; seed <= 40; seed++) {
          const item = generateItem(t, makeRng(seed), lang)
          expect(item.options).toHaveLength(4)
          expect(new Set(item.options).size, `${t} ${lang} ${seed}`).toBe(4)
          expect(item.correct).toBeGreaterThanOrEqual(0)
          expect(item.correct).toBeLessThan(4)
          expect(item.question.length).toBeGreaterThan(20)
          expect(item.solution.length).toBeGreaterThan(20)
          expect(item.table.caption.length).toBeGreaterThan(5)
        }
  })

  it('percentage change: the keyed option is (new − old) / old, recomputed independently', () => {
    for (let seed = 1; seed <= 25; seed++) {
      const item = generateItem('pct-change', makeRng(seed), 'en')
      const { row, from, to } = item.check as { row: number; from: number; to: number }
      const expected = ((cell(item, row, to) - cell(item, row, from)) / cell(item, row, from)) * 100
      expect(item.answerValue).toBeCloseTo(expected, 6)
    }
  })

  it('share of total: the keyed option is part / sum of the column', () => {
    for (let seed = 1; seed <= 25; seed++) {
      const item = generateItem('share', makeRng(seed), 'sk')
      const { row, col } = item.check as { row: number; col: number }
      const total = item.table.rows.reduce((s, r) => s + r.values[col], 0)
      expect(item.answerValue).toBeCloseTo((cell(item, row, col) / total) * 100, 6)
    }
  })

  it('per head: the keyed option is value / population, in the stated unit', () => {
    for (let seed = 1; seed <= 25; seed++) {
      const item = generateItem('per-capita', makeRng(seed), 'cs')
      const { row, value, people, factor } = item.check as { row: number; value: number; people: number; factor: number }
      expect(item.answerValue).toBeCloseTo((cell(item, row, value) * factor) / cell(item, row, people), 6)
    }
  })

  it('currency: the keyed option converts at the stated rate', () => {
    for (let seed = 1; seed <= 25; seed++) {
      const item = generateItem('currency', makeRng(seed), 'en')
      const { amount, rate } = item.check as { amount: number; rate: number }
      expect(item.answerValue).toBeCloseTo(amount / rate, 6)
    }
  })

  it('largest increase: the keyed row has the biggest absolute rise between the two years', () => {
    for (let seed = 1; seed <= 25; seed++) {
      const item = generateItem('largest-rise', makeRng(seed), 'en')
      const rises = item.table.rows.map((r) => r.values[1] - r.values[0])
      const best = rises.indexOf(Math.max(...rises))
      expect(item.options[item.correct]).toBe(item.table.rows[best].label)
      expect(rises.filter((r) => r === rises[best])).toHaveLength(1) // no ties
      // The solution names the small-base row as fastest in %: that must be true.
      const pcts = item.table.rows.map((r) => (r.values[1] - r.values[0]) / r.values[0])
      expect(pcts.indexOf(Math.max(...pcts))).toBe(item.check.smallBase)
      expect(pcts.filter((p) => p === pcts[item.check.smallBase])).toHaveLength(1)
    }
  })

  it('currency: the rounded-rate slip is always a different option (the rate is never whole)', () => {
    for (let seed = 1; seed <= 400; seed++) {
      const item = generateItem('currency', makeRng(seed), 'en')
      expect(item.check.rate).not.toBe(Math.round(item.check.rate))
    }
  })

  it('per head: the population column always shows one decimal, as the solution does', () => {
    const item = generateItem('per-capita', makeRng(9), 'cs')
    expect(item.table.digits).toEqual([1, 0])
  })

  it('same growth again: the keyed option applies the same % change once more', () => {
    for (let seed = 1; seed <= 25; seed++) {
      const item = generateItem('project', makeRng(seed), 'sk')
      const { row } = item.check as { row: number }
      const [a, b] = item.table.rows[row].values
      expect(item.answerValue).toBeCloseTo(b * (b / a), 6)
    }
  })

  it('Czech and Slovak strings are actually Czech and Slovak, with diacritics kept', () => {
    const cs = generateItem('pct-change', makeRng(3), 'cs')
    const sk = generateItem('pct-change', makeRng(3), 'sk')
    expect(cs.question).toMatch(/[ěščřžýáíéůú]/)
    expect(sk.question).toMatch(/[äľôŕĺ]/) // letters Czech doesn't have
    expect(cs.question).not.toBe(sk.question)
  })
})

describe('a numerical test', () => {
  it('has 10 items, mixes templates, and scores correctly', () => {
    const t = buildNumericalTest(makeRng(7), 'cs')
    expect(t).toHaveLength(10)
    expect(new Set(t.map((i) => i.template)).size).toBeGreaterThanOrEqual(TEMPLATES.length)
    const answers = t.map((i, k) => (k < 6 ? i.correct : (i.correct + 1) % 4))
    expect(scoreNumerical(t, answers)).toBe(6)
  })
})
