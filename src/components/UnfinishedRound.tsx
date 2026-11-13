import { useApp } from '@/app/AppContext'
import { track } from '@/analytics'
import { makeRng, timeSeed } from '@/domain/rng'
import { reviewQuestions } from '@/domain/selection'
import type { Lang } from '@/domain/reasoning/numerical'
import type { ResumableMode } from '@/domain/round'
import { defaultLang } from '@/components/screens/ReasoningStart'

/**
 * The card for a round left early, in the visitor's language like the reasoning tests
 * (Czech, Slovak, else English). Pavol's labels: "Pokračovat" and "Nový trénink".
 */
export const ROUND_UI: Record<Lang, { title: string; resume: string; fresh: string; mode: Record<ResumableMode, string> }> = {
  cs: {
    title: 'Rozpracovaný trénink',
    resume: 'Pokračovat',
    fresh: 'Nový trénink',
    mode: { lesson: 'Dnešní lekce', practice: 'Procvičování', review: 'Opakování chyb', bookmarks: 'Záložky' },
  },
  sk: {
    title: 'Rozpracovaný tréning',
    resume: 'Pokračovať',
    fresh: 'Nový tréning',
    mode: { lesson: 'Dnešná lekcia', practice: 'Precvičovanie', review: 'Opakovanie chýb', bookmarks: 'Záložky' },
  },
  en: {
    title: 'Unfinished round',
    resume: 'Continue',
    fresh: 'New round',
    mode: { lesson: "Today's lesson", practice: 'Practice', review: 'Review mistakes', bookmarks: 'Bookmarks' },
  },
}

const START_EVENT: Record<ResumableMode, string> = {
  lesson: 'start_lesson',
  practice: 'start_practice',
  review: 'start_review',
  bookmarks: 'start_bookmarks',
}

export function UnfinishedRound() {
  const { state, dispatch } = useApp()
  const snap = state.unfinished
  if (!snap) return null
  const lang = defaultLang()
  const t = ROUND_UI[lang]
  const answered = snap.answers.length
  const total = snap.ids.length

  function fresh() {
    if (!snap) return
    dispatch({ type: 'discardRound' })
    // Nothing to build a new review or bookmarks round from: just clear the card.
    if (snap.mode === 'review' && reviewQuestions(state.progress).length === 0) return
    if (snap.mode === 'bookmarks' && state.progress.bookmarks.length === 0) return
    const rng = makeRng(timeSeed())
    track(START_EVENT[snap.mode], { question_first: state.settings.questionFirst })
    switch (snap.mode) {
      case 'lesson':
        return dispatch({ type: 'startLesson', rng })
      case 'practice':
        if (snap.filter) {
          dispatch({ type: 'setCategories', categories: new Set(snap.filter.categories) })
          dispatch({ type: 'setSearch', search: snap.filter.search })
        }
        return dispatch({ type: 'startPractice', rng })
      case 'review':
        return dispatch({ type: 'startReview', rng })
      case 'bookmarks':
        return dispatch({ type: 'startBookmarks', rng })
    }
  }

  return (
    <section
      lang={lang}
      aria-labelledby="unfinished-title"
      className="mb-3 rounded-card border border-steel-600 bg-steel-800/60 p-4"
    >
      <div className="flex items-baseline justify-between gap-3">
        <h2 id="unfinished-title" className="font-mono text-xs uppercase tracking-[0.2em] text-steel-300">
          {t.title}
        </h2>
        <span data-testid="unfinished-count" className="font-mono text-sm tabular-nums text-steel-400">
          {answered} / {total}
        </span>
      </div>
      <p className="mt-1 font-display text-lg font-semibold uppercase tracking-wide text-steel-50">
        {t.mode[snap.mode]}
      </p>
      <div className="mt-3 flex gap-2">
        <button
          type="button"
          onClick={() => {
            track('key_action', { action: 'round_resume', mode: snap.mode, answered, total })
            dispatch({ type: 'resumeRound' })
          }}
          className="min-h-11 flex-1 rounded-card bg-brass-500 px-4 py-2 font-display font-semibold uppercase tracking-wide text-steel-950 hover:bg-brass-400"
        >
          {t.resume}
        </button>
        <button
          type="button"
          onClick={fresh}
          className="min-h-11 flex-1 rounded-card border border-steel-600 px-4 py-2 font-semibold text-steel-200 hover:border-steel-400"
        >
          {t.fresh}
        </button>
      </div>
    </section>
  )
}
