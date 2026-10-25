import { describe, it, expect } from 'vitest'
import { stubProvider, linkProvider, providerFromEnv } from './payments'

describe('payment providers', () => {
  it('the stub is never ready and never produces a checkout URL', () => {
    expect(stubProvider.ready).toBe(false)
    expect(stubProvider.checkoutUrl({ userId: 'u1', plan: 'exam-pass' })).toBeNull()
  })

  it('a link provider fills the template with URL-encoded values', () => {
    const p = linkProvider('https://pay.example/buy/abc?ref={user_id}&email={email}&p={plan}')
    expect(p.ready).toBe(true)
    expect(
      p.checkoutUrl({ userId: 'u 1', email: 'a+b@x.eu', plan: 'exam-pass' }),
    ).toBe('https://pay.example/buy/abc?ref=u%201&email=a%2Bb%40x.eu&p=exam-pass')
  })

  it('a missing email becomes an empty value, not "undefined"', () => {
    const p = linkProvider('https://pay.example/?ref={user_id}&email={email}')
    expect(p.checkoutUrl({ userId: 'u1', plan: 'exam-pass' })).toBe(
      'https://pay.example/?ref=u1&email=',
    )
  })

  it('a checkout without a user id is refused (the purchase could not be matched)', () => {
    const p = linkProvider('https://pay.example/?ref={user_id}')
    expect(p.checkoutUrl({ userId: '', plan: 'exam-pass' })).toBeNull()
  })

  it('providerFromEnv: no template → stub; https template → link; anything else → stub', () => {
    expect(providerFromEnv({}).ready).toBe(false)
    expect(providerFromEnv({ VITE_CHECKOUT_URL: 'https://pay.example/?r={user_id}' }).ready).toBe(true)
    expect(providerFromEnv({ VITE_CHECKOUT_URL: 'javascript:alert(1)' }).ready).toBe(false)
  })
})
