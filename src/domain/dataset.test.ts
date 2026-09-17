import { describe, it, expect } from 'vitest'
import { ALL_QUESTIONS, META } from './questions'

// Dataset invariants that protect against regressions in data/bank/*.json + scripts/merge.mjs.
describe('dataset invariants', () => {
  it('has unique ids spanning the three category ranges', () => {
    const ids = ALL_QUESTIONS.map((q) => q.id).sort((a, b) => a - b)
    expect(new Set(ids).size).toBe(ids.length)
    expect(ids.length).toBe(180)
  })

  it('has no duplicate pairs (none declared for this dataset)', () => {
    expect(META.duplicatePairs).toEqual([])
  })

  it('every question has four non-empty options and a rationale', () => {
    for (const q of ALL_QUESTIONS) {
      expect(q.a.length).toBeGreaterThan(0)
      expect(q.b.length).toBeGreaterThan(0)
      expect(q.c.length).toBeGreaterThan(0)
      expect(q.d.length).toBeGreaterThan(0)
      expect(q.explain.length).toBeGreaterThan(0)
    }
  })
})
