import { describe, it, expect } from 'vitest'
import {
  isEntitlementActive,
  noEntitlements,
  supabaseEntitlements,
  type EntitlementClient,
} from './entitlement'

const NOW = Date.UTC(2026, 10, 1)

function fakeClient(result: { data: unknown; error: unknown }): {
  client: EntitlementClient
  calls: unknown[][]
} {
  const calls: unknown[][] = []
  const chain = {
    select: (...a: unknown[]) => (calls.push(['select', ...a]), chain),
    eq: (...a: unknown[]) => (calls.push(['eq', ...a]), chain),
    maybeSingle: async () => result,
  }
  return {
    client: { from: (t: string) => (calls.push(['from', t]), chain) },
    calls,
  }
}

describe('isEntitlementActive', () => {
  it('null is never active', () => {
    expect(isEntitlementActive(null, NOW)).toBe(false)
  })
  it('active until expiry, inactive after', () => {
    expect(isEntitlementActive({ plan: 'p', expiresAt: '2026-11-02T00:00:00Z' }, NOW)).toBe(true)
    expect(isEntitlementActive({ plan: 'p', expiresAt: '2026-10-31T00:00:00Z' }, NOW)).toBe(false)
  })
  it('an unparseable expiry is treated as inactive (fail closed)', () => {
    expect(isEntitlementActive({ plan: 'p', expiresAt: 'soon' }, NOW)).toBe(false)
  })
})

describe('entitlement sources', () => {
  it('noEntitlements always answers null', async () => {
    expect(await noEntitlements.fetch('u1')).toBeNull()
  })

  it('supabaseEntitlements reads the user’s epso row and maps it', async () => {
    const { client, calls } = fakeClient({
      data: { plan: 'exam-pass', expires_at: '2027-03-31T23:59:59Z' },
      error: null,
    })
    const e = await supabaseEntitlements(client).fetch('u1')
    expect(e).toEqual({ plan: 'exam-pass', expiresAt: '2027-03-31T23:59:59Z' })
    expect(calls).toContainEqual(['from', 'entitlements'])
    expect(calls).toContainEqual(['eq', 'user_id', 'u1'])
    expect(calls).toContainEqual(['eq', 'app', 'epso'])
  })

  it('no row → null', async () => {
    const { client } = fakeClient({ data: null, error: null })
    expect(await supabaseEntitlements(client).fetch('u1')).toBeNull()
  })

  it('a backend error (e.g. table not created yet) → null, never a throw', async () => {
    const { client } = fakeClient({ data: null, error: { message: 'relation does not exist' } })
    expect(await supabaseEntitlements(client).fetch('u1')).toBeNull()
  })

  it('no client configured → null', async () => {
    expect(await supabaseEntitlements(null).fetch('u1')).toBeNull()
  })
})
