import { describe, it, expect, vi } from 'vitest'
import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Commonplace } from './Commonplace'
import { emptyProgress } from '@/domain/progress'
import { setCollected } from '@/domain/commonplace'
import { ALL_QUESTIONS } from '@/domain/questions'

const q = ALL_QUESTIONS.find((x) => x.verified && x.sources?.[0].doc === 'ai-act')!

describe('Commonplace', () => {
  it('when empty, explains what it is for and how to fill it', () => {
    render(<Commonplace progress={emptyProgress()} onRemove={() => {}} />)
    expect(screen.getByRole('heading', { name: /my commonplace book/i })).toBeInTheDocument()
    expect(screen.getByText(/copy to my commonplace book/i)).toBeInTheDocument()
  })

  it('lists collected passages under their act, with the reference and the case', async () => {
    const onRemove = vi.fn()
    const p = setCollected(emptyProgress(), q.sources![0], q.id, true, 1)
    render(<Commonplace progress={p} onRemove={onRemove} />)
    const act = screen.getByRole('region', { name: /Regulation \(EU\) 2024\/1689/ })
    expect(within(act).getByText(q.sources![0].quote)).toBeInTheDocument()
    expect(within(act).getByText(new RegExp(q.sources![0].ref.replace(/[()]/g, '\\$&')))).toBeInTheDocument()
    expect(within(act).getByText(q.q)).toBeInTheDocument()
    await userEvent.click(within(act).getByRole('button', { name: /remove/i }))
    expect(onRemove).toHaveBeenCalledWith(expect.objectContaining({ doc: q.sources![0].doc, quote: q.sources![0].quote }))
  })
})
