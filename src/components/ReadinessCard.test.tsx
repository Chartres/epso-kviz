import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { ReadinessCard } from './ReadinessCard'
import { emptyProgress, recordAnswer, type ProgressData } from '@/domain/progress'
import { byCategory, CATEGORY_NAMES } from '@/domain/questions'
import { MIN_FIRST_ATTEMPTS } from '@/domain/readiness'

function practise(n: number, right: (i: number) => boolean): ProgressData {
  let p = emptyProgress()
  for (const cat of CATEGORY_NAMES)
    byCategory(cat)
      .slice(0, n)
      .forEach((q, i) => (p = recordAnswer(p, q.id, right(i), i + 1)))
  return p
}

describe('ReadinessCard', () => {
  it('without enough first tries, says how many new questions each category still needs', () => {
    render(<ReadinessCard progress={emptyProgress()} />)
    expect(screen.getByRole('heading', { name: /likely score on a fresh paper/i })).toBeInTheDocument()
    expect(screen.getAllByText(new RegExp(`${MIN_FIRST_ATTEMPTS} more new`))).toHaveLength(3)
    expect(screen.getByText(/only first tries count/i)).toBeInTheDocument()
  })

  it('with enough evidence, shows the 80% range, the chance of 15/30 and the ranking rule', () => {
    render(<ReadinessCard progress={practise(12, (i) => i % 3 !== 0)} />)
    const range = screen.getByTestId('readiness-range')
    expect(range.textContent).toMatch(/^\d{1,2}–\d{1,2}$/)
    expect(screen.getByText(/chance of reaching 15\/30/i)).toBeInTheDocument()
    expect(screen.getByText(/about 360/)).toBeInTheDocument()
    expect(screen.getByText(/does not publish the cut-off/i)).toBeInTheDocument()
    expect(screen.getAllByText(/8 of 12 first tries/)).toHaveLength(3)
  })
})
