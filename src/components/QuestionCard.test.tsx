import { describe, it, expect, vi } from 'vitest'
import { act, render, screen } from '@testing-library/react'
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

  it('shows the cited source with the verbatim quote and a EUR-Lex link', () => {
    const cited: Question = {
      ...Q,
      sources: [{ doc: 'ai-act', ref: 'Art 99(3)', quote: 'shall be subject to administrative fines of up to EUR 35 000 000' }],
      verified: '2026-10-25',
    }
    setup({ question: cited, chosen: 'b' })
    const link = screen.getByRole('link', { name: /AI Act, Art 99\(3\)/ })
    expect(link).toHaveAttribute('href', 'https://eur-lex.europa.eu/eli/reg/2024/1689/oj#art_99')
    expect(link).toHaveAttribute('target', '_blank')
    expect(screen.getByText(/administrative fines of up to EUR 35 000 000/)).toBeInTheDocument()
    expect(screen.getByText(/Checked against the official text on 2026-10-25/)).toBeInTheDocument()
  })

  it('hides partial sources on a question that is not verified', () => {
    const partial: Question = {
      ...Q,
      sources: [{ doc: 'dma', ref: 'Art 6(5)', quote: 'The gatekeeper shall not treat more favourably in ranking' }],
    }
    setup({ question: partial, chosen: 'b' })
    expect(screen.queryByRole('link')).not.toBeInTheDocument()
  })

  it('renders two quotes from the same article as two entries', () => {
    const twice: Question = {
      ...Q,
      sources: [
        { doc: 'ai-act', ref: 'Art 26(10)', quote: 'first passage of the same paragraph, long enough' },
        { doc: 'ai-act', ref: 'Art 26(10)', quote: 'second passage of the same paragraph, long enough' },
      ],
      verified: '2026-10-25',
    }
    setup({ question: twice, chosen: 'b' })
    expect(screen.getAllByRole('link', { name: /AI Act, Art 26\(10\)/ })).toHaveLength(2)
    expect(screen.getByText(/second passage/)).toBeInTheDocument()
  })

  it('shows no source block for an uncited question', () => {
    setup({ chosen: 'b' })
    expect(screen.queryByRole('link')).not.toBeInTheDocument()
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

describe('QuestionCard — question first', () => {
  const options = () => screen.queryByRole('group', { name: 'Answer options' })

  it('none: shows the options with the stem (as before)', () => {
    const onRecall = vi.fn()
    setup({ questionFirst: 'none', onRecall })
    expect(options()).toBeInTheDocument()
    expect(onRecall).not.toHaveBeenCalled()
  })

  it('A: holds the options until "Show the four options"; answer keys do nothing before', async () => {
    const onRecall = vi.fn()
    const { onAnswer } = setup({ questionFirst: 'a', onRecall })
    expect(screen.getByText(Q.q)).toBeInTheDocument()
    expect(options()).not.toBeInTheDocument()
    await userEvent.keyboard('2')
    expect(onAnswer).not.toHaveBeenCalled()
    await userEvent.click(screen.getByRole('button', { name: 'Show the four options' }))
    expect(options()).toBeInTheDocument()
    expect(onRecall).toHaveBeenCalledWith({ mode: 'a' })
    await userEvent.keyboard('2')
    expect(onAnswer).toHaveBeenCalledWith('b')
  })

  it('A: Enter shows the options', async () => {
    setup({ questionFirst: 'a' })
    await userEvent.keyboard('{Enter}')
    expect(options()).toBeInTheDocument()
  })

  it('B: write first, compare, and the words sit beside the key in the feedback', async () => {
    const onRecall = vi.fn()
    const { onAnswer } = setup({ questionFirst: 'b', onRecall })
    expect(options()).not.toBeInTheDocument()
    const box = screen.getByLabelText('Your answer, in a few words')
    // Typing letters a–d into the box must not answer the question.
    await userEvent.type(box, 'drift in the inputs')
    expect(onAnswer).not.toHaveBeenCalled()
    await userEvent.click(screen.getByRole('button', { name: 'Compare with the options' }))
    expect(options()).toBeInTheDocument()
    expect(onRecall).toHaveBeenCalledWith({ mode: 'b', wrote: true })
  })

  it('B: shows your words in the feedback once answered', async () => {
    const onAnswer = vi.fn()
    const { rerender } = render(
      <QuestionCard
        question={Q}
        reveal
        bookmarked={false}
        index={0}
        total={10}
        onAnswer={onAnswer}
        onNext={vi.fn()}
        onToggleBookmark={vi.fn()}
        questionFirst="b"
      />,
    )
    await userEvent.type(screen.getByLabelText('Your answer, in a few words'), 'drift')
    await userEvent.click(screen.getByRole('button', { name: 'Compare with the options' }))
    rerender(
      <QuestionCard
        question={Q}
        reveal
        chosen="b"
        bookmarked={false}
        index={0}
        total={10}
        onAnswer={onAnswer}
        onNext={vi.fn()}
        onToggleBookmark={vi.fn()}
        questionFirst="b"
      />,
    )
    expect(screen.getByText('Your words:')).toBeInTheDocument()
    expect(screen.getByText('drift')).toBeInTheDocument()
  })

  it('B: comparing with an empty box is allowed and recorded as not written', async () => {
    const onRecall = vi.fn()
    setup({ questionFirst: 'b', onRecall })
    await userEvent.click(screen.getByRole('button', { name: 'Compare with the options' }))
    expect(onRecall).toHaveBeenCalledWith({ mode: 'b', wrote: false })
    expect(screen.queryByText('Your words:')).not.toBeInTheDocument()
  })

  it('C: the options appear on their own after the hold', () => {
    vi.useFakeTimers()
    try {
      const onRecall = vi.fn()
      setup({ questionFirst: 'c', onRecall })
      expect(options()).not.toBeInTheDocument()
      expect(screen.getByRole('status')).toHaveTextContent('Options in 8 s')
      for (let i = 0; i < 8; i++) act(() => vi.advanceTimersByTime(1000))
      expect(options()).toBeInTheDocument()
      expect(onRecall).toHaveBeenCalledTimes(1)
      expect(onRecall).toHaveBeenCalledWith({ mode: 'c' })
    } finally {
      vi.useRealTimers()
    }
  })

  it('an answered question always shows its options', () => {
    setup({ questionFirst: 'a', chosen: 'b' })
    expect(options()).toBeInTheDocument()
  })
})
