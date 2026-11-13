import type { ReactNode } from 'react'
import type { Lang } from '@/domain/reasoning/numerical'
import { ExamTimer } from '@/components/ExamTimer'
import { ProgressBar } from '@/components/ui/ProgressBar'

export const LANG_ORDER: Lang[] = ['cs', 'sk', 'en']

export function defaultLang(): Lang {
  const l = typeof navigator !== 'undefined' ? navigator.language.slice(0, 2) : 'en'
  return l === 'cs' || l === 'sk' ? l : 'en'
}

/** What every reasoning test reports when a sitting ends. */
export interface ReasoningResult {
  lang: Lang
  score: number
  total: number
}

/** The start page shared by the verbal, numerical and abstract tests: intro, language, Start. */
export function ReasoningStart({
  ui,
  lang,
  onLang,
  onExit,
  onStart,
  children,
}: {
  ui: Record<Lang, Record<string, string>>
  lang: Lang
  onLang: (l: Lang) => void
  onExit: () => void
  onStart: () => void
  children?: ReactNode
}) {
  const t = ui[lang]
  return (
    <div className="mx-auto w-full max-w-2xl px-4 py-6">
      <button type="button" onClick={onExit} className="min-h-11 text-sm text-steel-400 hover:text-brass-400">
        {t.back}
      </button>
      <h1 lang={lang} className="mt-2 font-display text-2xl font-bold uppercase tracking-tight text-steel-50">
        {t.title}
      </h1>
      <p lang={lang} className="mt-2 text-sm leading-relaxed text-steel-300">
        {t.intro}
      </p>
      <fieldset className="mt-5">
        <legend lang={lang} className="font-mono text-xs uppercase tracking-[0.15em] text-steel-400">
          {t.langLegend}
        </legend>
        <div className="mt-2 flex flex-wrap gap-2">
          {LANG_ORDER.map((l) => (
            <label
              key={l}
              className={`flex min-h-11 cursor-pointer items-center gap-2 rounded-card border px-4 ${
                lang === l ? 'border-brass-500 bg-brass-500/15 text-brass-300' : 'border-steel-700 text-steel-300'
              }`}
            >
              <input type="radio" name="lang" value={l} checked={lang === l} onChange={() => onLang(l)} className="sr-only" />
              {ui[l].name}
            </label>
          ))}
        </div>
      </fieldset>
      <button
        type="button"
        onClick={onStart}
        className="glow-brass mt-6 w-full rounded-card bg-brass-500 px-5 py-3 font-display font-semibold uppercase tracking-wide text-steel-950 hover:bg-brass-400"
      >
        {t.start}
      </button>
      {children}
    </div>
  )
}

/** The "new test" and "back" buttons under every reasoning test's results. */
export function ReasoningEnd({ t, onAgain, onExit }: { t: Record<string, string>; onAgain: () => void; onExit: () => void }) {
  return (
    <div className="mt-6 flex flex-wrap justify-center gap-3">
      <button
        type="button"
        onClick={onAgain}
        className="min-h-11 rounded-card bg-brass-500 px-5 py-2.5 font-display font-semibold uppercase tracking-wide text-steel-950"
      >
        {t.again}
      </button>
      <button type="button" onClick={onExit} className="min-h-11 rounded-card border border-steel-600 px-5 py-2.5 font-semibold text-steel-200">
        {t.back}
      </button>
    </div>
  )
}

/** Question counter, countdown and progress bar above every reasoning test question. */
export function ReasoningHeader({
  t,
  index,
  total,
  endsAt,
  onExpire,
}: {
  t: Record<string, string>
  index: number
  total: number
  endsAt: number
  onExpire: () => void
}) {
  return (
    <>
      <header className="mb-4 flex items-center justify-between gap-3">
        <span className="font-mono text-sm tabular-nums text-steel-400">
          {t.question} {index + 1} {t.of} {total}
        </span>
        <ExamTimer endsAt={endsAt} onExpire={onExpire} label={t.timer} />
      </header>
      <div className="mb-5">
        <ProgressBar value={index} max={total} />
      </div>
    </>
  )
}
