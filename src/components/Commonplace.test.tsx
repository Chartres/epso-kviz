import { describe, it, expect, vi } from 'vitest'
import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Commonplace } from './Commonplace'
import { emptyProgress } from '@/domain/progress'
import { setCollected } from '@/domain/commonplace'
import { ALL_QUESTIONS } from '@/domain/questions'

const track = vi.fn()
vi.mock('@/analytics', () => ({ track: (...a: unknown[]) => track(...a) }))

const q = ALL_QUESTIONS.find((x) => x.verified && x.sources?.[0].doc === 'ai-act')!

describe('Commonplace', () => {
  it('when empty, explains what it is for and how to fill it', () => {
    render(<Commonplace progress={emptyProgress()} onRemove={() => {}} open={false} onToggle={() => {}} />)
    expect(screen.getByRole('heading', { name: /my commonplace book/i })).toBeInTheDocument()
    expect(screen.getByText(/copy to my commonplace book/i)).toBeInTheDocument()
  })

  it('lists collected passages under their act, with the reference and the case', async () => {
    const onRemove = vi.fn()
    const p = setCollected(emptyProgress(), q.sources![0], q.id, true, 1)
    render(<Commonplace progress={p} onRemove={onRemove} open onToggle={() => {}} />)
    const act = screen.getByRole('region', { name: /Regulation \(EU\) 2024\/1689/ })
    expect(within(act).getByText(q.sources![0].quote)).toBeInTheDocument()
    expect(within(act).getByText(new RegExp(q.sources![0].ref.replace(/[()]/g, '\\$&')))).toBeInTheDocument()
    expect(within(act).getByText(q.q)).toBeInTheDocument()
    await userEvent.click(within(act).getByRole('button', { name: /remove/i }))
    expect(onRemove).toHaveBeenCalledWith(expect.objectContaining({ doc: q.sources![0].doc, quote: q.sources![0].quote }))
  })

  it('reports opening a cited source as key_action source_open', async () => {
    const c = q.sources![0]
    render(<Commonplace progress={setCollected(emptyProgress(), c, q.id, true, 1)} onRemove={() => {}} open onToggle={() => {}} />)
    const link = screen.getByRole('link', { name: new RegExp(c.ref.replace(/[()]/g, '\\$&')) })
    link.addEventListener('click', (e) => e.preventDefault())
    await userEvent.click(link)
    expect(track).toHaveBeenCalledWith('key_action', { action: 'source_open', doc: c.doc, ref: c.ref, from: 'commonplace' })
  })

  // Pavol, 2026-10-30: keep it, but it must not crowd out the guide. Folded by default.
  it('when folded, shows the heading and the count, not the passages', async () => {
    const onToggle = vi.fn()
    const p = setCollected(emptyProgress(), q.sources![0], q.id, true, 1)
    render(<Commonplace progress={p} onRemove={() => {}} open={false} onToggle={onToggle} />)
    const toggle = screen.getByRole('button', { name: /my commonplace book.*1 passage/i })
    expect(toggle).toHaveAttribute('aria-expanded', 'false')
    expect(screen.queryByText(q.sources![0].quote)).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /copy all as text/i })).not.toBeInTheDocument()
    await userEvent.click(toggle)
    expect(onToggle).toHaveBeenCalledTimes(1)
  })

  it('when open, says so on the toggle', () => {
    const p = setCollected(emptyProgress(), q.sources![0], q.id, true, 1)
    render(<Commonplace progress={p} onRemove={() => {}} open onToggle={() => {}} />)
    expect(screen.getByRole('button', { name: /my commonplace book/i })).toHaveAttribute('aria-expanded', 'true')
    expect(screen.getByRole('button', { name: /copy all as text/i })).toBeInTheDocument()
  })
})
