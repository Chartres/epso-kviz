import { describe, it, expect, afterEach } from 'vitest'
import { track, feedback, logError } from './analytics'

describe('analytics wrapper', () => {
  const original = Object.getOwnPropertyDescriptor(window, 'localStorage')!
  afterEach(() => Object.defineProperty(window, 'localStorage', original))

  it('does not throw when site storage is blocked (SecurityError on access)', () => {
    Object.defineProperty(window, 'localStorage', {
      configurable: true,
      get() {
        throw new DOMException('blocked', 'SecurityError')
      },
    })
    expect(() => track('app_open')).not.toThrow()
    expect(() => feedback({ sean_ellis: 'very' })).not.toThrow()
    expect(() => logError(new Error('x'))).not.toThrow()
  })
})
