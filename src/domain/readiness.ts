import type { CategoryName, Question } from './types'
import { ALL_QUESTIONS, CATEGORY_NAMES, META } from './questions'
import type { ProgressData, QuestionStat } from './progress'

/**
 * Readiness: what you would likely score on a fresh 30-question paper.
 *
 * Only first attempts count. A mock built from questions you have already met measures
 * memory of this bank; your first answer to a question you have never seen is the honest
 * predictor of the real test, where every question is new. Per category, first-try
 * accuracy gets a Beta(1 + correct, 1 + wrong) posterior; the score on that category's
 * share of the paper is beta-binomial; the three are convolved into an exact distribution
 * of 0..30. No sampling, so the numbers are deterministic and testable.
 */

/** First attempts needed in every category before we show an estimate. */
export const MIN_FIRST_ATTEMPTS = 8
/** The range shown is the central 80%: 10th to 90th percentile. */
const LOW_Q = 0.1
const HIGH_Q = 0.9

/**
 * Was the first answer right? Recorded since Oct 2026 (`first`); for older progress it is
 * inferred when unambiguous (all answers right, or all wrong) and unknown otherwise.
 */
export function firstAttempt(s: QuestionStat): boolean | null {
  if (s.first !== undefined) return s.first
  if (s.seen === 0) return null
  if (s.correct === s.seen) return true
  if (s.correct === 0) return false
  return null
}

function logGamma(x: number): number {
  // Lanczos approximation (g = 7, n = 9), accurate to ~1e-15 for x > 0.
  const c = [
    0.99999999999980993, 676.5203681218851, -1259.1392167224028, 771.32342877765313,
    -176.61502916214059, 12.507343278686905, -0.13857109526572012, 9.9843695780195716e-6,
    1.5056327351493116e-7,
  ]
  if (x < 0.5) return Math.log(Math.PI / Math.sin(Math.PI * x)) - logGamma(1 - x)
  x -= 1
  let a = c[0]
  const t = x + 7.5
  for (let i = 1; i < 9; i++) a += c[i] / (x + i)
  return 0.5 * Math.log(2 * Math.PI) + (x + 0.5) * Math.log(t) - t + Math.log(a)
}

const logBeta = (a: number, b: number) => logGamma(a) + logGamma(b) - logGamma(a + b)

/** P(K = k) for K ~ BetaBinomial(n, a, b), k = 0..n. */
export function betaBinomialPmf(n: number, a: number, b: number): number[] {
  const out: number[] = []
  for (let k = 0; k <= n; k++) {
    const logChoose = logGamma(n + 1) - logGamma(k + 1) - logGamma(n - k + 1)
    out.push(Math.exp(logChoose + logBeta(k + a, n - k + b) - logBeta(a, b)))
  }
  return out
}

/** Distribution of X + Y for independent X, Y given as pmfs over 0..len-1. */
export function convolve(x: number[], y: number[]): number[] {
  const out = new Array<number>(x.length + y.length - 1).fill(0)
  x.forEach((px, i) => y.forEach((py, j) => (out[i + j] += px * py)))
  return out
}

export interface Evidence {
  n: number
  correct: number
}

export interface Readiness {
  /** True once every category has MIN_FIRST_ATTEMPTS first attempts. */
  enough: boolean
  /** First attempts still needed per category (0 when enough). */
  missing: Record<CategoryName, number>
  byCategory: Record<CategoryName, Evidence>
  total: number
  /** Expected score on a fresh paper. */
  expected: number
  /** 10th and 90th percentile scores. */
  low: number
  high: number
  pmf: number[]
  /** P(score ≥ s). */
  atLeast(s: number): number
}

export function readiness(
  progress: ProgressData,
  questions: readonly Question[] = ALL_QUESTIONS,
): Readiness {
  const catOf = new Map(questions.map((q) => [q.id, q.cat]))
  const byCategory = Object.fromEntries(
    CATEGORY_NAMES.map((c) => [c, { n: 0, correct: 0 }]),
  ) as Record<CategoryName, Evidence>
  for (const [id, stat] of Object.entries(progress.stats)) {
    const cat = catOf.get(Number(id))
    const first = firstAttempt(stat)
    if (!cat || first === null) continue
    byCategory[cat].n++
    if (first) byCategory[cat].correct++
  }

  const missing = Object.fromEntries(
    CATEGORY_NAMES.map((c) => [c, Math.max(0, MIN_FIRST_ATTEMPTS - byCategory[c].n)]),
  ) as Record<CategoryName, number>

  // Paper composition from the notice via meta.json: 10 questions per category.
  let pmf = [1]
  for (const part of META.exam.composition) {
    for (const cat of part.categories) {
      const e = byCategory[cat]
      pmf = convolve(pmf, betaBinomialPmf(part.count, 1 + e.correct, 1 + e.n - e.correct))
    }
  }

  const quantile = (q: number) => {
    let acc = 0
    for (let s = 0; s < pmf.length; s++) {
      acc += pmf[s]
      if (acc >= q - 1e-12) return s
    }
    return pmf.length - 1
  }

  return {
    enough: Object.values(missing).every((m) => m === 0),
    missing,
    byCategory,
    total: pmf.length - 1,
    expected: pmf.reduce((sum, p, s) => sum + p * s, 0),
    low: quantile(LOW_Q),
    high: quantile(HIGH_Q),
    pmf,
    atLeast: (s: number) => pmf.slice(Math.max(0, s)).reduce((a, b) => a + b, 0),
  }
}
