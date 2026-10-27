import { describe, it, expect } from 'vitest'
import { emptyProgress, recordAnswer, statFor, type ProgressData } from './progress'
import { byCategory, CATEGORY_NAMES } from './questions'
import {
  firstAttempt,
  betaBinomialPmf,
  convolve,
  readiness,
  MIN_FIRST_ATTEMPTS,
} from './readiness'

const sum = (xs: number[]) => xs.reduce((a, b) => a + b, 0)

/** Answer the first `n` questions of each category once, `rightOf(i)` deciding correctness. */
function practise(n: number, rightOf: (i: number) => boolean): ProgressData {
  let p = emptyProgress()
  for (const cat of CATEGORY_NAMES) {
    byCategory(cat)
      .slice(0, n)
      .forEach((q, i) => (p = recordAnswer(p, q.id, rightOf(i), i + 1)))
  }
  return p
}

describe('firstAttempt', () => {
  it('is recorded on the first answer and kept after later ones', () => {
    let p = recordAnswer(emptyProgress(), 1, false, 1)
    p = recordAnswer(p, 1, true, 2)
    p = recordAnswer(p, 1, true, 3)
    expect(statFor(p, 1).first).toBe(false)
    expect(firstAttempt(statFor(p, 1))).toBe(false)
  })

  it('is inferred for progress saved before the field existed when it is unambiguous', () => {
    const base = { streak: 0, lastSeen: 1, lastCorrect: true }
    expect(firstAttempt({ ...base, seen: 1, correct: 1 })).toBe(true)
    expect(firstAttempt({ ...base, seen: 3, correct: 3 })).toBe(true)
    expect(firstAttempt({ ...base, seen: 3, correct: 0, lastCorrect: false })).toBe(false)
    expect(firstAttempt({ ...base, seen: 3, correct: 2 })).toBeNull()
    expect(firstAttempt({ ...base, seen: 0, correct: 0 })).toBeNull()
  })
})

describe('score distribution maths', () => {
  it('beta-binomial with a flat prior is uniform over 0..n', () => {
    const pmf = betaBinomialPmf(10, 1, 1)
    expect(pmf).toHaveLength(11)
    for (const x of pmf) expect(x).toBeCloseTo(1 / 11, 10)
  })

  it('beta-binomial is a distribution and its mean is n·a/(a+b)', () => {
    const pmf = betaBinomialPmf(10, 7, 3)
    expect(sum(pmf)).toBeCloseTo(1, 10)
    expect(sum(pmf.map((x, k) => x * k))).toBeCloseTo(7, 10)
  })

  it('convolution adds independent scores', () => {
    expect(convolve([0.5, 0.5], [0.5, 0.5])).toEqual([0.25, 0.5, 0.25])
  })
})

describe('readiness', () => {
  it('needs enough first attempts in every category before it estimates anything', () => {
    const r = readiness(emptyProgress())
    expect(r.enough).toBe(false)
    for (const cat of CATEGORY_NAMES) expect(r.missing[cat]).toBe(MIN_FIRST_ATTEMPTS)
  })

  it('a strong first-try record predicts a high score on a fresh paper', () => {
    const r = readiness(practise(20, () => true))
    expect(r.enough).toBe(true)
    expect(r.total).toBe(30)
    expect(r.expected).toBeGreaterThan(27)
    expect(r.high).toBe(30)
    expect(r.atLeast(15)).toBeGreaterThan(0.99)
  })

  it('a coin-flip record centres on 15 with a range on both sides of it', () => {
    const r = readiness(practise(20, (i) => i % 2 === 0))
    expect(r.expected).toBeCloseTo(15, 0)
    expect(r.low).toBeLessThan(15)
    expect(r.high).toBeGreaterThan(15)
    expect(r.low).toBeLessThanOrEqual(r.high)
  })

  it('repeat answers do not inflate the estimate: only first attempts count', () => {
    let p = practise(20, () => false)
    for (const cat of CATEGORY_NAMES)
      for (const q of byCategory(cat).slice(0, 20)) {
        p = recordAnswer(p, q.id, true, 100)
        p = recordAnswer(p, q.id, true, 101)
      }
    expect(readiness(p).expected).toBeLessThan(3)
  })

  it('reports per-category first-try evidence', () => {
    const r = readiness(practise(10, (i) => i < 7))
    for (const cat of CATEGORY_NAMES) expect(r.byCategory[cat]).toEqual({ n: 10, correct: 7 })
  })
})
