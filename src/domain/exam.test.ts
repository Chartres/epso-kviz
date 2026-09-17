import { describe, it, expect } from 'vitest'
import { makeRng } from './rng'
import { buildExam, evaluateExam, EXAM } from './exam'
import {
  createSession,
  answerCurrent,
  advance,
  currentQuestion,
  type SessionState,
} from './session'
import type { ExamGroup } from './types'

const GROUP_OF: Record<string, ExamGroup> = {
  'AI Engineering & Operations': 'engineering',
  'AI Act & Governance': 'governance',
  'EU Digital Policy & Strategy': 'policy',
}

describe('buildExam', () => {
  it('produces 30 questions in the official composition', () => {
    const exam = buildExam(makeRng(1))
    expect(exam).toHaveLength(30)
    const byGroup: Record<ExamGroup, number> = {
      engineering: 0,
      governance: 0,
      policy: 0,
    }
    for (const q of exam) byGroup[GROUP_OF[q.cat]]++
    expect(byGroup).toEqual({ engineering: 10, governance: 10, policy: 10 })
  })

  it('has no duplicate questions', () => {
    const exam = buildExam(makeRng(2))
    expect(new Set(exam.map((q) => q.id)).size).toBe(30)
  })

  it('is deterministic for a seed and varies across seeds', () => {
    const a = buildExam(makeRng(5)).map((q) => q.id)
    const b = buildExam(makeRng(5)).map((q) => q.id)
    const c = buildExam(makeRng(6)).map((q) => q.id)
    expect(a).toEqual(b)
    expect(a).not.toEqual(c)
  })

  it('exposes the official thresholds', () => {
    expect(EXAM.totalQuestions).toBe(30)
    expect(EXAM.passThreshold).toBe(15)
    expect(EXAM.timeLimitMinutes).toBe(40)
  })
})

function answerAll(exam: ReturnType<typeof buildExam>, correctCount: number) {
  let s: SessionState = createSession(exam)
  let i = 0
  while (currentQuestion(s)) {
    const cur = currentQuestion(s)!
    const wrong = (['a', 'b', 'c', 'd'] as const).find((o) => o !== cur.correct)!
    s = answerCurrent(s, i < correctCount ? cur.correct : wrong)
    s = advance(s)
    i++
  }
  return s
}

describe('evaluateExam', () => {
  it('passes at exactly the threshold (15/30)', () => {
    const exam = buildExam(makeRng(3))
    const result = evaluateExam(answerAll(exam, 15))
    expect(result.score).toBe(15)
    expect(result.total).toBe(30)
    expect(result.passed).toBe(true)
  })

  it('fails just below the threshold (14/30)', () => {
    const exam = buildExam(makeRng(3))
    const result = evaluateExam(answerAll(exam, 14))
    expect(result.score).toBe(14)
    expect(result.passed).toBe(false)
  })

  it('breaks the score down by category', () => {
    const exam = buildExam(makeRng(4))
    const result = evaluateExam(answerAll(exam, 30))
    const totalByCat = Object.values(result.byCategory).reduce(
      (n, c) => n + c.total,
      0,
    )
    expect(totalByCat).toBe(30)
  })
})
