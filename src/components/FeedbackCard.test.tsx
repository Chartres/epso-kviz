import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { FeedbackCard } from './FeedbackCard'

const feedback = vi.fn()
vi.mock('@/analytics', () => ({ feedback: (...a: unknown[]) => feedback(...a) }))

describe('FeedbackCard', () => {
  beforeEach(() => feedback.mockClear())

  it('is collapsed by default and expands on click', async () => {
    render(<FeedbackCard />)
    expect(screen.queryByLabelText('Feedback')).not.toBeInTheDocument()
    await userEvent.click(screen.getByRole('button', { name: /write to the author/i }))
    expect(screen.getByLabelText('Feedback')).toBeInTheDocument()
  })

  it('sends the Sean Ellis choice + text (prefixed with context) and thanks the user', async () => {
    render(<FeedbackCard context="exam" />)
    await userEvent.click(screen.getByRole('button', { name: /write to the author/i }))
    await userEvent.click(screen.getByRole('button', { name: 'Very disappointed' }))
    await userEvent.type(screen.getByLabelText('Feedback'), 'missing dark mode')
    await userEvent.click(screen.getByRole('button', { name: 'Send' }))

    expect(feedback).toHaveBeenCalledWith({
      sean_ellis: 'very',
      text: '[exam] missing dark mode',
    })
    expect(screen.getByText(/Thanks/)).toBeInTheDocument()
  })

  it('will not send when nothing is entered', async () => {
    render(<FeedbackCard />)
    await userEvent.click(screen.getByRole('button', { name: /write to the author/i }))
    expect(screen.getByRole('button', { name: 'Send' })).toBeDisabled()
  })
})
