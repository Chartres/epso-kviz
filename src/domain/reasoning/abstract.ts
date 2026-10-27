import { sample, shuffle, type Rng } from '../rng'

/**
 * Abstract reasoning practice: which figure comes next? Format per the Notice of Competition
 * EPSO/AD/430/26, Table 3: 10 questions in 10 minutes, combined with numerical for a pass of
 * 10/20. Language-free by construction. Each series is generated from two or three rules
 * acting on independent attributes; every wrong option breaks exactly one of them, so the
 * worked solution can name the rule it breaks.
 */

export const ABSTRACT = { questions: 10, minutes: 10 } as const

export type Attr = 'rotation' | 'count' | 'fill' | 'position'
export type Fill = 'solid' | 'outline' | 'hatched'
const FILLS: Fill[] = ['solid', 'outline', 'hatched']

export interface Frame {
  /** Degrees, multiple of 45. */
  rotation: number
  /** Dots under the shape, 1..6. */
  count: number
  fill: Fill
  /** Marker on the border, 0..7 clockwise from the top-left corner. */
  position: number
}

export interface Rule {
  attr: Attr
  /** Change per step: degrees for rotation, dots for count, places for fill and position. */
  step: number
}

export interface Series {
  rules: Rule[]
  start: Frame
  /** The five figures shown. */
  frames: Frame[]
  options: Frame[]
  correct: number
  /** For each wrong option, the rule it breaks. */
  broken: (Attr | undefined)[]
}

const mod = (n: number, m: number) => ((n % m) + m) % m

function apply(f: Frame, r: Rule, k: number): Frame {
  switch (r.attr) {
    case 'rotation':
      return { ...f, rotation: mod(f.rotation + r.step * k, 360) }
    case 'count':
      return { ...f, count: mod(f.count - 1 + r.step * k, 6) + 1 }
    case 'fill':
      return { ...f, fill: FILLS[mod(FILLS.indexOf(f.fill) + r.step * k, 3)] }
    case 'position':
      return { ...f, position: mod(f.position + r.step * k, 8) }
  }
}

/** The k-th figure (0-based) of a series. */
export function frameAt(rules: Rule[], start: Frame, k: number): Frame {
  return rules.reduce((f, r) => apply(f, r, k), start)
}

export function sameFrame(a: Frame, b: Frame): boolean {
  return a.rotation === b.rotation && a.count === b.count && a.fill === b.fill && a.position === b.position
}

const int = (rng: Rng, lo: number, hi: number) => lo + Math.floor(rng() * (hi - lo + 1))

const STEPS: Record<Attr, number[]> = {
  rotation: [45, 90, -90, 135],
  count: [1, 2, -1],
  fill: [1, 2],
  position: [1, 2, 3, -1],
}

/** A wrong value for one attribute: what a plausible slip on that rule would give. */
function slip(f: Frame, r: Rule, tries: number): Frame {
  // Off by one step forwards/backwards, or the rule's step reversed, cycling as tries grow.
  const k = [1, -1, 2, -2, 3][tries % 5]
  return apply(f, { attr: r.attr, step: r.step }, k)
}

export function generateSeries(rng: Rng): Series {
  for (;;) {
    const attrs = sample(['rotation', 'count', 'fill', 'position'] as Attr[], int(rng, 2, 3), rng)
    const rules: Rule[] = attrs.map((attr) => ({ attr, step: STEPS[attr][int(rng, 0, STEPS[attr].length - 1)] }))
    const start: Frame = {
      rotation: 45 * int(rng, 0, 7),
      count: int(rng, 1, 3),
      fill: FILLS[int(rng, 0, 2)],
      position: int(rng, 0, 7),
    }
    const frames = [0, 1, 2, 3, 4].map((k) => frameAt(rules, start, k))
    // Every rule must visibly change something across the five frames.
    if (rules.some((r) => new Set(frames.map((f) => f[r.attr])).size < 2)) continue
    const answer = frameAt(rules, start, 5)

    const wrong: { frame: Frame; attr: Attr }[] = []
    for (let i = 0, tries = 0; wrong.length < 3 && tries < 40; tries++, i++) {
      const r = rules[i % rules.length]
      const f = { ...answer, [r.attr]: slip(answer, r, tries)[r.attr] } as Frame
      if (sameFrame(f, answer) || wrong.some((w) => sameFrame(w.frame, f))) continue
      wrong.push({ frame: f, attr: r.attr })
    }
    if (wrong.length < 3) continue

    const order = shuffle([0, 1, 2, 3], rng)
    const all = [{ frame: answer, attr: undefined as Attr | undefined }, ...wrong]
    return {
      rules,
      start,
      frames,
      options: order.map((i) => all[i].frame),
      correct: order.indexOf(0),
      broken: order.map((i) => all[i].attr),
    }
  }
}

export function buildAbstractTest(rng: Rng): Series[] {
  return Array.from({ length: ABSTRACT.questions }, () => generateSeries(rng))
}

export function scoreAbstract(series: Series[], answers: (number | undefined)[]): number {
  return series.reduce((s, x, i) => s + (answers[i] === x.correct ? 1 : 0), 0)
}

// Marker positions on the border, clockwise from the top-left corner (viewBox 0..100).
const MARKS: [number, number][] = [
  [10, 10], [50, 10], [90, 10], [90, 50], [90, 90], [50, 90], [10, 90], [10, 50],
]

/** One figure as an inline SVG string (currentColor, so it follows the theme). */
export function frameSvg(f: Frame, label: string, id = 'f'): string {
  const pat = `hatch-${id}`
  const fill = f.fill === 'solid' ? 'currentColor' : f.fill === 'hatched' ? `url(#${pat})` : 'none'
  const dots = Array.from({ length: f.count }, (_, i) => {
    const x = 50 - ((f.count - 1) * 8) / 2 + i * 8
    return `<circle cx="${x}" cy="74" r="2.6" fill="currentColor"/>`
  }).join('')
  const [mx, my] = MARKS[f.position]
  return (
    `<svg viewBox="0 0 100 100" width="100%" height="100%" role="img" aria-label="${label}" xmlns="http://www.w3.org/2000/svg">` +
    `<defs><pattern id="${pat}" width="6" height="6" patternUnits="userSpaceOnUse" patternTransform="rotate(45)"><line x1="0" y1="0" x2="0" y2="6" stroke="currentColor" stroke-width="2"/></pattern></defs>` +
    `<rect x="4" y="4" width="92" height="92" fill="none" stroke="currentColor" stroke-opacity="0.35" stroke-width="1.5"/>` +
    // An arrow (an asymmetric shape, so every 45° rotation is distinguishable) pointing up at 0°.
    `<g transform="rotate(${f.rotation} 50 42)"><polygon points="50,22 64,40 56,40 56,60 44,60 44,40 36,40" fill="${fill}" stroke="currentColor" stroke-width="2.5" stroke-linejoin="round"/></g>` +
    dots +
    `<rect x="${mx - 4}" y="${my - 4}" width="8" height="8" fill="currentColor"/>` +
    `</svg>`
  )
}
