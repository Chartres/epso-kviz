import { useCallback } from 'react'
import { useApp } from '@/app/AppContext'
import { currentQuestion } from '@/domain/session'
import { isBookmarked } from '@/domain/progress'
import { QuestionCard } from '@/components/QuestionCard'
import { ExamTimer } from '@/components/ExamTimer'
import { ProgressBar } from '@/components/ui/ProgressBar'
import { todayStr } from '@/lib/date'
import type { Choice } from '@/domain/types'

const MODE_LABEL: Record<string, string> = {
  lesson: "Today's lesson",
  practice: 'Practice',
  review: 'Review mistakes',
  bookmarks: 'Bookmarks',
  exam: 'Exam simulation',
}

export function QuizScreen() {
  const { state, dispatch } = useApp()
  const { session, mode } = state
  const onExpire = useCallback(() => dispatch({ type: 'finishExam' }), [dispatch])

  if (!session || !mode) return null
  const question = currentQuestion(session)
  const isExam = mode === 'exam'

  if (!question) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-16 text-center text-steel-300">
        <p className="mb-4">No questions to show.</p>
        <button
          type="button"
          className="text-brass-400 hover:underline"
          onClick={() => dispatch({ type: 'goMenu' })}
        >
          ← Back to menu
        </button>
      </div>
    )
  }

  return (
    <div className="mx-auto w-full max-w-2xl px-4 py-6">
      <header className="mb-5 flex items-center justify-between gap-3">
        <button
          type="button"
          onClick={() => dispatch({ type: 'goMenu' })}
          className="text-sm text-steel-400 hover:text-brass-400"
        >
          ← End
        </button>
        <span className="text-xs uppercase tracking-wide text-steel-500">
          {MODE_LABEL[mode]}
        </span>
        {isExam && state.examEndsAt != null ? (
          <ExamTimer endsAt={state.examEndsAt} onExpire={onExpire} />
        ) : (
          <span className="w-12" />
        )}
      </header>

      <div className="mb-6">
        <ProgressBar value={session.index} max={session.questions.length} />
      </div>

      <QuestionCard
        key={question.id}
        question={question}
        reveal={!isExam}
        chosen={session.chosen[question.id] as Choice | undefined}
        bookmarked={isBookmarked(state.progress, question.id)}
        index={session.index}
        total={session.questions.length}
        onAnswer={(choice) => dispatch({ type: 'answer', choice, now: Date.now() })}
        onNext={() => dispatch({ type: 'next', today: todayStr() })}
        onToggleBookmark={() =>
          dispatch({ type: 'toggleBookmark', id: question.id })
        }
      />
    </div>
  )
}
