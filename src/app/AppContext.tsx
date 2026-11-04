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
import { loadSettings, saveSettings } from '@/domain/settings'
import { loadRound, saveRound } from '@/domain/round'
import { useAuth } from '@/auth/AuthContext'
import { supabaseStore } from '@/auth/supabaseStore'
import { syncProgress } from '@/auth/sync'
import { mergeProgress } from '@/domain/progress'
import { track } from '@/analytics'

interface AppContextValue {
  state: AppState
  dispatch: React.Dispatch<Action>
}

const AppContext = createContext<AppContextValue | null>(null)

export function AppProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(reducer, undefined, () => ({
    ...initialState(),
    settings: loadSettings(),
    unfinished: loadRound(),
  }))
  const { user } = useAuth()
  // True while the sign-in cloud sync is in flight; the debounced push skips to
  // avoid upsetting the cloud row with unmerged local progress (finding #1).
  const syncingRef = useRef(false)

  // Hydrate persisted progress once on mount.
  useEffect(() => {
    dispatch({ type: 'hydrate', progress: loadProgress() })
    track('app_open')
  }, [])

  // Persist progress locally whenever it changes (offline-first source of truth).
  useEffect(() => {
    saveProgress(state.progress)
  }, [state.progress])

  // Settings stay on this device (not synced): they describe how you like to practise here.
  useEffect(() => {
    saveSettings(state.settings)
  }, [state.settings])

  // The unfinished round stays on this device too (not synced; progress shape unchanged).
  useEffect(() => {
    saveRound(state.unfinished)
  }, [state.unfinished])

  // On sign-in: reconcile local progress with the cloud and adopt the merge.
  useEffect(() => {
    if (!user) return
    let cancelled = false
    syncingRef.current = true
    syncProgress(supabaseStore, user.id, loadProgress()).then((merged) => {
      syncingRef.current = false
      if (!cancelled) {
        // Re-merge with the latest local snapshot: answers recorded while the
        // cloud round-trip was in flight are in localStorage (saveProgress runs
        // synchronously on every state.progress change) but were not in the
        // snapshot passed to syncProgress at the start (finding #4).
        dispatch({ type: 'hydrate', progress: mergeProgress(merged, loadProgress()) })
      }
    }).catch(() => {
      syncingRef.current = false
    })
    return () => {
      cancelled = true
      syncingRef.current = false
    }
  }, [user?.id])

  // While signed in, push progress changes to the cloud (debounced).
  // Skips while the sign-in sync is in flight to avoid upsetting the cloud row
  // with unmerged local progress before the merge completes (finding #1).
  useEffect(() => {
    if (!user) return
    const t = setTimeout(() => {
      if (!syncingRef.current) {
        supabaseStore.save(user.id, state.progress).catch(() => {})
      }
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
