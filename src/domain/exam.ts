import type { CategoryName, ExamConfig, Question } from './types'
import { META, questionsForGroup } from './questions'
import { sample, shuffle, type Rng } from './rng'
import { score as sessionScore, type SessionState } from './session'
import { statFor, type ProgressData } from './progress'

export const EXAM: ExamConfig = META.exam

const isUnseen = (p: ProgressData) => (q: Question) => statFor(p, q.id).seen === 0

/**
 * Assemble a mock exam matching the EPSO/AD/430/26 field-related MCQ
 * composition (10 engineering + 10 governance + 10 policy = 30), then
 * shuffle the order.
 *
 * Unseen questions first (Pavol, 2026-11-04): every question in the real test is new, and a
 * mock built from questions already answered measures memory of this bank. Each group draws
 * from its unseen questions and tops up from the answered ones only when those run out.
 */
export function buildExam(rng: Rng, progress?: ProgressData): Question[] {
  const picked: Question[] = []
  for (const part of EXAM.composition) {
    const pool = questionsForGroup(part.group)
    if (!progress) {
      picked.push(...sample(pool, part.count, rng))
      continue
    }
    const fresh = pool.filter(isUnseen(progress))
    const seen = pool.filter((q) => !isUnseen(progress)(q))
    const first = sample(fresh, Math.min(part.count, fresh.length), rng)
    picked.push(...first, ...sample(seen, part.count - first.length, rng))
  }
  return shuffle(picked, rng)
}

/** How many questions of a drawn exam were unseen when it was drawn. */
export function unseenIn(exam: Question[], progress: ProgressData): number {
  return exam.filter(isUnseen(progress)).length
}

export interface CategoryBreakdown {
  correct: number
  total: number
}

export interface ExamResult {
  score: number
  total: number
  passed: boolean
  passThreshold: number
  byCategory: Partial<Record<CategoryName, CategoryBreakdown>>
}

export function evaluateExam(s: SessionState): ExamResult {
  const total = s.questions.length
  const score = sessionScore(s)
  const byCategory: Partial<Record<CategoryName, CategoryBreakdown>> = {}
  const byId = new Map(s.questions.map((q) => [q.id, q]))
  for (const q of s.questions) {
    const b = (byCategory[q.cat] ??= { correct: 0, total: 0 })
    b.total++
  }
  for (const r of s.records) {
    if (!r.correct) continue
    const cat = byId.get(r.id)?.cat
    if (cat) byCategory[cat]!.correct++
  }
  return {
    score,
    total,
    passed: score >= EXAM.passThreshold,
    passThreshold: EXAM.passThreshold,
    byCategory,
  }
}

/** How many of the next mock's 30 questions will be new: unseen, capped per group. */
export function unseenAvailable(progress: ProgressData): number {
  return EXAM.composition.reduce(
    (n, part) =>
      n + Math.min(part.count, questionsForGroup(part.group).filter(isUnseen(progress)).length),
    0,
  )
}
