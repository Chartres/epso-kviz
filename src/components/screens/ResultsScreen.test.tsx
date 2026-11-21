import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { ResultsScreen } from './ResultsScreen'
import { reducer, initialState, type AppState } from '@/app/store'
import { makeRng } from '@/domain/rng'
import { currentQuestion } from '@/domain/session'
import { emptyProgress, recordAnswer } from '@/domain/progress'
import { ALL_QUESTIONS } from '@/domain/questions'

const { app, track } = vi.hoisted(() => ({
  app: { state: null as unknown as AppState, dispatch: vi.fn() },
  track: vi.fn(),
}))
vi.mock('@/app/AppContext', () => ({ useApp: () => app }))
vi.mock('@/analytics', () => ({ track, feedback: vi.fn(), identify: vi.fn() }))

/** A finished lesson with the first question wrong and the rest right; other questions are due globally. */
function finishedLesson(): { state: AppState; wrongId: number } {
  let p = emptyProgress()
  for (const q of ALL_QUESTIONS.slice(-5)) p = recordAnswer(p, q.id, false, 1)
  let s: AppState = { ...initialState(), progress: p }
  s = reducer(s, { type: 'startLesson', rng: makeRng(7) })
  const wrongId = currentQuestion(s.session!)!.id
  for (let i = 0; s.view !== 'results'; i++) {
    const q = currentQuestion(s.session!)!
    const choice = i === 0 ? (q.correct === 'a' ? 'b' : 'a') : q.correct
    s = reducer(s, { type: 'answer', choice, now: 10 + i })
    s = reducer(s, { type: 'next', today: '2026-11-18' })
  }
  return { state: s, wrongId }
}

beforeEach(() => {
  track.mockReset()
  app.dispatch = vi.fn()
})

describe('ResultsScreen actions', () => {
  it('Next lesson sends start_lesson', () => {
    app.state = finishedLesson().state
    render(<ResultsScreen />)
    fireEvent.click(screen.getByRole('button', { name: 'Next lesson' }))
    expect(track).toHaveBeenCalledWith('start_lesson', expect.anything())
    expect(app.dispatch).toHaveBeenCalledWith(expect.objectContaining({ type: 'startLesson' }))
  })

  it("Review mistakes sends start_review and reviews this round's mistakes only", () => {
    const { state, wrongId } = finishedLesson()
    app.state = state
    render(<ResultsScreen />)
    fireEvent.click(screen.getByRole('button', { name: 'Review mistakes' }))
    expect(track).toHaveBeenCalledWith('start_review', expect.anything())
    expect(app.dispatch).toHaveBeenCalledWith(
      expect.objectContaining({ type: 'startReview', ids: [wrongId] }),
    )
  })

  it('the streak badge shows what home shows when the lesson could not extend the streak', () => {
    const { state } = finishedLesson()
    // Dated ahead (another device's clock): recordLessonComplete keeps it, home shows 0.
    app.state = { ...state, progress: { ...state.progress, streak: { current: 4, best: 4, lastDate: '2999-01-01' } } }
    render(<ResultsScreen />)
    expect(screen.getByText(/days? streak/).previousElementSibling?.textContent).toBe('0')
  })
})

describe('ResultsScreen completion events', () => {
  const completions = () =>
    track.mock.calls.filter(([n]) => ['lesson_complete', 'exam_finish', 'session_finish'].includes(n))

  it('a finished lesson sends lesson_complete once, also across re-renders', () => {
    app.state = finishedLesson().state
    const { rerender } = render(<ResultsScreen />)
    rerender(<ResultsScreen />)
    expect(completions()).toEqual([['lesson_complete', expect.objectContaining({ mode: 'lesson' })]])
  })

  it('a finished practice round sends session_finish', () => {
    let s = reducer(initialState(), { type: 'startPractice', rng: makeRng(3) })
    while (s.view !== 'results') {
      s = reducer(s, { type: 'answer', choice: 'a', now: 1 })
      s = reducer(s, { type: 'next', today: '2026-11-18' })
    }
    app.state = s
    render(<ResultsScreen />)
    expect(completions()).toEqual([['session_finish', expect.objectContaining({ mode: 'practice' })]])
  })

  it('an exam finished early sends exam_finish with its pass flag', () => {
    let s = reducer(initialState(), { type: 'startExam', rng: makeRng(5), now: 0 })
    s = reducer(s, { type: 'answer', choice: 'a', now: 1 })
    s = reducer(s, { type: 'finishExam' })
    app.state = s
    render(<ResultsScreen />)
    expect(completions()).toEqual([
      ['exam_finish', expect.objectContaining({ mode: 'exam', passed: s.examResult!.passed })],
    ])
  })

  it('an unfinished round sends no completion event', () => {
    let s = reducer(initialState(), { type: 'startLesson', rng: makeRng(7) })
    s = reducer(s, { type: 'answer', choice: 'a', now: 1 })
    app.state = { ...s, view: 'results' }
    render(<ResultsScreen />)
    expect(completions()).toEqual([])
  })
})
