import { describe, it, expect } from 'vitest'
import {
  ALL_QUESTIONS,
  META,
  byCategory,
  getQuestion,
  questionsForGroup,
} from './questions'

describe('question dataset', () => {
  it('loads the full authoritative set (180 questions)', () => {
    expect(ALL_QUESTIONS).toHaveLength(180)
    expect(META.totalQuestions).toBe(180)
  })

  it('every question has a valid shape and a correct answer', () => {
    for (const q of ALL_QUESTIONS) {
      expect(typeof q.id).toBe('number')
      expect(q.q.length).toBeGreaterThan(0)
      expect(q.a.length).toBeGreaterThan(0)
      expect(q.b.length).toBeGreaterThan(0)
      expect(q.c.length).toBeGreaterThan(0)
      expect(q.d.length).toBeGreaterThan(0)
      expect(['a', 'b', 'c', 'd']).toContain(q.correct)
    }
  })

  it('groups categories by exam composition', () => {
    const counts = Object.fromEntries(
      META.categories.map((c) => [c.name, c.count]),
    )
    expect(counts['AI Engineering & Operations']).toBe(60)
    expect(counts['AI Act & Governance']).toBe(60)
    expect(counts['EU Digital Policy & Strategy']).toBe(60)
    expect(questionsForGroup('engineering').length).toBe(60)
    expect(questionsForGroup('governance').length).toBe(60)
    expect(questionsForGroup('policy').length).toBe(60)
  })

  it('filters by category', () => {
    const governance = byCategory('AI Act & Governance')
    expect(governance.length).toBe(60)
    expect(governance.every((q) => q.cat === 'AI Act & Governance')).toBe(true)
  })

  it('resolves a question by id', () => {
    expect(getQuestion(1)?.cat).toBe('AI Engineering & Operations')
    expect(getQuestion(1001)?.cat).toBe('AI Act & Governance')
    expect(getQuestion(2001)?.cat).toBe('EU Digital Policy & Strategy')
  })

  it('exam config reflects the EPSO/AD/430/26 field-related MCQ', () => {
    expect(META.exam.totalQuestions).toBe(30)
    expect(META.exam.passThreshold).toBe(15)
    expect(META.exam.timeLimitMinutes).toBe(40)
  })
})
