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

  it('returns to the menu and clears the active session', () => {
    let s = start()
    s = reducer(s, { type: 'startExam', rng: makeRng(1), now: 0 })
    s = reducer(s, { type: 'goMenu' })
    expect(s.view).toBe('home')
    expect(s.session).toBeNull()
    expect(s.examEndsAt).toBeNull()
  })

  it('switches the question-first form (default B)', () => {
    const s0 = initialState()
    expect(s0.settings.questionFirst).toBe('b')
    const s1 = reducer(s0, { type: 'setQuestionFirst', mode: 'none' })
    expect(s1.settings.questionFirst).toBe('none')
    expect(reducer(s1, { type: 'setQuestionFirst', mode: 'c' }).settings.questionFirst).toBe('c')
  })

  describe('unfinished round (Pavol, 2026-11-01)', () => {
    function answerN(s: AppState, n: number, today = '2026-11-01'): AppState {
      for (let i = 0; i < n; i++) {
        const cur = currentQuestion(s.session!)!
        s = reducer(s, { type: 'answer', choice: cur.correct, now: 1000 + i })
        s = reducer(s, { type: 'next', today })
      }
      return s
    }

    it('leaving a lesson at 8 of 12 keeps the answers and waits on home, with no streak', () => {
      let s = reducer(start(), { type: 'startLesson', rng: makeRng(2) })
      const ids = s.session!.questions.map((q) => q.id)
      s = answerN(s, 8)
      s = reducer(s, { type: 'goMenu' })
      expect(s.view).toBe('home')
      expect(Object.keys(s.progress.stats)).toHaveLength(8)
      expect(s.progress.streak.current).toBe(0)
      expect(s.unfinished?.mode).toBe('lesson')
      expect(s.unfinished?.answers).toHaveLength(8)

      s = reducer(s, { type: 'resumeRound' })
      expect(s.view).toBe('quiz')
      expect(s.mode).toBe('lesson')
      expect(s.session!.index).toBe(8)
      expect(s.session!.questions.map((q) => q.id)).toEqual(ids)

      s = answerN(s, 4)
      expect(s.view).toBe('results')
      expect(s.progress.streak.current).toBe(1)
      expect(score(s.session!)).toBe(12)
      expect(s.unfinished).toBeNull()
    })

    it('a round opened and left unanswered keeps the waiting one; an answered one replaces it', () => {
      let s = reducer(start(), { type: 'startLesson', rng: makeRng(2) })
      s = answerN(s, 3)
      s = reducer(s, { type: 'goMenu' })
      const waiting = s.unfinished
      expect(waiting).not.toBeNull()
      s = reducer(s, { type: 'startPractice', rng: makeRng(9) })
      s = reducer(s, { type: 'goMenu' })
      expect(s.unfinished).toBe(waiting)
      s = reducer(s, { type: 'startLesson', rng: makeRng(3) })
      expect(s.unfinished).toBe(waiting)
      s = answerN(s, 1)
      expect(s.unfinished?.answers).toHaveLength(1)
      expect(s.unfinished?.ids).not.toEqual(waiting!.ids)
      expect(reducer(s, { type: 'discardRound' }).unfinished).toBeNull()
      // answered questions come back only through the review share, a minority of the set
      const answered = Object.keys(s.progress.stats).map(Number)
      const back = s.session!.questions.filter((q) => answered.includes(q.id)).length
      expect(back).toBeLessThanOrEqual(Math.floor(12 * 0.4))
    })

    it('an exam left early keeps its answers but records no attempt and leaves the round slot alone', () => {
      let s = reducer(start(), { type: 'startLesson', rng: makeRng(2) })
      s = answerN(s, 2)
      s = reducer(s, { type: 'goMenu' })
      const waiting = s.unfinished
      s = reducer(s, { type: 'startExam', rng: makeRng(5), now: 0 })
      s = answerN(s, 5)
      s = reducer(s, { type: 'goMenu' })
      expect(Object.keys(s.progress.stats)).toHaveLength(7)
      expect(s.examResult).toBeNull()
      expect(s.unfinished).toBe(waiting)
    })

    it('resumed practice restores its filter', () => {
      let s = reducer(start(), { type: 'setCategories', categories: new Set(['AI Act & Governance']) })
      s = reducer(s, { type: 'startPractice', rng: makeRng(1) })
      s = answerN(s, 2)
      s = reducer(s, { type: 'goMenu' })
      s = reducer(s, { type: 'setCategories', categories: new Set() })
      s = reducer(s, { type: 'resumeRound' })
      expect([...s.selectedCategories]).toEqual(['AI Act & Governance'])
      expect(s.session!.index).toBe(2)
    })
  })

  it('an exam draws unseen questions first', () => {
    let p = emptyProgress()
    for (const q of byCategory('AI Act & Governance').slice(0, 40)) p = recordAnswer(p, q.id, true, 1)
    const s = reducer(start({ progress: p }), { type: 'startExam', rng: makeRng(3), now: 0 })
    expect(s.session!.questions.every((q) => !p.stats[q.id])).toBe(true)
  })
})
