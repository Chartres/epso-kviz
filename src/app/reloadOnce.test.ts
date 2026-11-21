import { describe, it, expect, vi, beforeEach } from 'vitest'
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
})
