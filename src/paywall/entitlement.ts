/**
 * Entitlement = "this account has paid for full access". Read-only on the client:
 * rows are written by the payment webhook (or by hand), never by the browser.
 * See docs/PAID-TIER.md for the table + RLS.
 */
export interface Entitlement {
  plan: string
  /** ISO timestamp; null = never expires. */
  expiresAt: string | null
}

export interface EntitlementSource {
  fetch(userId: string): Promise<Entitlement | null>
}

export function isEntitlementActive(e: Entitlement | null, now: number): boolean {
  if (!e) return false
  if (e.expiresAt === null) return true
  const t = Date.parse(e.expiresAt)
  return Number.isFinite(t) && now < t
}

/** Default when nothing is configured: nobody is entitled. */
export const noEntitlements: EntitlementSource = {
  async fetch() {
    return null
  },
}

/** Minimal slice of supabase-js used here — keeps this testable without the SDK. */
export interface EntitlementClient {
  from(table: string): {
    select(cols: string): {
      eq(col: string, v: string): {
        eq(col: string, v: string): {
          maybeSingle(): PromiseLike<{ data: unknown; error: unknown }>
        }
      }
    }
  }
}

const APP = 'epso'

/** Reads the caller's own row from `public.entitlements` (RLS: select own). Fails closed. */
export function supabaseEntitlements(client: EntitlementClient | null): EntitlementSource {
  return {
    async fetch(userId) {
      if (!client) return null
      try {
        const { data, error } = await client
          .from('entitlements')
          .select('plan, expires_at')
          .eq('user_id', userId)
          .eq('app', APP)
          .maybeSingle()
        if (error || !data) return null
        const row = data as { plan: string; expires_at: string | null }
        return { plan: row.plan, expiresAt: row.expires_at }
      } catch {
        return null
      }
    },
  }
}
