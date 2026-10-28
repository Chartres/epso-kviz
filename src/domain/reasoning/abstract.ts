import { sample, shuffle, type Rng } from '../rng'
import type { Lang } from './numerical'

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
/** Most dots a figure shows. The count never wraps, so a rising series stays readable. */
export const MAX_DOTS = 8

export interface Frame {
  /** Degrees, multiple of 45. */
  rotation: number
  /** Dots under the shape, 1..MAX_DOTS. */
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
      return { ...f, count: f.count + r.step * k }
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
  // ±1 only: a steady count over six figures must fit in 1..MAX_DOTS.
  count: [1, -1],
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
      count: int(rng, 1, MAX_DOTS),
      fill: FILLS[int(rng, 0, 2)],
      position: int(rng, 0, 7),
    }
    const frames = [0, 1, 2, 3, 4].map((k) => frameAt(rules, start, k))
    const countable = (f: Frame) => f.count >= 1 && f.count <= MAX_DOTS
    if (![...frames, frameAt(rules, start, 5)].every(countable)) continue
    // Every rule must visibly change something across the five frames.
    if (rules.some((r) => new Set(frames.map((f) => f[r.attr])).size < 2)) continue
    const answer = frameAt(rules, start, 5)

    const wrong: { frame: Frame; attr: Attr }[] = []
    for (let i = 0, tries = 0; wrong.length < 3 && tries < 40; tries++, i++) {
      const r = rules[i % rules.length]
      const f = { ...answer, [r.attr]: slip(answer, r, tries)[r.attr] } as Frame
      if (!countable(f) || sameFrame(f, answer) || wrong.some((w) => sameFrame(w.frame, f))) continue
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

const FILL_NAMES: Record<Lang, Record<Fill, string>> = {
  en: { solid: 'solid', outline: 'empty', hatched: 'hatched' },
  cs: { solid: 'plná', outline: 'prázdná', hatched: 'šrafovaná' },
  sk: { solid: 'plná', outline: 'prázdna', hatched: 'šrafovaná' },
}

const RULE_NAMES: Record<Lang, Record<Attr, string>> = {
  en: { rotation: 'the turn', count: 'the dots', fill: 'the fill', position: 'the border square' },
  cs: { rotation: 'otáčení', count: 'tečky', fill: 'výplň', position: 'čtvereček na okraji' },
  sk: { rotation: 'otáčanie', count: 'bodky', fill: 'výplň', position: 'štvorček na okraji' },
}

const places = (n: number, lang: Lang) =>
  lang === 'en' ? `${n} place${n === 1 ? '' : 's'}` : lang === 'cs' ? `${n} ${n === 1 ? 'místo' : n < 5 ? 'místa' : 'míst'}` : `${n} ${n === 1 ? 'miesto' : n < 5 ? 'miesta' : 'miest'}`

/** One rule of a series in plain words, for the worked solution. */
export function explainRule(r: Rule, start: Frame, lang: Lang): string {
  const cw = r.step > 0
  const dir = {
    en: cw ? 'clockwise' : 'anticlockwise',
    cs: cw ? 'po směru hodinových ručiček' : 'proti směru hodinových ručiček',
    sk: cw ? 'v smere hodinových ručičiek' : 'proti smeru hodinových ručičiek',
  }[lang]
  const n = Math.abs(r.step)
  switch (r.attr) {
    case 'rotation':
      return {
        en: `The arrow turns ${n}° ${dir} at each step.`,
        cs: `Šipka se s každým krokem otočí o ${n}° ${dir}.`,
        sk: `Šípka sa s každým krokom otočí o ${n}° ${dir}.`,
      }[lang]
    case 'count':
      return {
        en: `One dot ${cw ? 'more' : 'fewer'} at each step.`,
        cs: `S každým krokem ${cw ? 'přibude' : 'ubude'} jedna tečka.`,
        sk: `S každým krokom ${cw ? 'pribudne' : 'ubudne'} jedna bodka.`,
      }[lang]
    case 'fill': {
      const seq = [0, 1, 2].map((k) => FILL_NAMES[lang][apply(start, r, k).fill]).join(' → ')
      return { en: `The fill repeats: ${seq}.`, cs: `Výplň se opakuje: ${seq}.`, sk: `Výplň sa opakuje: ${seq}.` }[lang]
    }
    case 'position':
      return {
        en: `The square on the border moves ${places(n, lang)} ${dir} at each step.`,
        cs: `Čtvereček na okraji se s každým krokem posune o ${places(n, lang)} ${dir}.`,
        sk: `Štvorček na okraji sa s každým krokom posunie o ${places(n, lang)} ${dir}.`,
      }[lang]
  }
}

/** Why a wrong option is wrong: the one rule it breaks. */
export function explainBroken(attr: Attr, lang: Lang): string {
  const name = RULE_NAMES[lang][attr]
  return {
    en: `This option breaks the rule for ${name}.`,
    cs: `Tato možnost porušuje pravidlo pro ${name}.`,
    sk: `Táto možnosť porušuje pravidlo pre ${name}.`,
  }[lang]
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
