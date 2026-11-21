import { describe, it, expect, vi } from 'vitest'
import { render, screen, act } from '@testing-library/react'
import { AuthProvider, useAuth } from './AuthContext'

const { calls } = vi.hoisted(() => ({ calls: [] as string[] }))
vi.mock('./supabase', () => ({
  isAuthConfigured: true,
  supabase: {
    auth: {
      getSession: () => Promise.reject(new Error('storage blocked')),
      onAuthStateChange: () => ({ data: { subscription: { unsubscribe() {} } } }),
      signOut: async () => {
        calls.push('signOut')
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
})
