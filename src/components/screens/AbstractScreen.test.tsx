import { describe, it, expect, vi } from 'vitest'
import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { AbstractScreen } from './AbstractScreen'
import { makeRng } from '@/domain/rng'
import { buildAbstractTest } from '@/domain/reasoning/abstract'

describe('AbstractScreen — abstract reasoning', () => {
  it('states the official format and offers Czech, Slovak and English instructions', async () => {
    render(<AbstractScreen seed={5} onExit={() => {}} />)
    await userEvent.click(screen.getByRole('radio', { name: /english/i }))
    expect(screen.getByRole('heading', { name: /abstract reasoning/i })).toBeInTheDocument()
    expect(screen.getByText(/10 questions, 10 minutes/)).toBeInTheDocument()
    for (const name of [/čeština/i, /slovenčina/i, /english/i]) expect(screen.getByRole('radio', { name })).toBeInTheDocument()
  })

  it('runs a timed sitting in Czech: five figures, a gap, four figure options, no feedback', async () => {
    render(<AbstractScreen seed={5} onExit={() => {}} />)
    await userEvent.click(screen.getByRole('radio', { name: /čeština/i }))
    expect(screen.getByRole('heading', { name: /abstraktní uvažování/i })).toBeInTheDocument()
    await userEvent.click(screen.getByRole('button', { name: /začít/i }))
    expect(screen.getByRole('timer')).toHaveAccessibleName(/zbývající čas/i)
    expect(screen.getByText(/Otázka 1 z 10/)).toBeInTheDocument()
    const series = screen.getByRole('list', { name: /řada/i })
    expect(within(series).getAllByRole('img')).toHaveLength(5)
    const options = screen.getAllByRole('radio')
    expect(options).toHaveLength(4)
    expect(within(options[0].closest('label')!).getByRole('img')).toBeInTheDocument()
    await userEvent.click(options[0])
    expect(screen.queryByText(/porušuje/i)).not.toBeInTheDocument()
  })

  it('scores the sitting and explains each series, naming the rule a wrong answer broke', async () => {
    const onFinish = vi.fn()
    render(<AbstractScreen seed={5} onExit={() => {}} onFinish={onFinish} />)
    await userEvent.click(screen.getByRole('radio', { name: /english/i }))
    await userEvent.click(screen.getByRole('button', { name: /start/i }))
    for (let i = 0; i < 10; i++) {
      await userEvent.click(screen.getAllByRole('radio')[0])
      await userEvent.click(screen.getByRole('button', { name: i < 9 ? /next/i : /finish/i }))
    }
    const test = buildAbstractTest(makeRng(5))
    const expected = test.filter((s) => s.correct === 0).length
    expect(screen.getByTestId('abstract-score')).toHaveTextContent(new RegExp(`^${expected}\\s*of 10$`))
    expect(screen.getByText(/combined with the numerical test/i)).toBeInTheDocument()
    const solutions = screen.getAllByTestId('solution')
    expect(solutions).toHaveLength(10)
    expect(solutions[0]).toHaveTextContent(/at each step|repeats/)
    expect(screen.getAllByText(/This option breaks the rule for/)).toHaveLength(10 - expected)
    expect(onFinish).toHaveBeenCalledWith({ lang: 'en', score: expected, total: 10 })
  })
})
