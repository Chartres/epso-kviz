import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { SourceNote } from './SourceNote'
import type { Question } from '@/domain/types'

const track = vi.fn()
vi.mock('@/analytics', () => ({ track: (...a: unknown[]) => track(...a) }))

const Q: Question = {
  id: 1041,
  cat: 'AI Act & Governance',
  q: 'The top penalty bracket in the AI Act is:',
  a: 'a',
  b: 'b',
  c: 'c',
  d: 'd',
  correct: 'a',
  explain: 'Art 99(3).',
  sources: [
    { doc: 'ai-act', ref: 'Art 99(3)', quote: 'administrative fines of up to EUR 35 000 000' },
    { doc: 'ai-act', ref: 'Art 99(5)', quote: 'administrative fines of up to EUR 7 500 000' },
  ],
  verified: '2026-10-25',
}

describe('SourceNote — commonplace book', () => {
  it('offers to copy each passage into the commonplace book and reports which one', async () => {
    const onCollect = vi.fn()
    render(<SourceNote question={Q} collected={[]} onCollect={onCollect} />)
    const buttons = screen.getAllByRole('button', { name: /copy to my commonplace book/i })
    expect(buttons).toHaveLength(2)
    await userEvent.click(buttons[1])
    expect(onCollect).toHaveBeenCalledWith(1)
  })

  it('marks a collected passage and lets it be removed', () => {
    render(<SourceNote question={Q} collected={[0]} onCollect={() => {}} />)
    const done = screen.getByRole('button', { name: /in my commonplace book/i })
    expect(done).toHaveAttribute('aria-pressed', 'true')
  })

  it('shows no collect buttons when no handler is given (read-only contexts)', () => {
    render(<SourceNote question={Q} />)
    expect(screen.queryByRole('button')).not.toBeInTheDocument()
  })

  it('reports opening a cited source as key_action source_open', async () => {
    render(<SourceNote question={Q} />)
    const link = screen.getByRole('link', { name: /Art 99\(5\)/ })
    link.addEventListener('click', (e) => e.preventDefault())
    await userEvent.click(link)
    expect(track).toHaveBeenCalledWith('key_action', { action: 'source_open', doc: 'ai-act', ref: 'Art 99(5)', q: 1041, from: 'answer' })
  })
})
