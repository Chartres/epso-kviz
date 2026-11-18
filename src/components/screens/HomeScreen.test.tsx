import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { AuthProvider } from '@/auth/AuthContext'
import { AppProvider } from '@/app/AppContext'
import { App } from '@/App'
import { saveProgress } from '@/domain/storage'
import { emptyProgress, recordAnswer } from '@/domain/progress'

describe('HomeScreen review count', () => {
  it('ignores answers to questions no longer in the bank', async () => {
    saveProgress(recordAnswer(emptyProgress(), 9_999_999, false, 1))
    render(
      <AuthProvider>
        <AppProvider>
          <App />
        </AppProvider>
      </AuthProvider>,
    )
    await screen.findByTestId('stat-answered')
    expect(screen.queryByRole('button', { name: /Review mistakes/ })).toBeNull()
  })
})
