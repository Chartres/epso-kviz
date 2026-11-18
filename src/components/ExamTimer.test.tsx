import { describe, it, expect, vi, afterEach } from 'vitest'
import { render, act } from '@testing-library/react'
import { ExamTimer } from './ExamTimer'

describe('ExamTimer', () => {
  afterEach(() => {
    vi.useRealTimers()
  })

  it('calls onExpire when remaining time reaches zero', () => {
    vi.useFakeTimers()
    const now = Date.now()
    const onExpire = vi.fn()
    render(<ExamTimer endsAt={now + 2000} onExpire={onExpire} />)
    expect(onExpire).not.toHaveBeenCalled()
    // Advance past the end time — the interval fires setNow, remaining becomes <= 0
    act(() => {
      vi.advanceTimersByTime(3000)
    })
    expect(onExpire).toHaveBeenCalled()
  })

  it('does not call onExpire before time is up', () => {
    vi.useFakeTimers()
    const now = Date.now()
    const onExpire = vi.fn()
    render(<ExamTimer endsAt={now + 10_000} onExpire={onExpire} />)
    act(() => {
      vi.advanceTimersByTime(5000)
    })
    expect(onExpire).not.toHaveBeenCalled()
  })

  it('resets fired ref when endsAt changes, allowing onExpire to fire again', () => {
    vi.useFakeTimers()
    const now = Date.now()
    const onExpire = vi.fn()
    const { rerender } = render(<ExamTimer endsAt={now + 2000} onExpire={onExpire} />)
    act(() => { vi.advanceTimersByTime(3000) })
    expect(onExpire).toHaveBeenCalledTimes(1)
    // New exam session: endsAt moves to the future; fired ref must be cleared.
    rerender(<ExamTimer endsAt={now + 20_000} onExpire={onExpire} />)
    act(() => { vi.advanceTimersByTime(20_000) })
    expect(onExpire).toHaveBeenCalledTimes(2)
  })
})
