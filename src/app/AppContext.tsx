import {
  createContext,
  useContext,
  useEffect,
  useReducer,
  useRef,
  type ReactNode,
} from 'react'
import { reducer, initialState, type AppState, type Action } from './store'
import { loadProgress, saveProgress } from '@/domain/storage'
import { emptyProgress, mergeProgress } from '@/domain/progress'
import { useAuth } from '@/auth/AuthContext'
import { supabaseStore } from '@/auth/supabaseStore'
import { syncProgress } from '@/auth/sync'
import { track } from '@/analytics'

interface AppContextValue {
  state: AppState
  dispatch: React.Dispatch<Action>
}

const AppContext = createContext<AppContextValue | null>(null)

export function AppProvider({ children }: { children: ReactNode }) {
  // Initialise directly from localStorage so the save effect never runs with
  // emptyProgress() before hydration — avoids wiping the store under StrictMode.
  const [state, dispatch] = useReducer(reducer, undefined, () => ({
    ...initialState(),
    progress: loadProgress(),
  }))
  const { user } = useAuth()
  // Track whether we have ever seen a signed-in user so we can distinguish a
  // real sign-out from the initial anonymous state (both have user === null).
  const hadUser = useRef(false)
  // Block cloud saves until the initial sync (fetch+merge) has completed, so
  // the debounce never overwrites cloud with pre-merge local state (findings 1 & 2).
  const syncReady = useRef(false)

  // Track app open once on mount (progress is already in state from the initializer).
  useEffect(() => {
    track('app_open')
  }, [])

  // Persist progress locally whenever it changes (offline-first source of truth).
  useEffect(() => {
    saveProgress(state.progress)
  }, [state.progress])

  // On sign-in: reconcile local progress with the cloud and adopt the merge.
  // On sign-out: clear local progress so the next account doesn't inherit it.
  useEffect(() => {
    if (!user) {
      if (hadUser.current) {
        // Actual sign-out — clear to prevent cross-account data leakage.
        syncReady.current = false
        const empty = emptyProgress()
        dispatch({ type: 'hydrate', progress: empty })
        saveProgress(empty)
      }
      return
    }
    hadUser.current = true
    syncReady.current = false // block saves until sync resolves
    let cancelled = false
    syncProgress(supabaseStore, user.id, loadProgress()).then((merged) => {
      if (!cancelled) {
        // Re-merge with current localStorage to keep answers made while sync was
        // in flight (finding 6); saveProgress fires on every state change so
        // loadProgress() here reflects the latest local state.
        dispatch({ type: 'hydrate', progress: mergeProgress(merged, loadProgress()) })
        syncReady.current = true
      }
    })
    return () => {
      cancelled = true
    }
  }, [user?.id])

  // While signed in, push progress changes to the cloud (debounced).
  // Guard: skip until initial sync completes so we never overwrite cloud with
  // a pre-merge local snapshot (findings 1 & 2).
  useEffect(() => {
    if (!user || !syncReady.current) return
    const t = setTimeout(() => {
      supabaseStore.save(user.id, state.progress).catch(() => {})
    }, 1500)
    return () => clearTimeout(t)
  }, [state.progress, user?.id])

  return (
    <AppContext.Provider value={{ state, dispatch }}>
      {children}
    </AppContext.Provider>
  )
}

export function useApp(): AppContextValue {
  const ctx = useContext(AppContext)
  if (!ctx) throw new Error('useApp must be used within <AppProvider>')
  return ctx
}
