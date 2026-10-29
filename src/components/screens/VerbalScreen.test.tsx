import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { VerbalScreen } from './VerbalScreen'
import { makeRng } from '@/domain/rng'
import { buildVerbalTest, passageOf } from '@/domain/reasoning/verbal'

describe('VerbalScreen — verbal reasoning in language 1', () => {
  it('offers Czech, Slovak and English, with the official format and the EUR-Lex credit', async () => {
    render(<VerbalScreen seed={3} onExit={() => {}} />)
    await userEvent.click(screen.getByRole('radio', { name: /english/i }))
    expect(screen.getByRole('heading', { name: /verbal reasoning/i })).toBeInTheDocument()
    expect(screen.getByText(/20 questions, 35 minutes/)).toBeInTheDocument()
    expect(screen.getByText(/2011\/833\/EU/)).toBeInTheDocument()
    for (const name of [/čeština/i, /slovenčina/i, /english/i]) expect(screen.getByRole('radio', { name })).toBeInTheDocument()
  })

  it('runs a timed sitting in Slovak: the passage, its source, a statement and three choices, no feedback', async () => {
    render(<VerbalScreen seed={3} onExit={() => {}} />)
    await userEvent.click(screen.getByRole('radio', { name: /slovenčina/i }))
    await userEvent.click(screen.getByRole('button', { name: /začať/i }))
    const first = buildVerbalTest(makeRng(3))[0]
    expect(screen.getByRole('timer')).toHaveAccessibleName(/zostávajúci čas/i)
    expect(screen.getByText(/Otázka 1 z 20/)).toBeInTheDocument()
    expect(screen.getByText(passageOf(first).text.sk)).toBeInTheDocument()
    expect(screen.getByRole('link', { name: new RegExp(`CELEX ${passageOf(first).celex}`) })).toBeInTheDocument()
    expect(screen.getByText(first.statement.sk)).toBeInTheDocument()
    const options = screen.getAllByRole('radio')
    expect(options.map((o) => o.closest('label')?.textContent)).toEqual(['APravda', 'BNepravda', 'CNedá sa určiť'])
    await userEvent.click(options[0])
    expect(screen.queryByText(/správna odpoveď/i)).not.toBeInTheDocument()
  })

  it('scores the sitting and gives the reason for every statement', async () => {
    const onFinish = vi.fn()
    render(<VerbalScreen seed={3} onExit={() => {}} onFinish={onFinish} />)
    await userEvent.click(screen.getByRole('radio', { name: /english/i }))
    await userEvent.click(screen.getByRole('button', { name: /start/i }))
    for (let i = 0; i < 20; i++) {
      await userEvent.click(screen.getAllByRole('radio')[0])
      await userEvent.click(screen.getByRole('button', { name: i < 19 ? /next/i : /finish/i }))
    }
    const expected = buildVerbalTest(makeRng(3)).filter((it) => it.answer === 'true').length
    expect(screen.getByTestId('verbal-score')).toHaveTextContent(new RegExp(`^${expected}\\s*of 20$`))
    expect(screen.getByText(/Pass mark: 10\/20/)).toBeInTheDocument()
    expect(screen.getAllByTestId('solution')).toHaveLength(20)
    expect(onFinish).toHaveBeenCalledWith({ lang: 'en', score: expected, total: 20 })
  })
})
