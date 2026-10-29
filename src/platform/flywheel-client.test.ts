import { describe, expect, it, vi } from 'vitest'
import { createFlywheelClient, isAutomatedBrowser, type SupabaseLike } from './flywheel-client'

function fakeSupabase() {
  const insert = vi.fn(() => Promise.resolve())
  const sb = { from: vi.fn(() => ({ insert })) } as unknown as SupabaseLike
  return { sb, insert }
}

describe('isAutomatedBrowser', () => {
  it('flags webdriver (Playwright, CI) and bot or headless user agents', () => {
    expect(isAutomatedBrowser({ webdriver: true, userAgent: 'Mozilla/5.0' })).toBe(true)
    expect(isAutomatedBrowser({ userAgent: 'Mozilla/5.0 (compatible; Googlebot/2.1)' })).toBe(true)
    expect(isAutomatedBrowser({ userAgent: 'Mozilla/5.0 HeadlessChrome/131.0' })).toBe(true)
    expect(isAutomatedBrowser({ userAgent: 'Chrome-Lighthouse' })).toBe(true)
  })

  it('lets a person through', () => {
    expect(isAutomatedBrowser({ webdriver: false, userAgent: 'Mozilla/5.0 (iPhone) Safari/604.1' })).toBe(false)
    expect(isAutomatedBrowser(undefined)).toBe(false)
  })
})

describe('createFlywheelClient', () => {
  it('drops events from an automated browser', () => {
    const { sb, insert } = fakeSupabase()
    createFlywheelClient({ app: 'x', supabase: sb, isAutomated: () => true }).track('app_open')
    expect(insert).not.toHaveBeenCalled()
  })

  it('inserts events from a person', () => {
    const { sb, insert } = fakeSupabase()
    createFlywheelClient({ app: 'x', supabase: sb, isAutomated: () => false }).track('app_open', { a: 1 })
    expect(insert).toHaveBeenCalledWith(expect.objectContaining({ app: 'x', event: 'app_open', props: { a: 1 } }))
  })
})
