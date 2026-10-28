/**
 * Tests for AppContext hydration, save, and sync orchestration.
 * Key regression: state must be initialised from localStorage, not emptyProgress(),
 * so the save effect never fires with empty data before hydration — including
 * under React StrictMode's double-mount.
 */
import { StrictMode } from 'react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import { AuthProvider } from '@/auth/AuthContext'
import { AppProvider, useApp } from '@/app/AppContext'
import { saveProgress, loadProgress } from '@/domain/storage'
import { emptyProgress, recordAnswer } from '@/domain/progress'

// Silence the analytics track calls
vi.mock('@/analytics', () => ({
  track: vi.fn(),
  identify: vi.fn(),
  conversion: vi.fn(),
  feedback: vi.fn(),
  logError: vi.fn(),
}))

// Mock supabaseStore so sync never touches the network
vi.mock('@/auth/supabaseStore', () => ({
  supabaseStore: {
    fetch: vi.fn(async () => null),
    save: vi.fn(async () => {}),
  },
}))

beforeEach(() => localStorage.clear())

function SeenCount({ id }: { id: number }) {
  const { state } = useApp()
  return <div data-testid="seen">{state.progress.stats[id]?.seen ?? 0}</div>
}

function Providers({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      <AppProvider>{children}</AppProvider>
    </AuthProvider>
  )
}

describe('AppContext hydration', () => {
  it('initialises from localStorage, not emptyProgress', () => {
    let p = emptyProgress()
    p = recordAnswer(p, 1, true, 100)
    saveProgress(p)

    render(
      <Providers>
        <SeenCount id={1} />
      </Providers>,
    )

    expect(screen.getByTestId('seen').textContent).toBe('1')
  })

  it('preserves localStorage progress under StrictMode double-mount', () => {
    let p = emptyProgress()
    p = recordAnswer(p, 42, true, 200)
    saveProgress(p)

    render(
      <StrictMode>
        <Providers>
          <SeenCount id={42} />
        </Providers>
      </StrictMode>,
    )

    // StrictMode mounts+unmounts+remounts; localStorage must still hold progress.
    expect(screen.getByTestId('seen').textContent).toBe('1')
    expect(loadProgress().stats[42]?.seen).toBe(1)
  })

  it('does not wipe non-empty localStorage on mount', () => {
    let p = emptyProgress()
    p = recordAnswer(p, 7, false, 300)
    saveProgress(p)

    render(
      <Providers>
        <SeenCount id={7} />
      </Providers>,
    )

    // After mounting (and the save effect firing), q7 must still be in localStorage.
    expect(loadProgress().stats[7]?.seen).toBe(1)
  })
})
