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
import { emptyProgress, type ProgressData } from '@/domain/progress'
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

  // Sign-in sync state. The debounced save waits for 'ok' so it can't overwrite the cloud with
  // unmerged local data; 'failed' (cloud unreadable) makes the next change retry the sync.
  const syncStateRef = useRef<'idle' | 'pending' | 'ok' | 'failed'>('idle')
  // Bumped when the user changes, so a sync for the previous user is ignored when it lands.
  const syncGenRef = useRef(0)
  // The progress object last written to the cloud, so the same row isn't sent twice.
  const lastSavedRef = useRef<ProgressData | null>(null)

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

  // Reconcile local progress with the cloud and adopt the merge.
  function startSync(userId: string) {
    const gen = syncGenRef.current
    syncStateRef.current = 'pending'
    let fetchFailed = false
    const store: RemoteProgressStore = {
      save: (id, data) =>
        supabaseStore.save(id, data).then(() => {
          lastSavedRef.current = data
        }),
      fetch: (id) =>
        supabaseStore.fetch(id).catch((e) => {
          fetchFailed = true
          throw e
        }),
    }
    const base = progressRef.current
    syncProgress(store, userId, base)
      .then((merged) => {
        if (gen !== syncGenRef.current) return
        // Cloud unreadable: keep local as it is and push nothing, so a fresh or stale device
        // can't overwrite the cloud row. The next progress change retries the sync.
        if (fetchFailed) {
          syncStateRef.current = 'failed'
          return
        }
        // syncProgress has written `merged`; anything changed since goes out with the debounce.
        dispatch({ type: 'syncMerged', base, progress: merged })
        syncStateRef.current = 'ok'
      })
      .catch(() => {})
  }

  // On sign-in: sync once.
  useEffect(() => {
    if (!user) return
    startSync(user.id)
    return () => {
      syncGenRef.current++
      syncStateRef.current = 'idle'
    }
  }, [user?.id])

  // While signed in, push progress changes to the cloud (debounced), once the sign-in sync is done.
  useEffect(() => {
    if (!user) return
    const t = setTimeout(() => {
      if (syncStateRef.current === 'failed') return startSync(user.id)
      if (syncStateRef.current !== 'ok' || state.progress === lastSavedRef.current) return
      const data = state.progress
      supabaseStore.save(user.id, data).then(() => {
        lastSavedRef.current = data
      }, () => {})
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
