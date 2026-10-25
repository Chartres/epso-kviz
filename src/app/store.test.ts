import { describe, it, expect } from 'vitest'
import { reducer, initialState, type AppState } from './store'
import { makeRng } from '@/domain/rng'
import { emptyProgress, recordAnswer, statFor } from '@/domain/progress'
import { currentQuestion, score } from '@/domain/session'
import { byCategory } from '@/domain/questions'

function start(overrides: Partial<AppState> = {}): AppState {
  return { ...initialState(), ...overrides }
}

describe('app store', () => {
  it('starts practice for the selected categories', () => {
    let s = start()
    s = reducer(s, { type: 'setCategories', categories: new Set(['EU Digital Policy & Strategy']) })
    s = reducer(s, { type: 'startPractice', rng: makeRng(1) })
    expect(s.view).toBe('quiz')
    expect(s.mode).toBe('practice')
    expect(s.session?.questions.length).toBe(byCategory('EU Digital Policy & Strategy').length)
    expect(s.session?.questions.every((q) => q.cat === 'EU Digital Policy & Strategy')).toBe(true)
  })

  it('answering records to the session and to progress', () => {
    let s = start()
    s = reducer(s, { type: 'setCategories', categories: new Set(['EU Digital Policy & Strategy']) })
    s = reducer(s, { type: 'startPractice', rng: makeRng(1) })
    const cur = currentQuestion(s.session!)!
    s = reducer(s, { type: 'answer', choice: cur.correct, now: 1000 })
    expect(score(s.session!)).toBe(1)
    expect(statFor(s.progress, cur.id).correct).toBe(1)
  })

  it('advances and finishes into results', () => {
    let s = start()
    s = reducer(s, { type: 'setCategories', categories: new Set(['EU Digital Policy & Strategy']) })
    s = reducer(s, { type: 'startPractice', rng: makeRng(1) })
    const total = s.session!.questions.length
    for (let i = 0; i < total; i++) {
      const cur = currentQuestion(s.session!)!
      s = reducer(s, { type: 'answer', choice: cur.correct, now: i })
      s = reducer(s, { type: 'next' })
    }
    expect(s.view).toBe('results')
  })

  it('runs an exam and evaluates pass/fail on finish', () => {
    let s = start()
    s = reducer(s, { type: 'startExam', rng: makeRng(7), now: 0 })
    expect(s.mode).toBe('exam')
    expect(s.session?.questions.length).toBe(30)
    expect(s.examEndsAt).toBe(40 * 60 * 1000)
    // answer everything correctly
    for (let i = 0; i < 30; i++) {
      const cur = currentQuestion(s.session!)!
      s = reducer(s, { type: 'answer', choice: cur.correct, now: i })
      s = reducer(s, { type: 'next' })
    }
    expect(s.view).toBe('results')
    expect(s.examResult?.passed).toBe(true)
    expect(s.examResult?.score).toBe(30)
  })

  it('finishExam (time up) evaluates the partial session', () => {
    let s = start()
    s = reducer(s, { type: 'startExam', rng: makeRng(7), now: 0 })
    s = reducer(s, { type: 'finishExam' })
    expect(s.view).toBe('results')
    expect(s.examResult?.passed).toBe(false)
  })

  it('starts a review session from the weak-spots queue', () => {
    let p = emptyProgress()
    p = recordAnswer(p, 1, false, 10)
    p = recordAnswer(p, 2, false, 20)
    let s = start({ progress: p })
    s = reducer(s, { type: 'startReview', rng: makeRng(1) })
    expect(s.mode).toBe('review')
    expect(s.session?.questions.map((q) => q.id)).toEqual([1, 2])
  })

  it('toggles bookmarks in progress', () => {
    let s = start()
    s = reducer(s, { type: 'toggleBookmark', id: 3 })
    expect(s.progress.bookmarks).toContain(3)
  })

  it('runs a finishable daily lesson and bumps the streak on completion', () => {
    let s = start()
    s = reducer(s, { type: 'startLesson', rng: makeRng(2) })
    expect(s.mode).toBe('lesson')
    expect(s.session?.questions.length).toBe(12)
    const total = s.session!.questions.length
    for (let i = 0; i < total; i++) {
      const cur = currentQuestion(s.session!)!
      s = reducer(s, { type: 'answer', choice: cur.correct, now: i })
      s = reducer(s, { type: 'next', today: '2026-06-06' })
    }
    expect(s.view).toBe('results')
    expect(s.progress.streak.current).toBe(1)
  })

  describe('restricted question pool (paid tier on, free user)', () => {
    const allowed = new Set(
      ['AI Engineering & Operations', 'AI Act & Governance', 'EU Digital Policy & Strategy'].flatMap(
        (c) => byCategory(c as never).slice(0, 12).map((q) => q.id),
      ),
    )
    const within = (s: AppState) => s.session!.questions.every((q) => allowed.has(q.id))

    it('defaults to no restriction', () => {
      expect(initialState().allowedIds).toBeNull()
    })

    it('lesson, practice and exam draw only from the allowed ids', () => {
      let s = reducer(start(), { type: 'setAllowed', ids: allowed })
      s = reducer(s, { type: 'startLesson', rng: makeRng(3) })
      expect(s.session!.questions.length).toBe(12)
      expect(within(s)).toBe(true)

      s = reducer(s, { type: 'startPractice', rng: makeRng(3) })
      expect(s.session!.questions.length).toBe(allowed.size)
      expect(within(s)).toBe(true)

      s = reducer(s, { type: 'startExam', rng: makeRng(3), now: 0 })
      expect(s.session!.questions.length).toBe(30)
      expect(within(s)).toBe(true)
    })

    it('review and bookmarks skip questions outside the pool', () => {
      const outside = [...byCategory('AI Act & Governance')].pop()!.id
      const inside = [...allowed][0]
      let p = emptyProgress()
      p = recordAnswer(p, outside, false, 10)
      p = recordAnswer(p, inside, false, 20)
      let s = reducer(start({ progress: p }), { type: 'setAllowed', ids: allowed })
      s = reducer(s, { type: 'startReview', rng: makeRng(1) })
      expect(s.session!.questions.map((q) => q.id)).toEqual([inside])

      s = reducer(s, { type: 'toggleBookmark', id: outside })
      s = reducer(s, { type: 'startBookmarks', rng: makeRng(1) })
      expect(s.session!.questions).toHaveLength(0)
    })
  })

  it('opens the upgrade screen and returns home from it', () => {
    let s = reducer(start(), { type: 'openUpgrade' })
    expect(s.view).toBe('upgrade')
    s = reducer(s, { type: 'goMenu' })
    expect(s.view).toBe('home')
  })

  it('returns to the menu and clears the active session', () => {
    let s = start()
    s = reducer(s, { type: 'startExam', rng: makeRng(1), now: 0 })
    s = reducer(s, { type: 'goMenu' })
    expect(s.view).toBe('home')
    expect(s.session).toBeNull()
    expect(s.examEndsAt).toBeNull()
  })
})
