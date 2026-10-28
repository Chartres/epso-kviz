import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, act, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { AuthProvider, useAuth } from './AuthContext'

vi.mock('@/analytics', () => ({ identify: vi.fn(), track: vi.fn() }))

// Minimal supabase mock — replaced per-test where needed.
let mockSupabase: {
  auth: {
    getSession: ReturnType<typeof vi.fn>
    onAuthStateChange: ReturnType<typeof vi.fn>
    signOut: ReturnType<typeof vi.fn>
  }
}

vi.mock('./supabase', () => ({
  isAuthConfigured: true,
  get supabase() {
    return mockSupabase
  },
}))

function noop() { return { data: { subscription: { unsubscribe: vi.fn() } } } }

function Spy() {
  const ctx = useAuth()
  return (
    <div>
      <div data-testid="loading">{String(ctx.loading)}</div>
      <div data-testid="user">{ctx.user?.id ?? 'none'}</div>
      <button onClick={ctx.signOut}>sign-out</button>
    </div>
  )
}

function setup() {
  return render(
    <AuthProvider>
      <Spy />
    </AuthProvider>,
  )
}

beforeEach(() => {
  mockSupabase = {
    auth: {
      getSession: vi.fn(async () => ({ data: { session: null } })),
      onAuthStateChange: vi.fn(noop),
      signOut: vi.fn(async () => {}),
    },
  }
})

describe('AuthContext', () => {
  it('loading starts true and becomes false after getSession resolves', async () => {
    setup()
    expect(screen.getByTestId('loading').textContent).toBe('true')
    await waitFor(() => expect(screen.getByTestId('loading').textContent).toBe('false'))
  })

  it('loading becomes false even when getSession rejects (finding 3)', async () => {
    mockSupabase.auth.getSession = vi.fn(async () => { throw new Error('network') })
    setup()
    await waitFor(() => expect(screen.getByTestId('loading').textContent).toBe('false'))
  })

  it('sets user from getSession result', async () => {
    mockSupabase.auth.getSession = vi.fn(async () => ({
      data: { session: { user: { id: 'u-1', email: 'a@b.com' } } },
    }))
    setup()
    await waitFor(() => expect(screen.getByTestId('user').textContent).toBe('u-1'))
  })

  it('updates user when onAuthStateChange fires', async () => {
    let fireChange: ((event: string, session: unknown) => void) | undefined
    mockSupabase.auth.onAuthStateChange = vi.fn((cb) => {
      fireChange = cb
      return { data: { subscription: { unsubscribe: vi.fn() } } }
    })
    setup()
    await waitFor(() => expect(screen.getByTestId('loading').textContent).toBe('false'))
    act(() => {
      fireChange!('SIGNED_IN', { user: { id: 'u-2', email: 'b@c.com' } })
    })
    expect(screen.getByTestId('user').textContent).toBe('u-2')
  })

  it('calls supabase.auth.signOut on signOut()', async () => {
    setup()
    await waitFor(() => expect(screen.getByTestId('loading').textContent).toBe('false'))
    await userEvent.click(screen.getByRole('button', { name: /sign-out/i }))
    expect(mockSupabase.auth.signOut).toHaveBeenCalled()
  })
})
