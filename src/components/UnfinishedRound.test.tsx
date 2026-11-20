import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { UnfinishedRound } from './UnfinishedRound'
import { initialState, type AppState } from '@/app/store'
import { emptyProgress } from '@/domain/progress'
import { ALL_QUESTIONS } from '@/domain/questions'
import type { RoundSnapshot } from '@/domain/round'

const { app } = vi.hoisted(() => ({
  app: { state: null as unknown as AppState, dispatch: vi.fn() },
}))
vi.mock('@/app/AppContext', () => ({ useApp: () => app }))
vi.mock('@/analytics', () => ({ track: vi.fn(), identify: vi.fn() }))
vi.mock('@/components/screens/ReasoningStart', () => ({ defaultLang: () => 'en' }))

const [q1, q2] = ALL_QUESTIONS
const gone = Math.max(...ALL_QUESTIONS.map((q) => q.id)) + 1

beforeEach(() => {
  app.dispatch = vi.fn()
})

const types = () => app.dispatch.mock.calls.map(([a]) => a.type)

describe('UnfinishedRound "New round"', () => {
  it('only clears a bookmarks round when no bookmark is left in the bank', () => {
    const snap: RoundSnapshot = { v: 1, mode: 'bookmarks', ids: [q1.id, q2.id], answers: [{ id: q1.id, choice: 'a' }] }
    app.state = { ...initialState(), unfinished: snap, progress: { ...emptyProgress(), bookmarks: [gone] } }
    render(<UnfinishedRound />)
    fireEvent.click(screen.getByRole('button', { name: 'New round' }))
    expect(types()).toEqual(['discardRound'])
  })
})
