import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { PracticeScreen } from './PracticeScreen'
import { initialState, type AppState } from '@/app/store'
import { emptyProgress } from '@/domain/progress'
import { ALL_QUESTIONS } from '@/domain/questions'

const { app } = vi.hoisted(() => ({
  app: { state: null as unknown as AppState, dispatch: vi.fn() },
}))
vi.mock('@/app/AppContext', () => ({ useApp: () => app }))
vi.mock('@/analytics', () => ({ track: vi.fn(), identify: vi.fn() }))

describe('PracticeScreen bookmarks', () => {
  it('counts only bookmarks still in the bank', () => {
    const gone = Math.max(...ALL_QUESTIONS.map((q) => q.id)) + 1
    app.state = { ...initialState(), progress: { ...emptyProgress(), bookmarks: [ALL_QUESTIONS[0].id, gone] } }
    const { unmount } = render(<PracticeScreen />)
    expect(screen.getByRole('button', { name: /Bookmarks/ }).textContent).toContain('1 questions')
    unmount()

    app.state = { ...initialState(), progress: { ...emptyProgress(), bookmarks: [gone] } }
    render(<PracticeScreen />)
    expect(screen.getByRole('button', { name: /Bookmarks/ })).toBeDisabled()
  })
})
