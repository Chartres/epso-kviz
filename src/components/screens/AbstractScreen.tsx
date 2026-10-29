import { useCallback, useMemo, useState } from 'react'
import { makeRng, timeSeed } from '@/domain/rng'
import {
  ABSTRACT,
  buildAbstractTest,
  explainBroken,
  explainRule,
  frameAt,
  frameSvg,
  scoreAbstract,
  type Frame,
} from '@/domain/reasoning/abstract'
import type { Lang } from '@/domain/reasoning/numerical'
import { ExamTimer } from '@/components/ExamTimer'
import { ProgressBar } from '@/components/ui/ProgressBar'
import { LANG_ORDER, defaultLang } from './NumericalScreen'

const UI: Record<Lang, Record<string, string>> = {
  cs: {
    name: 'Čeština',
    title: 'Abstraktní uvažování',
    intro: '10 otázek, 10 minut, jako v oznámení (tabulka 3). Každá řada obrazců se řídí dvěma nebo třemi pravidly. Vyberte obrazec, který následuje. Výsledky uvidíte až na konci.',
    langLegend: 'Jazyk pokynů',
    timer: 'Zbývající čas',
    start: 'Začít',
    question: 'Otázka',
    of: 'z',
    series: 'Řada obrazců',
    prompt: 'Který obrazec následuje?',
    figure: 'Obrazec',
    option: 'Možnost',
    next: 'Další',
    finish: 'Dokončit',
    score: 'z 10',
    pass: 'Minimální požadovaný počet bodů: 10 z 20, společně s testem numerického uvažování (oznámení, tabulka 3).',
    yours: 'Vaše odpověď',
    none: 'bez odpovědi',
    right: 'Správná odpověď',
    again: 'Nový test',
    back: '← Zpět',
  },
  sk: {
    name: 'Slovenčina',
    title: 'Abstraktné uvažovanie',
    intro: '10 otázok, 10 minút, ako v oznámení (tabuľka 3). Každý rad obrazcov sa riadi dvoma alebo troma pravidlami. Vyberte obrazec, ktorý nasleduje. Výsledky uvidíte až na konci.',
    langLegend: 'Jazyk pokynov',
    timer: 'Zostávajúci čas',
    start: 'Začať',
    question: 'Otázka',
    of: 'z',
    series: 'Rad obrazcov',
    prompt: 'Ktorý obrazec nasleduje?',
    figure: 'Obrazec',
    option: 'Možnosť',
    next: 'Ďalej',
    finish: 'Dokončiť',
    score: 'z 10',
    pass: 'Minimálny požadovaný počet bodov: 10 z 20, spolu s testom numerického uvažovania (oznámenie, tabuľka 3).',
    yours: 'Vaša odpoveď',
    none: 'bez odpovede',
    right: 'Správna odpoveď',
    again: 'Nový test',
    back: '← Späť',
  },
  en: {
    name: 'English',
    title: 'Abstract reasoning',
    intro: '10 questions, 10 minutes, as in the notice (Table 3). Each row of figures follows two or three rules. Pick the figure that comes next. No feedback until you finish.',
    langLegend: 'Instructions in',
    timer: 'Time remaining',
    start: 'Start',
    question: 'Question',
    of: 'of',
    series: 'Series of figures',
    prompt: 'Which figure comes next?',
    figure: 'Figure',
    option: 'Option',
    next: 'Next',
    finish: 'Finish',
    score: 'of 10',
    pass: 'Pass mark: 10/20 combined with the numerical test (notice, Table 3).',
    yours: 'Your answer',
    none: 'no answer',
    right: 'Correct answer',
    again: 'New test',
    back: '← Back',
  },
}

export interface AbstractResult {
  lang: Lang
  score: number
  total: number
}

/** One generated figure; the SVG is built from numbers only, never from user text. */
function Figure({ frame, label, id, className = '' }: { frame: Frame; label: string; id: string; className?: string }) {
  return (
    <span className={`block aspect-square w-full ${className}`} dangerouslySetInnerHTML={{ __html: frameSvg(frame, label, id) }} />
  )
}

const cell = 'rounded-card border bg-steel-900/50 p-1.5 text-steel-100'

/**
 * Abstract reasoning: 10 generated "which figure comes next?" series in 10 minutes, no
 * feedback during the sitting, then each series explained rule by rule in the chosen language.
 */
export function AbstractScreen({
  seed,
  onExit,
  onFinish,
}: {
  seed?: number
  onExit: () => void
  onFinish?: (r: AbstractResult) => void
}) {
  const [lang, setLang] = useState<Lang>(defaultLang)
  const [phase, setPhase] = useState<'start' | 'test' | 'done'>('start')
  const [round, setRound] = useState(0)
  const [index, setIndex] = useState(0)
  const [answers, setAnswers] = useState<(number | undefined)[]>([])
  const [endsAt, setEndsAt] = useState(0)

  const series = useMemo(
    () => buildAbstractTest(makeRng((seed ?? timeSeed()) + round)),
    // a new sitting per round; the figures don't depend on the language
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [round],
  )
  const t = UI[lang]

  const finish = useCallback(() => {
    setPhase('done')
    onFinish?.({ lang, score: scoreAbstract(series, answers), total: series.length })
  }, [answers, series, lang, onFinish])

  if (phase === 'start') {
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
                <input type="radio" name="lang" value={l} checked={lang === l} onChange={() => setLang(l)} className="sr-only" />
                {UI[l].name}
              </label>
            ))}
          </div>
        </fieldset>
        <button
          type="button"
          onClick={() => {
            setAnswers([])
            setIndex(0)
            setEndsAt(Date.now() + ABSTRACT.minutes * 60_000)
            setPhase('test')
          }}
          className="glow-brass mt-6 w-full rounded-card bg-brass-500 px-5 py-3 font-display font-semibold uppercase tracking-wide text-steel-950 hover:bg-brass-400"
        >
          {t.start}
        </button>
      </div>
    )
  }

  if (phase === 'test') {
    const s = series[index]
    const last = index === series.length - 1
    return (
      <div className="mx-auto w-full max-w-2xl px-4 py-6" lang={lang}>
        <header className="mb-4 flex items-center justify-between gap-3">
          <span className="font-mono text-sm tabular-nums text-steel-400">
            {t.question} {index + 1} {t.of} {series.length}
          </span>
          <ExamTimer endsAt={endsAt} onExpire={finish} label={t.timer} />
        </header>
        <div className="mb-5">
          <ProgressBar value={index} max={series.length} />
        </div>
        <ol aria-label={t.series} className="grid grid-cols-3 gap-2 sm:grid-cols-6">
          {s.frames.map((f, k) => (
            <li key={k} className={`${cell} border-steel-700`}>
              <Figure frame={f} label={`${t.figure} ${k + 1}`} id={`q${index}f${k}`} />
            </li>
          ))}
          <li
            className="flex aspect-square items-center justify-center rounded-card border border-dashed border-brass-500/60 font-display text-3xl text-brass-400"
          >
            ?
          </li>
        </ol>
        <fieldset className="mt-5">
          <legend className="text-lg font-medium leading-snug text-steel-50">{t.prompt}</legend>
          <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4">
            {s.options.map((o, i) => (
              <label
                key={i}
                className={`flex cursor-pointer flex-col gap-1 rounded-card border p-2 pb-3 ${
                  answers[index] === i ? 'border-brass-500 bg-brass-500/10 text-steel-50' : 'border-steel-700 text-steel-100'
                }`}
              >
                <span className="flex min-h-11 items-center gap-2">
                  <input
                    type="radio"
                    name={`q${index}`}
                    checked={answers[index] === i}
                    onChange={() => setAnswers((a) => Object.assign([...a], { [index]: i }))}
                    className="accent-brass-500"
                  />
                  <span className="font-mono text-xs text-steel-500">{'ABCD'[i]}</span>
                </span>
                {/* the same size as a figure in the series, so the eye compares like with like */}
                <Figure frame={o} label={`${t.option} ${'ABCD'[i]}`} id={`q${index}o${i}`} className="mx-auto max-w-24" />
              </label>
            ))}
          </div>
        </fieldset>
        <button
          type="button"
          onClick={() => (last ? finish() : setIndex(index + 1))}
          className="mt-6 w-full rounded-card bg-brass-500 px-5 py-3 font-display font-semibold uppercase tracking-wide text-steel-950 hover:bg-brass-400"
        >
          {last ? t.finish : t.next}
        </button>
      </div>
    )
  }

  const score = scoreAbstract(series, answers)
  return (
    <div className="mx-auto w-full max-w-2xl px-4 py-8" lang={lang}>
      <div className="rounded-card border border-steel-700 bg-steel-800/40 p-6 text-center">
        <div data-testid="abstract-score" className="font-mono text-6xl font-semibold tabular-nums text-brass-300">
          {score}
          <span className="text-2xl text-steel-500"> {t.score}</span>
        </div>
        <p className="mt-2 text-sm text-steel-400">{t.pass}</p>
      </div>
      <ol className="mt-6 space-y-4">
        {series.map((s, i) => {
          const a = answers[i]
          const ok = a === s.correct
          const broken = a === undefined || ok ? undefined : s.broken[a]
          return (
            <li key={i} className="rounded-card border border-steel-700 bg-steel-900/50 p-4 text-sm">
              <p className="font-mono text-xs text-steel-500">
                {t.question} {i + 1}
              </p>
              <ol aria-label={t.series} className="mt-2 grid grid-cols-3 gap-2 sm:grid-cols-6">
                {[0, 1, 2, 3, 4, 5].map((k) => (
                  <li key={k} className={`${cell} ${k === 5 ? 'border-verdigris-500' : 'border-steel-700'}`}>
                    <Figure frame={frameAt(s.rules, s.start, k)} label={`${t.figure} ${k + 1}`} id={`r${i}f${k}`} />
                  </li>
                ))}
              </ol>
              <p className={`mt-3 ${ok ? 'text-verdigris-400' : 'text-rust-400'}`}>
                {t.yours}: {a === undefined ? t.none : 'ABCD'[a]}
                {broken && <> — {explainBroken(broken, lang)}</>}
              </p>
              <p className="text-verdigris-400">
                {t.right}: {'ABCD'[s.correct]}
              </p>
              <ul data-testid="solution" className="mt-2 list-disc space-y-0.5 pl-5 text-steel-400">
                {s.rules.map((r) => (
                  <li key={r.attr}>{explainRule(r, s.start, lang)}</li>
                ))}
              </ul>
            </li>
          )
        })}
      </ol>
      <div className="mt-6 flex flex-wrap justify-center gap-3">
        <button
          type="button"
          onClick={() => {
            setRound((r) => r + 1)
            setPhase('start')
          }}
          className="min-h-11 rounded-card bg-brass-500 px-5 py-2.5 font-display font-semibold uppercase tracking-wide text-steel-950"
        >
          {t.again}
        </button>
        <button type="button" onClick={onExit} className="min-h-11 rounded-card border border-steel-600 px-5 py-2.5 font-semibold text-steel-200">
          {t.back}
        </button>
      </div>
    </div>
  )
}
