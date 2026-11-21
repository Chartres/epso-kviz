import {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from 'react'
import type { Session } from '@supabase/supabase-js'
import { supabase, isAuthConfigured } from './supabase'
import { identify } from '../analytics'

export interface AuthUser {
  id: string
  email?: string
}

interface AuthContextValue {
  configured: boolean
  loading: boolean
  user: AuthUser | null
  signInWithGoogle: () => Promise<void>
  signInWithEmail: (email: string) => Promise<{ ok: boolean; error?: string }>
  signOut: () => Promise<void>
  /** Awaited by signOut while the session still exists (requests after it go out as anon). */
  beforeSignOut: { current: (() => Promise<void>) | null }
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null)
  const [loading, setLoading] = useState(isAuthConfigured)
  const beforeSignOut = useRef<(() => Promise<void>) | null>(null)

  useEffect(() => {
    if (!supabase) return
    function applySession(session: Session | null) {
      const u = session?.user
      setUser(u ? { id: u.id, email: u.email ?? undefined } : null)
      identify(u?.id ?? null) // cross-product identity on the shared platform
    }
    supabase.auth.getSession().then(({ data }) => {
      applySession(data.session)
      setLoading(false)
    }).catch(() => setLoading(false)) // storage or network failure: carry on signed out
    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => applySession(session))
    return () => sub.subscription.unsubscribe()
  }, [])

  const value: AuthContextValue = {
    configured: isAuthConfigured,
    loading,
    user,
    beforeSignOut,
    async signInWithGoogle() {
      if (!supabase) return
      await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: { redirectTo: window.location.href },
      })
    },
    async signInWithEmail(email: string) {
      if (!supabase) return { ok: false, error: 'Sign-in is not configured.' }
      const { error } = await supabase.auth.signInWithOtp({
        email,
        options: { emailRedirectTo: window.location.href },
      })
      return error ? { ok: false, error: error.message } : { ok: true }
    },
    async signOut() {
      if (!supabase) return
      await beforeSignOut.current?.().catch(() => {})
      await supabase.auth.signOut()
    },
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within <AuthProvider>')
  return ctx
}
