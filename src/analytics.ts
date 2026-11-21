import { supabase } from './auth/supabase'
import {
  createFlywheelClient,
  type SupabaseLike,
} from './platform/flywheel-client'

/**
 * Usage tracking via the Flywheel Common Platform client (shared across all
 * flywheel apps — see flywheel repo docs/ARCHITECTURE "Common Platform").
 * Same first-party, cookieless, fire-and-forget posture as before; now events
 * also carry a cross-product `flywheel_uid` once the user signs in (identify()).
 * No-ops when Supabase isn't configured (local/tests).
 */

// Preserve visitor-id continuity: the bespoke client used zk:vid/zk:sid; the
// shared client uses fw:vid/fw:sid. Copy the existing ids across once so we
// don't reset unique-visitor counts on first load after the refactor.
function migrateLegacyIds() {
  try {
    if (typeof localStorage !== 'undefined') {
      const legacy = localStorage.getItem('zk:vid')
      if (legacy && !localStorage.getItem('fw:vid')) localStorage.setItem('fw:vid', legacy)
    }
    if (typeof sessionStorage !== 'undefined') {
      const legacy = sessionStorage.getItem('zk:sid')
      if (legacy && !sessionStorage.getItem('fw:sid')) sessionStorage.setItem('fw:sid', legacy)
    }
  } catch {
    // storage blocked — the client falls back to 'anon'
  }
}
migrateLegacyIds()

const fw = createFlywheelClient({
  app: 'epso-kviz',
  supabase: supabase as unknown as SupabaseLike | null,
})

// The vendored client reads storage outside its own try (resolveIds); with site storage blocked
// that throws SecurityError. Analytics must never throw into the app, so every entry point is guarded here.
function safe<A extends unknown[]>(fn: (...args: A) => void): (...args: A) => void {
  return (...args) => {
    try {
      fn(...args)
    } catch {
      // storage blocked or similar — drop the event
    }
  }
}

/** Backward-compatible: existing call sites keep calling track(event, props). */
export const track = safe((event: string, props?: Record<string, unknown>) => fw.track(event, props))

/** Tie subsequent events to the cross-product identity (call on auth change). */
export const identify = fw.identify
/** Sean Ellis PMF + free text → shared feedback table. */
export const feedback = safe(fw.feedback)
/** Fire-and-forget error signal → events table. */
export const logError = safe(fw.logError)
