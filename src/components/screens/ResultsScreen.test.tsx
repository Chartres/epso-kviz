/**
 * Tests that activation KPI events fire when the results screen mounts.
 * lesson_complete and exam_finish are the primary funnel events; app_open
 * is tracked in AppContext (covered separately).
 */
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render } from '@testing-library/react'
import { ResultsScreen } from './ResultsScreen'
import { ALL_QUESTIONS } from '@/domain/questions'
import { emptyProgress } from '@/domain/progress'
import type { AppState } from '@/app/store'
import type { SessionState } from '@/domain/session'

const track = vi.fn()
vi.mock('@/analytics', () => ({
  track: (...a: unknown[]) => track(...a),
  identify: vi.fn(),
  feedback: vi.fn(),
  logError: vi.fn(),
}))

// Minimal stub: ResultsScreen only calls useApp() and track()
vi.mock('@/app/AppContext', () => ({
  useApp: () => ({ state: mockState, dispatch: vi.fn() }),
}))

let mockState: AppState

function makeSession(correct: boolean[]): SessionState {
  const questions = ALL_QUESTIONS.slice(0, correct.length)
  const records = questions.map((q, i) => ({
    id: q.id,
    choice: correct[i] ? q.correct : (q.correct === 'a' ? 'b' : 'a'),
    correct: correct[i],
  }))
  const chosen = Object.fromEntries(records.map((r) => [r.id, r.choice]))
  return { questions, index: questions.length, records, chosen } as SessionState
}

function baseState(overrides: Partial<AppState> = {}): AppState {
  return {
    view: 'results',
    mode: null,
    session: null,
    examResult: null,
    examEndsAt: null,
    progress: emptyProgress(),
    selectedCategories: new Set(),
    search: '',
    ...overrides,
  }
}

beforeEach(() => track.mockClear())

describe('ResultsScreen analytics', () => {
  it('fires lesson_complete with score and total after a lesson', () => {
    mockState = baseState({
      mode: 'lesson',
      session: makeSession([true, true, false]),
    })
    render(<ResultsScreen />)
    expect(track).toHaveBeenCalledWith('lesson_complete', {
      mode: 'lesson',
      score: 2,
      total: 3,
      passed: undefined,
    })
  })

  it('fires exam_finish with pass/fail flag after an exam', () => {
    mockState = baseState({
      mode: 'exam',
      session: makeSession([true, false]),
      examResult: { passed: false, score: 1, total: 2, passThreshold: 18, byCategory: {} },
    })
    render(<ResultsScreen />)
    expect(track).toHaveBeenCalledWith('exam_finish', {
      mode: 'exam',
      score: 1,
      total: 2,
      passed: false,
    })
  })

  it('fires session_finish for practice mode', () => {
    mockState = baseState({
      mode: 'practice',
      session: makeSession([true]),
    })
    render(<ResultsScreen />)
    expect(track).toHaveBeenCalledWith('session_finish', expect.objectContaining({ mode: 'practice' }))
  })

  it('does not fire when session is null', () => {
    mockState = baseState({ mode: 'lesson', session: null })
    render(<ResultsScreen />)
    expect(track).not.toHaveBeenCalled()
  })
})
