import { describe, it, expect } from 'vitest'
import {
  ALL_QUESTIONS,
  META,
  byCategory,
  getQuestion,
  questionsForGroup,
} from './questions'

const metaCount = (name: string) => META.categories.find((c) => c.name === name)!.count

describe('question dataset', () => {
  it('loads the full merged set', () => {
    expect(ALL_QUESTIONS).toHaveLength(META.totalQuestions)
    // the exam needs 10 per group with room to vary between sittings
    expect(META.totalQuestions).toBeGreaterThanOrEqual(180)
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
    expect(counts['AI Engineering & Operations']).toBe(metaCount('AI Engineering & Operations'))
    expect(counts['AI Act & Governance']).toBe(metaCount('AI Act & Governance'))
    expect(counts['EU Digital Policy & Strategy']).toBe(metaCount('EU Digital Policy & Strategy'))
    expect(questionsForGroup('engineering').length).toBe(metaCount('AI Engineering & Operations'))
    expect(questionsForGroup('governance').length).toBe(metaCount('AI Act & Governance'))
    expect(questionsForGroup('policy').length).toBe(metaCount('EU Digital Policy & Strategy'))
  })

  it('filters by category', () => {
    const governance = byCategory('AI Act & Governance')
    expect(governance.length).toBe(metaCount('AI Act & Governance'))
    expect(governance.every((q) => q.cat === 'AI Act & Governance')).toBe(true)
  })

  it('resolves a question by id', () => {
    expect(getQuestion(1)?.cat).toBe('AI Engineering & Operations')
    expect(getQuestion(1001)?.cat).toBe('AI Act & Governance')
    expect(getQuestion(META.categories[2].range[0])?.cat).toBe('EU Digital Policy & Strategy')
  })

  it('exam config reflects the EPSO/AD/430/26 field-related MCQ', () => {
    expect(META.exam.totalQuestions).toBe(30)
    expect(META.exam.passThreshold).toBe(15)
    expect(META.exam.timeLimitMinutes).toBe(40)
  })
})
