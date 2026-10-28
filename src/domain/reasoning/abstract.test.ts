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
  explainRule,
  explainBroken,
  MAX_DOTS,
} from './abstract'

describe('abstract reasoning: format from the notice', () => {
  it('is 10 questions in 10 minutes', () => {
    expect(ABSTRACT.questions).toBe(10)
    expect(ABSTRACT.minutes).toBe(10)
  })
})

const ATTRS = ['rotation', 'count', 'fill', 'position'] as const

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

  it('offer four different options, each wrong one breaking the rules it names', () => {
    for (let seed = 1; seed <= 200; seed++) {
      const s = generateSeries(makeRng(seed))
      expect(s.options).toHaveLength(4)
      for (let i = 0; i < 4; i++)
        for (let j = i + 1; j < 4; j++) expect(sameFrame(s.options[i], s.options[j]), `seed ${seed}`).toBe(false)
      const answer = s.options[s.correct]
      expect(s.broken[s.correct]).toEqual([])
      s.options.forEach((o, i) => {
        const differs = ATTRS.filter((a) => o[a] !== answer[a])
        expect(differs.sort()).toEqual([...s.broken[i]].sort())
        for (const a of s.broken[i]) expect(s.rules.map((r) => r.attr)).toContain(a)
      })
    }
  })

  it('give no shortcut from the options alone: the answer is never the most typical option', () => {
    for (let seed = 1; seed <= 2000; seed++) {
      const s = generateSeries(makeRng(seed))
      // "Pick the option that shares most values with the others" must not single out the key.
      const shared = s.options.map((o, i) =>
        s.options.reduce((n, p, j) => n + (i === j ? 0 : ATTRS.filter((a) => o[a] === p[a]).length), 0),
      )
      const best = Math.max(...shared)
      expect(shared.filter((x) => x === best).length, `seed ${seed}`).toBeGreaterThan(1)
      // Nor does a per-attribute majority vote: every value shown appears in exactly two options.
      for (const a of ATTRS) {
        const vals = s.options.map((o) => o[a])
        for (const v of vals) expect([2, 4]).toContain(vals.filter((x) => x === v).length)
      }
    }
  })

  it('never wrap the dot count: it rises or falls steadily and stays countable', () => {
    for (let seed = 1; seed <= 200; seed++) {
      const s = generateSeries(makeRng(seed))
      const counts = [...s.frames, frameAt(s.rules, s.start, 5)].map((f) => f.count)
      const steps = new Set(counts.slice(1).map((c, i) => c - counts[i]))
      expect(steps.size, `seed ${seed}`).toBe(1)
      for (const o of s.options) {
        expect(o.count).toBeGreaterThanOrEqual(1)
        expect(o.count).toBeLessThanOrEqual(MAX_DOTS)
      }
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

describe('worked solutions in cs / sk / en', () => {
  const rules = [
    { attr: 'rotation', step: -90 },
    { attr: 'count', step: 1 },
    { attr: 'fill', step: 2 },
    { attr: 'position', step: 2 },
  ] as const
  const start = { rotation: 0, count: 1, fill: 'solid', position: 0 } as const

  it('state each rule in plain words', () => {
    const en = rules.map((r) => explainRule(r, start, 'en'))
    expect(en).toEqual([
      'The arrow turns 90° anticlockwise at each step.',
      'One dot more at each step.',
      'The fill repeats: solid → hatched → empty.',
      'The square on the border moves 2 places clockwise at each step.',
    ])
  })

  it('translate them into Czech and Slovak, with diacritics and the right plural', () => {
    const cs = rules.map((r) => explainRule(r, start, 'cs'))
    const sk = rules.map((r) => explainRule(r, start, 'sk'))
    expect(cs[0]).toBe('Šipka se s každým krokem otočí o 90° proti směru hodinových ručiček.')
    expect(sk[0]).toBe('Šípka sa s každým krokom otočí o 90° proti smeru hodinových ručičiek.')
    expect(cs[3]).toContain('o 2 místa')
    expect(sk[3]).toContain('o 2 miesta')
    expect(explainRule({ attr: 'position', step: 1 }, start, 'cs')).toContain('o 1 místo po směru')
    expect(explainRule({ attr: 'count', step: -1 }, start, 'sk')).toBe('S každým krokom ubudne jedna bodka.')
    cs.forEach((c, i) => expect(c).not.toBe(sk[i]))
  })

  it('name the rule a wrong option breaks', () => {
    expect(explainBroken(['count'], 'en')).toBe('This option breaks the rule for the dots.')
    expect(explainBroken(['count', 'rotation'], 'en')).toBe('This option breaks the rules for the dots and the turn.')
    expect(explainBroken(['fill'], 'cs')).toBe('Tato možnost porušuje pravidlo pro výplň.')
    expect(explainBroken(['fill', 'count'], 'cs')).toBe('Tato možnost porušuje pravidla pro výplň a tečky.')
    expect(explainBroken(['position'], 'sk')).toBe('Táto možnosť porušuje pravidlo pre štvorček na okraji.')
    expect(explainBroken(['position', 'rotation'], 'sk')).toBe('Táto možnosť porušuje pravidlá pre štvorček na okraji a otáčanie.')
  })
})
