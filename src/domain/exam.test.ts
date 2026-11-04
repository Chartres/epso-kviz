import { describe, it, expect } from 'vitest'
import { makeRng } from './rng'
import { buildExam, evaluateExam, EXAM, unseenAvailable, unseenIn } from './exam'
import {
  createSession,
  answerCurrent,
  advance,
  currentQuestion,
  type SessionState,
} from './session'
import type { ExamGroup } from './types'
import { emptyProgress, recordAnswer } from './progress'
import { questionsForGroup } from './questions'

const GROUP_OF: Record<string, ExamGroup> = {
  'AI Engineering & Operations': 'engineering',
  'AI Act & Governance': 'governance',
  'EU Digital Policy & Strategy': 'policy',
}

describe('buildExam: unseen questions first (Pavol, 2026-11-04)', () => {
  it('draws only unseen questions while each group has enough', () => {
    let p = emptyProgress()
    // answer half of every group
    for (const g of ['engineering', 'governance', 'policy'] as ExamGroup[]) {
      const qs = questionsForGroup(g)
      qs.slice(0, Math.floor(qs.length / 2)).forEach((q, i) => (p = recordAnswer(p, q.id, true, i)))
    }
    const exam = buildExam(makeRng(11), p)
    expect(exam).toHaveLength(30)
    expect(exam.every((q) => !p.stats[q.id])).toBe(true)
  })

  it('tops a group up from answered questions when its unseen run out, keeping 10 per group', () => {
    let p = emptyProgress()
    const eng = questionsForGroup('engineering')
    eng.slice(0, eng.length - 4).forEach((q, i) => (p = recordAnswer(p, q.id, true, i)))
    const exam = buildExam(makeRng(12), p)
    const engInExam = exam.filter((q) => GROUP_OF[q.cat] === 'engineering')
    expect(engInExam).toHaveLength(10)
    const unseenEng = eng.slice(eng.length - 4).map((q) => q.id)
    expect(unseenEng.every((id) => engInExam.some((q) => q.id === id))).toBe(true)
    expect(new Set(exam.map((q) => q.id)).size).toBe(30)
  })

  it('counts how many of the drawn questions are new', () => {
    let p = emptyProgress()
    const eng = questionsForGroup('engineering')
    eng.slice(0, eng.length - 4).forEach((q, i) => (p = recordAnswer(p, q.id, true, i)))
    expect(unseenIn(buildExam(makeRng(13), p), p)).toBe(24)
    expect(unseenIn(buildExam(makeRng(13)), emptyProgress())).toBe(30)
    expect(unseenAvailable(p)).toBe(24)
    expect(unseenAvailable(emptyProgress())).toBe(30)
  })
})

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
