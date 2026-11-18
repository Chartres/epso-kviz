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
import { syncProgress, type RemoteProgressStore } from '@/auth/sync'
import { emptyProgress } from '@/domain/progress'
import { track } from '@/analytics'

interface AppContextValue {
  state: AppState
  dispatch: React.Dispatch<Action>
}

const AppContext = createContext<AppContextValue | null>(null)

export function AppProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(reducer, undefined, () => ({
    ...initialState(),
    progress: loadProgress(),
    settings: loadSettings(),
    unfinished: loadRound(),
  }))
  const { user } = useAuth()

  // Always-current ref so the sign-in sync effect captures the latest progress,
  // not the snapshot from when the user object first appeared.
  const progressRef = useRef(state.progress)
  useEffect(() => {
    progressRef.current = state.progress
  }, [state.progress])

  // Prevents debounced save from overwriting cloud with unmerged local data.
  const syncInFlightRef = useRef(false)

  // Track app open once on mount.
  useEffect(() => {
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

  // On sign-out (a user, then none): clear this device's progress and unfinished round so the
  // next account to sign in here does not inherit them. The cloud row keeps the user's progress.
  const prevUserIdRef = useRef<string | null>(null)
  useEffect(() => {
    const prev = prevUserIdRef.current
    prevUserIdRef.current = user?.id ?? null
    if (prev && !user) {
      dispatch({ type: 'hydrate', progress: emptyProgress() })
      dispatch({ type: 'discardRound' })
    }
  }, [user?.id])

  // On sign-in: reconcile local progress with the cloud and adopt the merge.
  useEffect(() => {
    if (!user) return
    let cancelled = false
    let fetchFailed = false
    syncInFlightRef.current = true
    const store: RemoteProgressStore = {
      save: supabaseStore.save,
      fetch: (id) =>
        supabaseStore.fetch(id).catch((e) => {
          fetchFailed = true
          throw e
        }),
    }
    syncProgress(store, user.id, progressRef.current)
      .then((merged) => {
        // Cloud unreadable: keep local as it is and push nothing this session (syncInFlightRef
        // stays set), so a fresh or stale device can't overwrite the cloud row. A reload retries.
        if (cancelled || fetchFailed) return
        dispatch({ type: 'hydrate', progress: merged })
        // A debounced save may have been skipped while sync was in flight;
        // write the merged result immediately so the cloud row is up to date.
        supabaseStore.save(user.id, merged).catch(() => {})
        syncInFlightRef.current = false
      })
      .catch(() => {})
    return () => {
      cancelled = true
      syncInFlightRef.current = false
    }
  }, [user?.id])

  // While signed in, push progress changes to the cloud (debounced).
  // Guard: skip if sync is still in flight to avoid overwriting the merge.
  useEffect(() => {
    if (!user) return
    const t = setTimeout(() => {
      if (syncInFlightRef.current) return
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
