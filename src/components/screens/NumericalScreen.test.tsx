import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { NumericalScreen } from './NumericalScreen'
import { makeRng } from '@/domain/rng'
import { buildNumericalTest } from '@/domain/reasoning/numerical'

describe('NumericalScreen — numerical reasoning in language 1', () => {
  it('offers Czech, Slovak and English, with the official format stated', async () => {
    render(<NumericalScreen seed={3} onExit={() => {}} />)
    await userEvent.click(screen.getByRole('radio', { name: /english/i }))
    expect(screen.getByRole('heading', { name: /numerical reasoning/i })).toBeInTheDocument()
    expect(screen.getByText(/10 questions, 20 minutes/)).toBeInTheDocument()
    for (const name of [/čeština/i, /slovenčina/i, /english/i]) expect(screen.getByRole('radio', { name })).toBeInTheDocument()
  })

  it('translates the start screen and the timer label into the chosen language', async () => {
    render(<NumericalScreen seed={3} onExit={() => {}} />)
    await userEvent.click(screen.getByRole('radio', { name: /slovenčina/i }))
    expect(screen.getByRole('heading', { name: /numerické uvažovanie/i })).toBeInTheDocument()
    await userEvent.click(screen.getByRole('button', { name: /začať/i }))
    expect(screen.getByRole('timer')).toHaveAccessibleName(/zostávajúci čas/i)
  })

  it('runs a timed sitting in Czech: table, question, four options, no feedback until the end', async () => {
    render(<NumericalScreen seed={3} onExit={() => {}} />)
    await userEvent.click(screen.getByRole('radio', { name: /čeština/i }))
    await userEvent.click(screen.getByRole('button', { name: /začít/i }))
    expect(screen.getByRole('timer')).toBeInTheDocument()
    expect(screen.getByRole('table')).toBeInTheDocument()
    expect(screen.getByText(/Otázka 1 z 10/)).toBeInTheDocument()
    const options = screen.getAllByRole('radio')
    expect(options).toHaveLength(4)
    await userEvent.click(options[0])
    expect(screen.queryByText(/správně|chybně/i)).not.toBeInTheDocument()
  })

  it('scores the sitting and shows a worked solution for every item', async () => {
    const onFinish = vi.fn()
    render(<NumericalScreen seed={3} onExit={() => {}} onFinish={onFinish} />)
    await userEvent.click(screen.getByRole('radio', { name: /english/i }))
    await userEvent.click(screen.getByRole('button', { name: /start/i }))
    for (let i = 0; i < 10; i++) {
      await userEvent.click(screen.getAllByRole('radio')[0])
      await userEvent.click(screen.getByRole('button', { name: i < 9 ? /next/i : /finish/i }))
    }
    const expected = buildNumericalTest(makeRng(3), 'en').filter((it) => it.correct === 0).length
    expect(screen.getByTestId('numerical-score')).toHaveTextContent(new RegExp(`^${expected}\\s*of 10$`))
    expect(screen.getByText(/combined with the abstract test/i)).toBeInTheDocument()
    expect(screen.getAllByTestId('solution')).toHaveLength(10)
    expect(onFinish).toHaveBeenCalledWith({ lang: 'en', score: expected, total: 10 })
  })
})
