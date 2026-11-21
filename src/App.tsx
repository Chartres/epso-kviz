import { AppProvider, useApp } from '@/app/AppContext'
import { isTabView } from '@/app/store'
import { AuthProvider } from '@/auth/AuthContext'
import { BottomNav } from '@/components/BottomNav'
import { HomeScreen } from '@/components/screens/HomeScreen'
import { PracticeScreen } from '@/components/screens/PracticeScreen'
import { QuizScreen } from '@/components/screens/QuizScreen'
import { ResultsScreen } from '@/components/screens/ResultsScreen'
import { StudyScreen } from '@/components/screens/StudyScreen'
import { StatsScreen } from '@/components/screens/StatsScreen'
import { NumericalScreen } from '@/components/screens/NumericalScreen'
import { AbstractScreen } from '@/components/screens/AbstractScreen'
import { track } from '@/analytics'
import { lazy, Suspense } from 'react'
import { reloadOnce } from '@/app/reloadOnce'

// Verbal passages are ~35 KB gzipped in three languages; load them only when opened.
const VerbalScreen = lazy(() =>
  reloadOnce(
    () => import('@/components/screens/VerbalScreen').then((m) => ({ default: m.VerbalScreen })),
    'verbal-reload',
    { default: VerbalUnavailable },
  ),
)

function VerbalUnavailable({ onExit }: { onExit: () => void }) {
  return (
    <div className="p-6 text-steel-200">
      <p className="mb-4">The verbal test could not load. Check your connection and reload the page.</p>
      <button
        type="button"
        onClick={onExit}
        className="min-h-11 rounded-card border border-steel-600 px-4 py-2 font-semibold hover:border-steel-400"
      >
        Back
      </button>
    </div>
  )
}

function CurrentView() {
  const { state, dispatch } = useApp()
  switch (state.view) {
    case 'verbal':
      return (
        <Suspense fallback={null}>
          <VerbalScreen
            onExit={() => dispatch({ type: 'navigate', view: 'practice' })}
            onFinish={(r) => track('key_action', { action: 'verbal_finish', ...r })}
          />
        </Suspense>
      )
    case 'numerical':
      return (
        <NumericalScreen
          onExit={() => dispatch({ type: 'navigate', view: 'practice' })}
          onFinish={(r) => track('key_action', { action: 'numerical_finish', ...r })}
        />
      )
    case 'abstract':
      return (
        <AbstractScreen
          onExit={() => dispatch({ type: 'navigate', view: 'practice' })}
          onFinish={(r) => track('key_action', { action: 'abstract_finish', ...r })}
        />
      )
    case 'practice':
      return <PracticeScreen />
    case 'stats':
      return <StatsScreen />
    case 'guide':
      return <StudyScreen />
    case 'quiz':
    case 'exam':
      return <QuizScreen />
    case 'results':
      return <ResultsScreen />
    case 'home':
    default:
      return <HomeScreen />
  }
}

function Shell() {
  const { state } = useApp()
  const tabbed = isTabView(state.view)
  return (
    <div
      className="flex min-h-full flex-col"
      style={{
        paddingTop: 'env(safe-area-inset-top)',
        paddingLeft: 'env(safe-area-inset-left)',
        paddingRight: 'env(safe-area-inset-right)',
      }}
    >
      <main
        className="flex-1"
        style={tabbed ? { paddingBottom: 'calc(6rem + env(safe-area-inset-bottom))' } : undefined}
      >
        <CurrentView />
      </main>
      {tabbed && <BottomNav />}
    </div>
  )
}

export function App() {
  return (
    <AuthProvider>
      <AppProvider>
        <Shell />
      </AppProvider>
    </AuthProvider>
  )
}
