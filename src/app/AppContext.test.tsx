import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, act } from '@testing-library/react'
import { AppProvider, useApp } from './AppContext'
import { emptyProgress, recordAnswer, type ProgressData } from '@/domain/progress'
import { loadProgress, saveProgress } from '@/domain/storage'
import { ROUND_KEY } from '@/domain/round'
import { ALL_QUESTIONS } from '@/domain/questions'
import type { AuthUser } from '@/auth/AuthContext'

const { auth, store } = vi.hoisted(() => ({
  auth: { user: null as AuthUser | null },
  store: { fetch: vi.fn(), save: vi.fn() },
}))
vi.mock('@/auth/AuthContext', () => ({ useAuth: () => ({ user: auth.user }) }))
vi.mock('@/auth/supabaseStore', () => ({ supabaseStore: store }))
vi.mock('@/analytics', () => ({ track: vi.fn(), identify: vi.fn() }))

const qid = ALL_QUESTIONS[0].id
let seen: { progress: ProgressData; unfinished: unknown } | null = null
function Probe() {
  const { state } = useApp()
  seen = { progress: state.progress, unfinished: state.unfinished }
  return null
}
const tree = () => (
  <AppProvider>
    <Probe />
  </AppProvider>
)
const flush = () => act(async () => {})

beforeEach(() => {
  vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout'] })
  store.fetch.mockReset().mockResolvedValue(null)
  store.save.mockReset().mockResolvedValue(undefined)
  auth.user = null
  saveProgress(recordAnswer(emptyProgress(), qid, false, 100))
  localStorage.setItem(
    ROUND_KEY,
    JSON.stringify({ v: 1, mode: 'lesson', ids: [qid], answers: [{ id: qid, choice: 'a' }] }),
  )
})
afterEach(() => vi.useRealTimers())

describe('AppProvider auth effects', () => {
  it('sign-out clears local progress and the unfinished round', async () => {
    auth.user = { id: 'u1' }
    const { rerender } = render(tree())
    await flush()
    expect(seen!.progress.stats[qid]?.seen).toBe(1)

    auth.user = null
    rerender(tree())
    await flush()
    expect(seen!.progress.stats).toEqual({})
    expect(seen!.unfinished).toBeNull()
    expect(loadProgress().stats).toEqual({})
    expect(localStorage.getItem(ROUND_KEY)).toBeNull()
  })

  it('a failed cloud fetch does not push local progress over the cloud row', async () => {
    store.fetch.mockRejectedValue(new Error('offline'))
    auth.user = { id: 'u1' }
    render(tree())
    await flush()
    await act(async () => {
      vi.advanceTimersByTime(3000)
    })
    expect(store.save).not.toHaveBeenCalled()
    expect(seen!.progress.stats[qid]?.seen).toBe(1) // local kept
  })
})
