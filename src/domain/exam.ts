import type { CategoryName, ExamConfig, Question } from './types'
import { META, questionsForGroup } from './questions'
import { sample, shuffle, type Rng } from './rng'
import { score as sessionScore, type SessionState } from './session'

export const EXAM: ExamConfig = META.exam

/**
 * Assemble a mock exam matching the official 2026 composition
 * (52 legal + 5 nauka + 3 health = 60), then shuffle the order.
 */
export function buildExam(rng: Rng): Question[] {
  const picked: Question[] = []
  for (const part of EXAM.composition) {
    picked.push(...sample(questionsForGroup(part.group), part.count, rng))
  }
  return shuffle(picked, rng)
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
