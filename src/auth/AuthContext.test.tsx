import { describe, it, expect, vi } from 'vitest'
import { render, screen, act } from '@testing-library/react'
import { AuthProvider, useAuth } from './AuthContext'

const { calls, signOutResult } = vi.hoisted(() => ({
  calls: [] as string[],
  signOutResult: { error: null as { message: string } | null },
}))
vi.mock('./supabase', () => ({
  isAuthConfigured: true,
  supabase: {
    auth: {
      getSession: () => Promise.reject(new Error('storage blocked')),
      onAuthStateChange: () => ({ data: { subscription: { unsubscribe() {} } } }),
      signOut: async () => {
        calls.push('signOut')
        return { error: signOutResult.error }
      },
    },
  },
}))
vi.mock('../analytics', () => ({ identify: vi.fn() }))

function Probe() {
  const { loading, user } = useAuth()
  return <p>{loading ? 'loading' : user ? 'signed-in' : 'signed-out'}</p>
}

describe('AuthProvider', () => {
  it('a failed getSession ends loading as signed out', async () => {
    render(
      <AuthProvider>
        <Probe />
      </AuthProvider>,
    )
    expect(await screen.findByText('signed-out')).toBeInTheDocument()
  })
})

describe('signOut', () => {
  it('runs the before-sign-out flush to completion before the session is removed', async () => {
    let auth!: ReturnType<typeof useAuth>
    function Grab() {
      auth = useAuth()
      return null
    }
    render(
      <AuthProvider>
        <Grab />
      </AuthProvider>,
    )
    auth.beforeSignOut.current = async () => {
      await Promise.resolve()
      calls.push('flush')
    }
    await act(() => auth.signOut())
    expect(calls).toEqual(['flush', 'signOut'])
  })

  it('a hung before-sign-out flush does not block sign-out past a few seconds', async () => {
    vi.useFakeTimers()
    try {
      let auth!: ReturnType<typeof useAuth>
      function Grab() {
        auth = useAuth()
        return null
      }
      render(
        <AuthProvider>
          <Grab />
        </AuthProvider>,
      )
      calls.length = 0
      auth.beforeSignOut.current = () => new Promise<void>(() => {}) // a fetch that never settles
      const done = auth.signOut()
      await vi.advanceTimersByTimeAsync(10_000)
      await done
      expect(calls).toEqual(['signOut'])
    } finally {
      vi.useRealTimers()
    }
  })

  it('reports the error when the session could not be ended (offline, 5xx)', async () => {
    let auth!: ReturnType<typeof useAuth>
    function Grab() {
      auth = useAuth()
      return null
    }
    render(
      <AuthProvider>
        <Grab />
      </AuthProvider>,
    )
    auth.beforeSignOut.current = null
    signOutResult.error = { message: 'Failed to fetch' }
    try {
      expect(await auth.signOut()).toEqual({ ok: false, error: 'Failed to fetch' })
    } finally {
      signOutResult.error = null
    }
    expect(await auth.signOut()).toEqual({ ok: true })
  })
})
