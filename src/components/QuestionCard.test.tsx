import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { QuestionCard } from './QuestionCard'
import type { Question } from '@/domain/types'

const Q: Question = {
  id: 1,
  cat: 'AI Engineering & Operations',
  q: 'A model that performs well in validation but degrades after deployment, with input distributions visibly shifted, shows:',
  a: 'Overfitting',
  b: 'Data drift',
  c: 'Label leakage',
  d: 'Catastrophic forgetting',
  correct: 'b',
  explain: 'The input distribution changed after deployment — that is data (covariate) drift.',
}

function setup(props: Partial<Parameters<typeof QuestionCard>[0]> = {}) {
  const onAnswer = vi.fn()
  const onNext = vi.fn()
  const onToggleBookmark = vi.fn()
  render(
    <QuestionCard
      question={Q}
      reveal
      bookmarked={false}
      index={0}
      total={10}
      onAnswer={onAnswer}
      onNext={onNext}
      onToggleBookmark={onToggleBookmark}
      {...props}
    />,
  )
  return { onAnswer, onNext, onToggleBookmark }
}

describe('QuestionCard', () => {
  it('renders the stem and four options', () => {
    setup()
    expect(screen.getByText(Q.q)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /^aOverfitting/ })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /^bData drift/ })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /^cLabel leakage/ })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /^dCatastrophic forgetting/ })).toBeInTheDocument()
  })

  it('calls onAnswer with the chosen option', async () => {
    const { onAnswer } = setup()
    await userEvent.click(screen.getByRole('button', { name: /Data drift/ }))
    expect(onAnswer).toHaveBeenCalledWith('b')
  })

  it('supports keyboard selection (1/2/3/4)', async () => {
    const { onAnswer } = setup()
    await userEvent.keyboard('2')
    expect(onAnswer).toHaveBeenCalledWith('b')
  })

  it('supports keyboard selection by letter (a/b/c/d, case-insensitive)', async () => {
    const { onAnswer } = setup()
    await userEvent.keyboard('c')
    expect(onAnswer).toHaveBeenCalledWith('c')
    await userEvent.keyboard('D')
    expect(onAnswer).toHaveBeenCalledWith('d')
  })

  it('reveals the correct answer after a wrong choice (control of error)', () => {
    setup({ chosen: 'a' })
    // the correct option is marked, regardless of what was chosen
    const correct = screen.getByRole('button', { name: /^bData drift/ })
    expect(correct).toHaveAttribute('data-state', 'correct')
    const wrong = screen.getByRole('button', { name: /^aOverfitting/ })
    expect(wrong).toHaveAttribute('data-state', 'wrong')
    expect(screen.getByText('✓ Correct answer')).toBeInTheDocument()
  })

  it('shows the explain rationale once answered in reveal mode', () => {
    setup({ chosen: 'a' })
    expect(screen.getByText(Q.explain)).toBeInTheDocument()
  })

  it('does not show the explain rationale in exam mode', () => {
    setup({ chosen: 'a', reveal: false })
    expect(screen.queryByText(Q.explain)).not.toBeInTheDocument()
  })

  it('locks options once answered', () => {
    setup({ chosen: 'b' })
    expect(screen.getByRole('button', { name: /^aOverfitting/ })).toBeDisabled()
  })

  it('does NOT reveal correctness in exam mode', () => {
    setup({ chosen: 'a', reveal: false })
    const correct = screen.getByRole('button', { name: /^bData drift/ })
    expect(correct).not.toHaveAttribute('data-state', 'correct')
    // chosen option is merely selected
    expect(screen.getByRole('button', { name: /^aOverfitting/ })).toHaveAttribute(
      'data-state',
      'selected',
    )
    expect(screen.queryByText(/correct answer/i)).not.toBeInTheDocument()
  })

  it('toggles the bookmark', async () => {
    const { onToggleBookmark } = setup()
    await userEvent.click(screen.getByRole('button', { name: /bookmark/i }))
    expect(onToggleBookmark).toHaveBeenCalled()
  })
})
