import { describe, it, expect } from 'vitest'
import { makeRng } from '../rng'
import {
  ABSTRACT,
  generateSeries,
  frameAt,
  sameFrame,
  buildAbstractTest,
  scoreAbstract,
  frameSvg,
} from './abstract'

describe('abstract reasoning: format from the notice', () => {
  it('is 10 questions in 10 minutes', () => {
    expect(ABSTRACT.questions).toBe(10)
    expect(ABSTRACT.minutes).toBe(10)
  })
})

describe('generated series', () => {
  it('are deterministic for a seed', () => {
    expect(generateSeries(makeRng(11))).toEqual(generateSeries(makeRng(11)))
  })

  it('show five frames that follow the rules, and key the sixth', () => {
    for (let seed = 1; seed <= 200; seed++) {
      const s = generateSeries(makeRng(seed))
      expect(s.frames).toHaveLength(5)
      s.frames.forEach((f, i) => expect(sameFrame(f, frameAt(s.rules, s.start, i))).toBe(true))
      expect(sameFrame(s.options[s.correct], frameAt(s.rules, s.start, 5))).toBe(true)
    }
  })

  it('use two or three rules at once, never a single trivial one', () => {
    for (let seed = 1; seed <= 200; seed++) {
      const n = generateSeries(makeRng(seed)).rules.length
      expect(n).toBeGreaterThanOrEqual(2)
      expect(n).toBeLessThanOrEqual(3)
    }
  })

  it('offer four options, all different, each wrong one breaking exactly one rule', () => {
    for (let seed = 1; seed <= 200; seed++) {
      const s = generateSeries(makeRng(seed))
      expect(s.options).toHaveLength(4)
      for (let i = 0; i < 4; i++)
        for (let j = i + 1; j < 4; j++) expect(sameFrame(s.options[i], s.options[j]), `seed ${seed}`).toBe(false)
      const answer = s.options[s.correct]
      s.options.forEach((o, i) => {
        if (i === s.correct) return
        const differs = (['rotation', 'count', 'fill', 'position'] as const).filter((a) => o[a] !== answer[a])
        expect(differs).toEqual([s.broken[i]])
        expect(s.rules.map((r) => r.attr)).toContain(s.broken[i])
      })
    }
  })

  it('render each frame as an accessible SVG', () => {
    const s = generateSeries(makeRng(4))
    const svg = frameSvg(s.frames[0], 'Figure 1')
    expect(svg).toMatch(/^<svg[^>]+role="img"[^>]+aria-label="Figure 1"/)
    expect(svg).toContain('</svg>')
  })
})

describe('an abstract test', () => {
  it('has 10 series and scores them', () => {
    const t = buildAbstractTest(makeRng(2))
    expect(t).toHaveLength(10)
    expect(scoreAbstract(t, t.map((s) => s.correct))).toBe(10)
    expect(scoreAbstract(t, t.map((s) => (s.correct + 1) % 4))).toBe(0)
  })
})
