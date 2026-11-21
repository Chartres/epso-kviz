import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { reloadOnce } from './reloadOnce'

const KEY = 'chunk-reload'
const mod = { ok: true }
const fallback = { ok: false }
const fail = () => Promise.reject(new Error('chunk gone'))

beforeEach(() => sessionStorage.clear())

describe('reloadOnce', () => {
  it('a stale chunk reloads once', () => {
    const reload = vi.fn()
    void reloadOnce(fail, KEY, fallback, reload)
    return Promise.resolve().then(() => {
      expect(reload).toHaveBeenCalledTimes(1)
    })
  })

  it('a load after the reload clears the flag, so a later stale chunk reloads again', async () => {
    sessionStorage.setItem(KEY, '1')
    expect(await reloadOnce(() => Promise.resolve(mod), KEY, fallback, vi.fn())).toBe(mod)
    const reload = vi.fn()
    void reloadOnce(fail, KEY, fallback, reload)
    await Promise.resolve()
    expect(reload).toHaveBeenCalledTimes(1)
  })

  it('a failure right after the reload resolves to the fallback instead of throwing', async () => {
    sessionStorage.setItem(KEY, '1')
    const reload = vi.fn()
    expect(await reloadOnce(fail, KEY, fallback, reload)).toBe(fallback)
    expect(reload).not.toHaveBeenCalled()
  })

  describe('with site storage blocked (sessionStorage access throws)', () => {
    const original = Object.getOwnPropertyDescriptor(window, 'sessionStorage')!
    beforeEach(() =>
      Object.defineProperty(window, 'sessionStorage', {
        configurable: true,
        get() {
          throw new DOMException('blocked', 'SecurityError')
        },
      }),
    )
    afterEach(() => Object.defineProperty(window, 'sessionStorage', original))

    it('a load still resolves to the module', async () => {
      expect(await reloadOnce(() => Promise.resolve(mod), KEY, fallback, vi.fn())).toBe(mod)
    })

    it('a stale chunk resolves to the fallback without reloading (no flag to stop a reload loop)', async () => {
      const reload = vi.fn()
      expect(await reloadOnce(fail, KEY, fallback, reload)).toBe(fallback)
      expect(reload).not.toHaveBeenCalled()
    })
  })
})
