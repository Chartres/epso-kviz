import { describe, it, expect } from 'vitest'
import { ALL_QUESTIONS, CATEGORY_NAMES } from '@/domain/questions'
import {
  FREE_PER_CATEGORY,
  FREE_MOCK_EXAMS,
  freeSlice,
  resolveAccess,
  canStartExam,
} from './access'

const NOW = Date.UTC(2026, 10, 1)

describe('freeSlice', () => {
  it('takes the lowest FREE_PER_CATEGORY ids from each category', () => {
    const ids = freeSlice(ALL_QUESTIONS)
    expect(ids.size).toBe(FREE_PER_CATEGORY * CATEGORY_NAMES.length)
    for (const cat of CATEGORY_NAMES) {
      const inCat = ALL_QUESTIONS.filter((q) => q.cat === cat)
        .map((q) => q.id)
        .sort((a, b) => a - b)
      const picked = inCat.filter((id) => ids.has(id))
      expect(picked).toEqual(inCat.slice(0, FREE_PER_CATEGORY))
    }
  })

  it('is stable: the same bank always yields the same slice', () => {
    expect([...freeSlice(ALL_QUESTIONS)]).toEqual([...freeSlice([...ALL_QUESTIONS].reverse())].sort((a, b) => a - b))
  })
})

describe('resolveAccess', () => {
  it('flag off → everything open, exactly as before the paid tier', () => {
    const a = resolveAccess({ enabled: false, entitlement: null, now: NOW })
    expect(a.tier).toBe('open')
    expect(a.questionIds).toBeNull()
    expect(a.mockExams).toBeNull()
    expect(a.categoryStats).toBe(true)
  })

  it('flag on, no entitlement → free slice, one mock, no category stats', () => {
    const a = resolveAccess({ enabled: true, entitlement: null, now: NOW })
    expect(a.tier).toBe('free')
    expect(a.questionIds).toEqual(freeSlice(ALL_QUESTIONS))
    expect(a.mockExams).toBe(FREE_MOCK_EXAMS)
    expect(a.categoryStats).toBe(false)
  })

  it('flag on, active entitlement → full access', () => {
    const a = resolveAccess({
      enabled: true,
      entitlement: { plan: 'exam-pass', expiresAt: '2027-03-31T23:59:59Z' },
      now: NOW,
    })
    expect(a.tier).toBe('full')
    expect(a.questionIds).toBeNull()
    expect(a.mockExams).toBeNull()
    expect(a.categoryStats).toBe(true)
  })

  it('an expired entitlement falls back to free', () => {
    const a = resolveAccess({
      enabled: true,
      entitlement: { plan: 'exam-pass', expiresAt: '2026-10-01T00:00:00Z' },
      now: NOW,
    })
    expect(a.tier).toBe('free')
  })

  it('an entitlement without expiry never lapses', () => {
    const a = resolveAccess({
      enabled: true,
      entitlement: { plan: 'exam-pass', expiresAt: null },
      now: NOW,
    })
    expect(a.tier).toBe('full')
  })
})

describe('canStartExam', () => {
  it('free tier: allowed until the free mocks are used up', () => {
    const free = resolveAccess({ enabled: true, entitlement: null, now: NOW })
    expect(canStartExam(free, 0)).toBe(true)
    expect(canStartExam(free, FREE_MOCK_EXAMS)).toBe(false)
  })

  it('open and full tiers: unlimited', () => {
    const open = resolveAccess({ enabled: false, entitlement: null, now: NOW })
    expect(canStartExam(open, 99)).toBe(true)
  })
})
