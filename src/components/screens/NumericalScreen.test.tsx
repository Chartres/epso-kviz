import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { NumericalScreen } from './NumericalScreen'

describe('NumericalScreen — numerical reasoning in language 1', () => {
  it('offers Czech, Slovak and English, with the official format stated', () => {
    render(<NumericalScreen seed={3} onExit={() => {}} />)
    expect(screen.getByRole('heading', { name: /numerical reasoning/i })).toBeInTheDocument()
    expect(screen.getByText(/10 questions, 20 minutes/)).toBeInTheDocument()
    for (const name of [/čeština/i, /slovenčina/i, /english/i]) expect(screen.getByRole('radio', { name })).toBeInTheDocument()
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
    expect(screen.getByText(/of 10/)).toBeInTheDocument()
    expect(screen.getByText(/combined with the abstract test/i)).toBeInTheDocument()
    expect(screen.getAllByTestId('solution')).toHaveLength(10)
    expect(onFinish).toHaveBeenCalledWith(expect.objectContaining({ lang: 'en', total: 10 }))
  })
})
