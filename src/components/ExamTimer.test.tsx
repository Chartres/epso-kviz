import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, act } from '@testing-library/react'
import { ExamTimer } from './ExamTimer'

describe('ExamTimer', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })
  afterEach(() => {
    vi.useRealTimers()
  })

  it('displays remaining time formatted as m:ss', () => {
    const endsAt = Date.now() + 90_000 // 1m 30s
    render(<ExamTimer endsAt={endsAt} onExpire={vi.fn()} />)
    expect(screen.getByRole('timer')).toHaveTextContent('1:30')
  })

  it('applies urgent styling when 5 minutes or less remain', () => {
    const endsAt = Date.now() + 5 * 60 * 1000
    render(<ExamTimer endsAt={endsAt} onExpire={vi.fn()} />)
    expect(screen.getByRole('timer').className).toMatch(/rust/)
  })

  it('does not apply urgent styling when more than 5 minutes remain', () => {
    const endsAt = Date.now() + 5 * 60 * 1000 + 1000
    render(<ExamTimer endsAt={endsAt} onExpire={vi.fn()} />)
    expect(screen.getByRole('timer').className).not.toMatch(/rust/)
  })

  it('calls onExpire once the countdown reaches zero', () => {
    const onExpire = vi.fn()
    const endsAt = Date.now() + 2000
    render(<ExamTimer endsAt={endsAt} onExpire={onExpire} />)
    expect(onExpire).not.toHaveBeenCalled()
    act(() => { vi.advanceTimersByTime(3000) })
    expect(onExpire).toHaveBeenCalled()
  })

  it('shows 0:00 and does not go negative after expiry', () => {
    const onExpire = vi.fn()
    const endsAt = Date.now() + 1000
    render(<ExamTimer endsAt={endsAt} onExpire={onExpire} />)
    act(() => { vi.advanceTimersByTime(5000) })
    expect(screen.getByRole('timer')).toHaveTextContent('0:00')
  })
})
