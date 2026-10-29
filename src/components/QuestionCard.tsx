import { useEffect, useState } from 'react'
import type { Choice, Question } from '@/domain/types'
import { QUESTION_FIRST_HOLD_SECONDS, type QuestionFirstMode } from '@/domain/settings'
import { SourceNote } from './SourceNote'

export interface QuestionCardProps {
  question: Question
  /** Whether to reveal correctness (practice/review) or hide it (exam). */
  reveal: boolean
  /** The chosen option, if the question has been answered. */
  chosen?: Choice
  bookmarked: boolean
  index: number
  total: number
  onAnswer: (choice: Choice) => void
  onNext: () => void
  onToggleBookmark: () => void
  /** Citation indexes of this question already in the commonplace book. */
  collected?: number[]
  onCollect?: (index: number) => void
  /** Question first (SIGNATURE.md): how the options are held back until you have an answer. */
  questionFirst?: QuestionFirstMode
  /** Called once when the options appear in a question-first form. */
  onRecall?: (info: { mode: Exclude<QuestionFirstMode, 'none'>; wrote?: boolean }) => void
}

const OPTIONS: Choice[] = ['a', 'b', 'c', 'd']
const KEY_TO_CHOICE: Record<string, Choice> = {
  '1': 'a',
  '2': 'b',
  '3': 'c',
  '4': 'd',
  a: 'a',
  b: 'b',
  c: 'c',
  d: 'd',
}

type OptionState = 'idle' | 'correct' | 'wrong' | 'selected' | 'muted'

function optionState(
  option: Choice,
  question: Question,
  chosen: Choice | undefined,
  reveal: boolean,
): OptionState {
  if (chosen === undefined) return 'idle'
  if (reveal) {
    if (option === question.correct) return 'correct'
    if (option === chosen) return 'wrong'
    return 'muted'
  }
  return option === chosen ? 'selected' : 'muted'
}

const STATE_CLASS: Record<OptionState, string> = {
  idle: 'border-steel-700 bg-steel-800/50 hover:border-brass-400 hover:bg-steel-700/50',
  selected: 'border-brass-500 bg-steel-700/70 glow-brass',
  correct: 'border-verdigris-500 bg-verdigris-500/12 text-steel-50 glow-verdigris',
  wrong: 'border-rust-500 bg-rust-500/12 text-steel-50',
  muted: 'border-steel-800 bg-steel-900/50 text-steel-400 opacity-60',
}

const REVEAL_CLASS =
  'w-full rounded-card border border-brass-500/70 px-5 py-3 font-display font-semibold uppercase tracking-wide text-brass-300 transition-colors hover:bg-brass-500/10'

export function QuestionCard({
  question,
  reveal,
  chosen,
  bookmarked,
  index,
  total,
  onAnswer,
  onNext,
  onToggleBookmark,
  collected,
  onCollect,
  questionFirst = 'none',
  onRecall,
}: QuestionCardProps) {
  const answered = chosen !== undefined
  const isCorrect = answered && chosen === question.correct
  // An answered question (e.g. revisited) always shows its options.
  const [shown, setShown] = useState(questionFirst === 'none' || answered)
  const [recall, setRecall] = useState('')
  const [hold, setHold] = useState(QUESTION_FIRST_HOLD_SECONDS)
  const optionsVisible = shown || answered

  function show() {
    if (shown) return
    setShown(true)
    if (questionFirst !== 'none') {
      onRecall?.(questionFirst === 'b' ? { mode: 'b', wrote: recall.trim() !== '' } : { mode: questionFirst })
    }
  }

  // Form C: count down, then show the options without a tap.
  useEffect(() => {
    if (questionFirst !== 'c' || optionsVisible) return
    if (hold <= 0) {
      show()
      return
    }
    const t = setTimeout(() => setHold((h) => h - 1), 1000)
    return () => clearTimeout(t)
  }, [hold, optionsVisible, questionFirst])

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return
      if (e.metaKey || e.ctrlKey || e.altKey) return
      const key = e.key.length === 1 ? e.key.toLowerCase() : e.key
      if (!optionsVisible) {
        // Form A: Enter or Space shows the options. B and C have their own control.
        if (questionFirst === 'a' && (e.key === 'Enter' || e.key === ' ')) {
          e.preventDefault()
          show()
        }
        return
      }
      if (!answered && KEY_TO_CHOICE[key]) {
        e.preventDefault()
        onAnswer(KEY_TO_CHOICE[key])
      } else if (answered && (e.key === 'Enter' || e.key === ' ')) {
        e.preventDefault()
        onNext()
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  })

  return (
    <article className="mx-auto w-full max-w-2xl">
      <header className="mb-4 flex items-center justify-between text-sm text-steel-400">
        <span className="font-mono font-medium tabular-nums text-steel-300">
          {String(index + 1).padStart(2, '0')}
          <span className="text-steel-600"> / {total}</span>
        </span>
        <span className="border border-steel-700 px-3 py-1 font-mono text-[0.7rem] uppercase tracking-[0.15em] text-steel-400">
          {question.cat}
        </span>
        <button
          type="button"
          onClick={onToggleBookmark}
          aria-pressed={bookmarked}
          aria-label={bookmarked ? 'Remove bookmark' : 'Add bookmark'}
          className={`px-2 py-1 font-mono text-xs uppercase tracking-wide transition-colors ${
            bookmarked ? 'text-brass-400' : 'text-steel-500 hover:text-brass-400'
          }`}
        >
          {bookmarked ? '★' : '☆'} Bookmark
        </button>
      </header>

      <h2 className="mb-5 text-balance text-xl font-semibold leading-relaxed text-steel-50">
        {question.q}
      </h2>

      {!optionsVisible && questionFirst === 'a' && (
        <div>
          <p className="mb-3 font-mono text-xs text-steel-400">Recall first: form your answer, then look.</p>
          <button type="button" onClick={show} className={REVEAL_CLASS}>
            Show the four options
          </button>
        </div>
      )}

      {!optionsVisible && questionFirst === 'b' && (
        <form
          onSubmit={(e) => {
            e.preventDefault()
            show()
          }}
        >
          <label htmlFor={`recall-${question.id}`} className="mb-2 block font-mono text-xs uppercase tracking-[0.15em] text-steel-400">
            Your answer, in a few words
          </label>
          <textarea
            id={`recall-${question.id}`}
            value={recall}
            onChange={(e) => setRecall(e.target.value)}
            rows={3}
            maxLength={280}
            placeholder="Type it before you see the options"
            className="mb-3 w-full rounded-card border border-steel-700 bg-steel-900/60 px-3 py-2.5 text-base text-steel-100 placeholder:text-steel-500 focus:border-brass-500 focus:outline-none"
          />
          <button type="submit" className={REVEAL_CLASS}>
            Compare with the options
          </button>
        </form>
      )}

      {!optionsVisible && questionFirst === 'c' && (
        <p
          role="status"
          className="rounded-card border border-steel-700 px-4 py-3 text-center font-mono text-sm text-steel-400"
        >
          Options in {hold} s
        </p>
      )}

      {!optionsVisible && (
        <p className="mt-3 font-mono text-xs text-steel-600">Question first · change it on the Practice tab</p>
      )}

      {optionsVisible && (
      <div role="group" aria-label="Answer options" className="flex flex-col gap-3">
        {OPTIONS.map((opt) => {
          const state = optionState(opt, question, chosen, reveal)
          return (
            <button
              key={opt}
              type="button"
              data-state={state}
              disabled={answered}
              onClick={() => !answered && onAnswer(opt)}
              className={`flex items-start gap-3 rounded-card border px-4 py-3 text-left transition-colors disabled:cursor-default ${STATE_CLASS[state]}`}
            >
              <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center border border-steel-500/60 font-mono text-xs font-semibold uppercase">
                {opt}
              </span>
              <span className="min-w-0 flex-1 leading-relaxed">
                {question[opt]}
                {reveal && state === 'correct' && (
                  <span className="ml-2 whitespace-nowrap text-xs font-semibold text-verdigris-400">
                    ✓ Correct answer
                  </span>
                )}
              </span>
            </button>
          )
        })}
      </div>
      )}

      {optionsVisible && !answered && (
        <p className="mt-3 font-mono text-xs text-steel-600">
          Keys A · B · C · D or 1 · 2 · 3 · 4
        </p>
      )}

      {reveal && answered && (
        <div className="mt-4 rounded-card border border-steel-700 bg-steel-800/40 p-3 text-sm leading-relaxed text-steel-300">
          {questionFirst === 'b' && recall.trim() !== '' && (
            <p className="mb-2 border-b border-steel-700 pb-2">
              <span className="font-mono text-xs uppercase tracking-[0.15em] text-steel-400">Your words: </span>
              <span className="text-steel-100">{recall.trim()}</span>
            </p>
          )}
          <p>{question.explain}</p>
          <SourceNote question={question} collected={collected} onCollect={onCollect} />
        </div>
      )}

      {answered && (
        <footer
          className="sticky bottom-0 z-10 -mx-4 mt-5 flex items-center justify-between gap-3 border-t border-steel-700 bg-steel-950/95 px-4 py-3 backdrop-blur sm:rounded-card sm:border"
          style={{ paddingBottom: 'max(0.75rem, env(safe-area-inset-bottom))' }}
        >
          {reveal ? (
            <p
              className={`min-w-0 text-sm font-medium ${
                isCorrect ? 'text-verdigris-400' : 'text-rust-400'
              }`}
            >
              {isCorrect
                ? 'Correct.'
                : 'Incorrect — review the correct answer above.'}
            </p>
          ) : (
            <span className="text-sm text-steel-400">Saved</span>
          )}
          <button
            type="button"
            onClick={onNext}
            className="glow-brass inline-flex shrink-0 items-center gap-2 rounded-card bg-brass-500 px-5 py-2.5 font-display font-semibold uppercase tracking-wide text-steel-950 transition-colors hover:bg-brass-400"
          >
            <span>{index + 1 === total ? 'Finish' : 'Next'}</span>
            <kbd className="flex h-5 min-w-5 items-center justify-center rounded-[2px] border border-steel-950/30 px-1 font-mono text-xs leading-none">
              ↵
            </kbd>
          </button>
        </footer>
      )}
    </article>
  )
}
