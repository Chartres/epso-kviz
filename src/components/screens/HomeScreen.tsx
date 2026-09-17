import { useMemo } from 'react'
import { useApp } from '@/app/AppContext'
import { ALL_QUESTIONS } from '@/domain/questions'
import { summary, needsReviewIds } from '@/domain/progress'
import { LESSON_SIZE } from '@/domain/lesson'
import { timeSeed, makeRng } from '@/domain/rng'
import { track } from '@/analytics'
import { ProgressBar } from '@/components/ui/ProgressBar'

export function HomeScreen() {
  const { state, dispatch } = useApp()
  const sum = useMemo(() => summary(state.progress, ALL_QUESTIONS), [state.progress])
  const reviewCount = useMemo(
    () => needsReviewIds(state.progress).length,
    [state.progress],
  )
  const streak = state.progress.streak.current
  const rng = () => makeRng(timeSeed())

  return (
    <div className="mx-auto w-full max-w-xl px-4 pt-2">
      <header className="mb-4 flex items-center justify-between">
        <h1 className="font-display text-xl font-bold uppercase tracking-tight text-steel-50">
          EPSO AI Field Trainer
        </h1>
        <div className="flex items-center gap-2 rounded-card border border-steel-700 px-3 py-1.5">
          <span aria-hidden className="text-brass-400">
            ▲
          </span>
          <span className="font-mono text-lg font-semibold tabular-nums text-brass-300">
            {streak}
          </span>
          <span className="font-mono text-[0.65rem] uppercase tracking-wide text-steel-500">
            {streak === 1 ? 'day' : 'days'} streak
          </span>
        </div>
      </header>

      {/* Primary job: today's lesson */}
      <button
        type="button"
        onClick={() => {
          track('start_lesson')
          dispatch({ type: 'startLesson', rng: rng() })
        }}
        className="glow-brass instrument mb-3 block w-full rounded-card border border-brass-500/70 bg-brass-500/10 p-5 text-left transition-colors hover:bg-brass-500/20"
      >
        <div className="font-mono text-xs uppercase tracking-[0.2em] text-brass-400">
          Today's lesson
        </div>
        <div className="mt-1 font-display text-2xl font-bold uppercase tracking-tight text-steel-50">
          Practice {LESSON_SIZE} questions
        </div>
        <div className="mt-1 text-sm text-steel-300">
          A short, tailored batch — your weak spots plus new questions.
        </div>
        <div className="mt-3 inline-flex items-center gap-2 rounded-card bg-brass-500 px-4 py-2 font-display text-sm font-semibold uppercase tracking-wide text-steel-950">
          Start →
        </div>
      </button>

      {/* Quick review of weak spots */}
      {reviewCount > 0 && (
        <button
          type="button"
          onClick={() => {
            track('start_review')
            dispatch({ type: 'startReview', rng: rng() })
          }}
          className="mb-3 flex w-full items-center justify-between rounded-card border border-steel-700 bg-steel-800/40 px-5 py-3.5 text-left transition-colors hover:border-steel-500"
        >
          <span className="font-medium text-steel-100">Review mistakes</span>
          <span className="font-mono text-sm text-rust-400 tabular-nums">
            {reviewCount} questions →
          </span>
        </button>
      )}

      {/* Compact progress — details live under Progress */}
      <button
        type="button"
        onClick={() => dispatch({ type: 'navigate', view: 'stats' })}
        className="block w-full rounded-card border border-steel-700 bg-steel-800/40 p-5 text-left transition-colors hover:border-steel-500"
      >
        <div className="mb-3 flex items-baseline justify-between">
          <span className="font-mono text-xs uppercase tracking-[0.2em] text-steel-400">
            My progress
          </span>
          <span className="text-xs text-brass-400">Details →</span>
        </div>
        <div className="grid grid-cols-3 gap-3 text-center">
          <Mini testId="stat-mastered" value={sum.mastered} label="Mastered" />
          <Mini testId="stat-answered" value={sum.answered} label="Practiced" />
          <Mini
            testId="stat-accuracy"
            value={`${Math.round(sum.accuracy * 100)}%`}
            label="Accuracy"
          />
        </div>
        <div className="mt-4">
          <ProgressBar value={sum.mastered} max={sum.total} tone="verdigris" />
        </div>
      </button>
    </div>
  )
}

function Mini({
  value,
  label,
  testId,
}: {
  value: number | string
  label: string
  testId?: string
}) {
  return (
    <div>
      <div
        data-testid={testId}
        className="font-mono text-xl font-semibold text-brass-300 tabular-nums"
      >
        {value}
      </div>
      <div className="mt-0.5 font-mono text-[0.6rem] uppercase tracking-[0.12em] text-steel-500">
        {label}
      </div>
    </div>
  )
}
