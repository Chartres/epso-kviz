import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { AuthPanel } from './AuthPanel'

vi.mock('@/auth/AuthContext', () => ({
  useAuth: () => ({
    configured: true,
    user: { id: 'u', email: 'a@b.c' },
    signInWithEmail: vi.fn(),
    signOut: async () => ({ ok: false, error: 'Failed to fetch' }),
  }),
}))

describe('AuthPanel sign-out', () => {
  it('shows the error when sign-out fails instead of doing nothing', async () => {
    render(<AuthPanel />)
    fireEvent.click(screen.getByRole('button', { name: 'Account' }))
    fireEvent.click(screen.getByRole('button', { name: 'Sign out' }))
    expect(await screen.findByText('Failed to fetch')).toBeInTheDocument()
  })
})
