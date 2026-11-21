import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, act } from '@testing-library/react'
import { AppProvider, useApp } from './AppContext'
import { emptyProgress, recordAnswer, type ProgressData } from '@/domain/progress'
import { loadProgress, saveProgress } from '@/domain/storage'
import { ROUND_KEY } from '@/domain/round'
import { ALL_QUESTIONS } from '@/domain/questions'
import type { AuthUser } from '@/auth/AuthContext'
import { track } from '@/analytics'

const { auth, store } = vi.hoisted(() => ({
  auth: {
    user: null as AuthUser | null,
    loading: false,
    beforeSignOut: { current: null as (() => Promise<void>) | null },
  },
  store: { fetch: vi.fn(), save: vi.fn() },
}))
vi.mock('@/auth/AuthContext', () => ({ useAuth: () => ({ user: auth.user, loading: auth.loading, beforeSignOut: auth.beforeSignOut }) }))
vi.mock('@/auth/supabaseStore', () => ({ supabaseStore: store }))
vi.mock('@/analytics', () => ({ track: vi.fn(), identify: vi.fn() }))

const qid = ALL_QUESTIONS[0].id
let seen: { progress: ProgressData; unfinished: unknown } | null = null
let send: ReturnType<typeof useApp>['dispatch'] = () => {}
function Probe() {
  const { state, dispatch } = useApp()
  seen = { progress: state.progress, unfinished: state.unfinished }
  send = dispatch
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
  auth.loading = false
  vi.mocked(track).mockClear()
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

  it('progress changed while the sign-in fetch is in flight survives the merge', async () => {
    let resolve!: (p: ProgressData) => void
    store.fetch.mockReturnValue(new Promise((r) => (resolve = r)))
    const other = ALL_QUESTIONS[1].id
    auth.user = { id: 'u1' }
    render(tree())
    await flush()
    act(() => send({ type: 'toggleBookmark', id: other }))
    await act(async () => resolve(recordAnswer(emptyProgress(), ALL_QUESTIONS[2].id, true, 200)))
    expect(seen!.progress.bookmarks).toContain(other)
    expect(seen!.progress.stats[qid]?.seen).toBe(1)
    expect(seen!.progress.stats[ALL_QUESTIONS[2].id]?.seen).toBe(1)
  })

  it('a sign-in with nothing changed since sends the merged row once', async () => {
    store.fetch.mockResolvedValue(recordAnswer(emptyProgress(), ALL_QUESTIONS[2].id, true, 200))
    auth.user = { id: 'u1' }
    render(tree())
    await flush()
    await act(async () => {
      vi.advanceTimersByTime(3000)
    })
    expect(store.save).toHaveBeenCalledTimes(1)
    expect(store.save).toHaveBeenCalledWith('u1', seen!.progress)
  })

  it('after a failed sign-in fetch, the next progress change retries the sync and pushes', async () => {
    store.fetch.mockRejectedValueOnce(new Error('offline')).mockResolvedValue(null)
    const other = ALL_QUESTIONS[1].id
    auth.user = { id: 'u1' }
    render(tree())
    await flush()
    act(() => send({ type: 'toggleBookmark', id: other }))
    await act(async () => {
      vi.advanceTimersByTime(1500)
    })
    await flush()
    expect(store.fetch).toHaveBeenCalledTimes(2)
    expect(store.save).toHaveBeenCalledWith('u1', expect.objectContaining({ bookmarks: [other] }))
    expect(store.save.mock.calls.at(-1)![1].stats[qid]?.seen).toBe(1)
  })

  it('sign-out within the save debounce still sends the last changes to the cloud', async () => {
    const other = ALL_QUESTIONS[1].id
    auth.user = { id: 'u1' }
    const { rerender } = render(tree())
    await flush()
    act(() => send({ type: 'toggleBookmark', id: other }))
    // AuthProvider.signOut runs this while the session still exists, then the user goes null.
    await act(() => auth.beforeSignOut.current!())
    auth.user = null
    rerender(tree())
    await flush()
    await flush()
    expect(store.save).toHaveBeenLastCalledWith('u1', expect.objectContaining({ bookmarks: [other] }))
    expect(seen!.progress.bookmarks).toEqual([]) // local still cleared
  })

  it("another account's local progress, left by a session that expired while closed, is not merged in", async () => {
    auth.user = { id: 'uA' }
    const first = render(tree())
    await flush()
    first.unmount() // app closed; A's session expires meanwhile
    store.save.mockClear()
    auth.user = { id: 'uB' }
    render(tree())
    await flush()
    expect(seen!.progress.stats).toEqual({})
    expect(seen!.unfinished).toBeNull()
    expect(store.save).toHaveBeenCalledTimes(1)
    expect(store.save.mock.calls[0][1].stats).toEqual({})
  })

  it('switching from one account to another without a sign-out in between does not carry progress over', async () => {
    auth.user = { id: 'uA' }
    const { rerender } = render(tree())
    await flush()
    store.save.mockClear()
    auth.user = { id: 'uB' }
    rerender(tree())
    await flush()
    expect(seen!.progress.stats).toEqual({})
    expect(seen!.unfinished).toBeNull()
    expect(store.save).toHaveBeenCalledWith('uB', expect.objectContaining({ stats: {} }))
    expect(store.save.mock.calls.every(([, d]) => !d.stats[qid])).toBe(true)
  })

  it('the same account signing in again on this device keeps its local progress', async () => {
    auth.user = { id: 'uA' }
    render(tree()).unmount()
    await flush()
    render(tree())
    await flush()
    expect(seen!.progress.stats[qid]?.seen).toBe(1)
  })

  it('the sign-out flush is sent while still signed in, before the user goes null', async () => {
    const other = ALL_QUESTIONS[1].id
    auth.user = { id: 'u1' }
    render(tree())
    await flush()
    act(() => send({ type: 'toggleBookmark', id: other }))
    await act(() => auth.beforeSignOut.current!())
    expect(store.save).toHaveBeenLastCalledWith('u1', expect.objectContaining({ bookmarks: [other] }))
  })
})

describe('AppProvider app_open', () => {
  const opens = () => vi.mocked(track).mock.calls.filter(([n]) => n === 'app_open').length

  it('waits for auth to resolve, then fires once', async () => {
    auth.loading = true
    const { rerender } = render(tree())
    await flush()
    expect(opens()).toBe(0)

    auth.loading = false
    auth.user = { id: 'u1' }
    rerender(tree())
    await flush()
    expect(opens()).toBe(1)

    auth.user = null
    rerender(tree())
    await flush()
    expect(opens()).toBe(1)
  })

  it('fires at once when auth is not loading (Supabase not configured)', async () => {
    render(tree())
    await flush()
    expect(opens()).toBe(1)
  })
})
