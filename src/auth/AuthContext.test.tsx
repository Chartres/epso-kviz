import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { AuthProvider, useAuth } from './AuthContext'

vi.mock('./supabase', () => ({
  isAuthConfigured: true,
  supabase: {
    auth: {
      getSession: () => Promise.reject(new Error('storage blocked')),
      onAuthStateChange: () => ({ data: { subscription: { unsubscribe() {} } } }),
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
