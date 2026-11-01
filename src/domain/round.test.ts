import { describe, it, expect, beforeEach } from 'vitest'
import { ALL_QUESTIONS } from './questions'
import { advance, answerCurrent, createSession, type SessionState } from './session'
import {
  completionEvent,
  loadRound,
  restoreRound,
  ROUND_KEY,
  sanitizeRound,
  saveRound,
  snapshotRound,
} from './round'
import type { Choice } from './types'

const twelve = ALL_QUESTIONS.slice(0, 12)

/** Answer the first n questions, advancing after each (as the Next button does). */
function play(n: number, wrongFrom = Infinity): SessionState {
  let s = createSession(twelve)
  for (let i = 0; i < n; i++) {
    const q = twelve[i]
    const choice: Choice = i >= wrongFrom ? (q.correct === 'a' ? 'b' : 'a') : q.correct
    s = answerCurrent(s, choice)
    if (i < n - 1 || n < twelve.length) s = advance(s)
  }
  return s
}

describe('snapshotRound', () => {
  it('keeps nothing for the exam, an unanswered round or a finished one', () => {
    expect(snapshotRound('exam', play(3))).toBeNull()
    expect(snapshotRound('lesson', createSession(twelve))).toBeNull()
    expect(snapshotRound('lesson', advance(play(12)))).toBeNull()
    expect(snapshotRound('lesson', null)).toBeNull()
  })

  it('keeps the questions in order and the answers given', () => {
    const snap = snapshotRound('lesson', play(8))!
    expect(snap.mode).toBe('lesson')
    expect(snap.ids).toEqual(twelve.map((q) => q.id))
    expect(snap.answers).toHaveLength(8)
    expect(snap.filter).toBeUndefined()
  })

  it('keeps the practice filter so a new round is built the same way', () => {
    const snap = snapshotRound('practice', play(2), {
      categories: new Set(['AI Act & Governance' as const]),
      search: 'gpai',
    })!
    expect(snap.filter).toEqual({ categories: ['AI Act & Governance'], search: 'gpai' })
  })
})

describe('restoreRound', () => {
  it('resumes at the first unanswered question with the same questions and answers', () => {
    const before = play(8, 5)
    const s = restoreRound(snapshotRound('lesson', before)!)!
    expect(s.index).toBe(8)
    expect(s.questions.map((q) => q.id)).toEqual(before.questions.map((q) => q.id))
    expect(s.chosen).toEqual(before.chosen)
    expect(s.records).toEqual(before.records)
  })

  it('opens on the last question when all were answered but Finish was not pressed', () => {
    const s = restoreRound(snapshotRound('lesson', play(12))!)!
    expect(s.index).toBe(11)
    expect(s.chosen[twelve[11].id]).toBeDefined()
  })

  it('drops a round whose question is no longer in the bank', () => {
    const snap = snapshotRound('lesson', play(3))!
    expect(restoreRound({ ...snap, ids: [...snap.ids.slice(1), 999999] })).toBeNull()
  })
})

describe('storage', () => {
  beforeEach(() => localStorage.clear())

  it('round-trips through localStorage and clears on null', () => {
    const snap = snapshotRound('practice', play(4), { categories: [], search: '' })!
    saveRound(snap)
    expect(loadRound()).toEqual(snap)
    saveRound(null)
    expect(localStorage.getItem(ROUND_KEY)).toBeNull()
    expect(loadRound()).toBeNull()
  })

  it('rejects malformed snapshots', () => {
    expect(sanitizeRound(null)).toBeNull()
    expect(sanitizeRound({ v: 1, mode: 'exam', ids: [1], answers: [{ id: 1, choice: 'a' }] })).toBeNull()
    expect(sanitizeRound({ v: 1, mode: 'lesson', ids: [1], answers: [{ id: 2, choice: 'a' }] })).toBeNull()
    expect(sanitizeRound({ v: 1, mode: 'lesson', ids: [1], answers: [{ id: 1, choice: 'z' }] })).toBeNull()
    localStorage.setItem(ROUND_KEY, '{not json')
    expect(loadRound()).toBeNull()
  })
})

describe('completionEvent', () => {
  it('fires only for a finished round', () => {
    expect(completionEvent('lesson', play(8), null)).toBeNull()
    expect(completionEvent('lesson', advance(play(12)), null)).toBe('lesson_complete')
    expect(completionEvent('practice', advance(play(12)), null)).toBe('session_finish')
    expect(completionEvent('practice', play(11), null)).toBeNull()
  })

  it('counts an exam only with a result (finished or timed out)', () => {
    expect(completionEvent('exam', play(5), null)).toBeNull()
    expect(completionEvent('exam', play(5), { passed: false })).toBe('exam_finish')
  })
})
