/**
 * Payment provider seam. The app only ever needs one thing from a provider: a
 * hosted checkout URL that carries the user id, so the provider's webhook (or
 * Pavol, by hand) can grant the entitlement to the right account. No SDKs, no
 * keys in the client.
 */
export interface CheckoutRequest {
  userId: string
  email?: string
  plan: string
}

export interface PaymentProvider {
  id: string
  /** False until a checkout URL is configured — the UI then says "not on sale yet". */
  ready: boolean
  checkoutUrl(req: CheckoutRequest): string | null
}

export const stubProvider: PaymentProvider = {
  id: 'stub',
  ready: false,
  checkoutUrl: () => null,
}

/**
 * Any hosted checkout link with placeholders: {user_id}, {email}, {plan}.
 * Lemon Squeezy: …/checkout/buy/<id>?checkout[custom][user_id]={user_id}&checkout[email]={email}
 * Stripe Payment Link: …/<id>?client_reference_id={user_id}&prefilled_email={email}
 */
export function linkProvider(template: string): PaymentProvider {
  return {
    id: 'link',
    ready: true,
    checkoutUrl({ userId, email, plan }) {
      if (!userId) return null
      return template
        .replaceAll('{user_id}', encodeURIComponent(userId))
        .replaceAll('{email}', encodeURIComponent(email ?? ''))
        .replaceAll('{plan}', encodeURIComponent(plan))
    },
  }
}

export function providerFromEnv(env: Record<string, unknown>): PaymentProvider {
  const t = env.VITE_CHECKOUT_URL
  if (typeof t === 'string' && t.startsWith('https://')) return linkProvider(t)
  return stubProvider
}
