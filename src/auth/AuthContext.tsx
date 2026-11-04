import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from 'react'
import { supabase, isAuthConfigured } from './supabase'
import { identify } from '../analytics'
import { STORAGE_KEY } from '../domain/storage'
import { ROUND_KEY } from '../domain/round'

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
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null)
  const [loading, setLoading] = useState(isAuthConfigured)

  useEffect(() => {
    if (!supabase) return
    supabase.auth.getSession().then(({ data }) => {
      const u = data.session?.user
      setUser(u ? { id: u.id, email: u.email ?? undefined } : null)
      identify(u?.id ?? null) // cross-product identity on the shared platform
      setLoading(false)
    })
    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      const u = session?.user
      setUser(u ? { id: u.id, email: u.email ?? undefined } : null)
      identify(u?.id ?? null)
    })
    return () => sub.subscription.unsubscribe()
  }, [])

  const value: AuthContextValue = {
    configured: isAuthConfigured,
    loading,
    user,
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
      await supabase.auth.signOut()
      // Clear local progress and the unfinished round so a subsequent sign-in
      // from a different account starts with an empty local snapshot rather than
      // merging the previous user's data into the new account's cloud row.
      try {
        localStorage.removeItem(STORAGE_KEY)
        localStorage.removeItem(ROUND_KEY)
      } catch {
        // private mode — no-op
      }
    },
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within <AuthProvider>')
  return ctx
}
