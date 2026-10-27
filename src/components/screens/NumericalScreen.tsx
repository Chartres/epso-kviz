import { useCallback, useMemo, useState } from 'react'
import { makeRng, timeSeed } from '@/domain/rng'
import {
  NUMERICAL,
  buildNumericalTest,
  formatCell,
  scoreNumerical,
  type Lang,
  type NumItem,
} from '@/domain/reasoning/numerical'
import { ExamTimer } from '@/components/ExamTimer'
import { ProgressBar } from '@/components/ui/ProgressBar'

const UI: Record<Lang, Record<string, string>> = {
  cs: {
    name: 'Čeština',
    start: 'Začít',
    question: 'Otázka',
    of: 'z',
    next: 'Další',
    finish: 'Dokončit',
    score: 'z 10',
    pass: 'Hranice úspěchu: 10/20 společně s testem abstraktního uvažování (oznámení, tabulka 3).',
    yours: 'Vaše odpověď',
    none: 'bez odpovědi',
    right: 'Správně',
    again: 'Nový test',
    back: '← Zpět',
  },
  sk: {
    name: 'Slovenčina',
    start: 'Začať',
    question: 'Otázka',
    of: 'z',
    next: 'Ďalej',
    finish: 'Dokončiť',
    score: 'z 10',
    pass: 'Hranica úspešnosti: 10/20 spolu s testom abstraktného uvažovania (oznámenie, tabuľka 3).',
    yours: 'Vaša odpoveď',
    none: 'bez odpovede',
    right: 'Správne',
    again: 'Nový test',
    back: '← Späť',
  },
  en: {
    name: 'English',
    start: 'Start',
    question: 'Question',
    of: 'of',
    next: 'Next',
    finish: 'Finish',
    score: 'of 10',
    pass: 'Pass mark: 10/20 combined with the abstract test (notice, Table 3).',
    yours: 'Your answer',
    none: 'no answer',
    right: 'Correct',
    again: 'New test',
    back: '← Back',
  },
}

const LANG_ORDER: Lang[] = ['cs', 'sk', 'en']

function defaultLang(): Lang {
  const l = typeof navigator !== 'undefined' ? navigator.language.slice(0, 2) : 'en'
  return l === 'cs' || l === 'sk' ? l : 'en'
}

export interface NumericalResult {
  lang: Lang
  score: number
  total: number
}

function Table({ item, lang }: { item: NumItem; lang: Lang }) {
  return (
    <figure className="overflow-x-auto">
      <table className="w-full border-collapse text-sm">
        <caption className="mb-2 text-left font-medium text-steel-200">{item.table.caption}</caption>
        <thead>
          <tr>
            <th className="border-b border-steel-600 py-2 pr-3 text-left" />
            {item.table.columns.map((c) => (
              <th key={c} scope="col" className="border-b border-steel-600 py-2 pl-3 text-right font-mono text-xs text-steel-400">
                {c}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {item.table.rows.map((r) => (
            <tr key={r.label}>
              <th scope="row" className="border-b border-steel-800 py-2 pr-3 text-left font-normal text-steel-200">
                {r.label}
              </th>
              {r.values.map((v, i) => (
                <td key={i} className="border-b border-steel-800 py-2 pl-3 text-right font-mono tabular-nums text-steel-100">
                  {formatCell(v, lang)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
      <figcaption className="mt-2 text-xs text-steel-500">{item.table.note}</figcaption>
    </figure>
  )
}

/**
 * Numerical reasoning in the candidate's language 1: 10 generated items in 20 minutes,
 * no feedback during the sitting (like the real test), worked solutions at the end.
 */
export function NumericalScreen({
  seed,
  onExit,
  onFinish,
}: {
  seed?: number
  onExit: () => void
  onFinish?: (r: NumericalResult) => void
}) {
  const [lang, setLang] = useState<Lang>(defaultLang)
  const [phase, setPhase] = useState<'start' | 'test' | 'done'>('start')
  const [round, setRound] = useState(0)
  const [index, setIndex] = useState(0)
  const [answers, setAnswers] = useState<(number | undefined)[]>([])
  const [endsAt, setEndsAt] = useState(0)

  const items = useMemo(
    () => buildNumericalTest(makeRng((seed ?? timeSeed()) + round), lang),
    // a new sitting per round or language
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [lang, round],
  )
  const t = UI[lang]

  const finish = useCallback(() => {
    setPhase('done')
    onFinish?.({ lang, score: scoreNumerical(items, answers), total: items.length })
  }, [answers, items, lang, onFinish])

  if (phase === 'start') {
    return (
      <div className="mx-auto w-full max-w-2xl px-4 py-6">
        <button type="button" onClick={onExit} className="min-h-11 text-sm text-steel-400 hover:text-brass-400">
          {t.back}
        </button>
        <h1 className="mt-2 font-display text-2xl font-bold uppercase tracking-tight text-steel-50">
          Numerical reasoning
        </h1>
        <p className="mt-2 text-sm leading-relaxed text-steel-300">
          {NUMERICAL.questions} questions, {NUMERICAL.minutes} minutes, in your language 1, as in the
          notice (Table 3). The data are fictional; every answer is computed. No feedback until you finish.
        </p>
        <fieldset className="mt-5">
          <legend className="font-mono text-xs uppercase tracking-[0.15em] text-steel-400">Language 1</legend>
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
            setEndsAt(Date.now() + NUMERICAL.minutes * 60_000)
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
    const item = items[index]
    const last = index === items.length - 1
    return (
      <div className="mx-auto w-full max-w-2xl px-4 py-6" lang={lang}>
        <header className="mb-4 flex items-center justify-between gap-3">
          <span className="font-mono text-sm tabular-nums text-steel-400">
            {t.question} {index + 1} {t.of} {items.length}
          </span>
          <ExamTimer endsAt={endsAt} onExpire={finish} />
        </header>
        <div className="mb-5">
          <ProgressBar value={index} max={items.length} />
        </div>
        <Table item={item} lang={lang} />
        <fieldset className="mt-5">
          <legend className="text-lg font-medium leading-snug text-steel-50">{item.question}</legend>
          <div className="mt-3 space-y-2">
            {item.options.map((o, i) => (
              <label
                key={i}
                className={`flex min-h-11 cursor-pointer items-center gap-3 rounded-card border px-4 py-2 ${
                  answers[index] === i ? 'border-brass-500 bg-brass-500/10 text-steel-50' : 'border-steel-700 text-steel-200'
                }`}
              >
                <input
                  type="radio"
                  name={`q${index}`}
                  checked={answers[index] === i}
                  onChange={() => setAnswers((a) => Object.assign([...a], { [index]: i }))}
                  className="accent-brass-500"
                />
                <span className="font-mono text-xs text-steel-500">{'ABCD'[i]}</span>
                <span className="tabular-nums">{o}</span>
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

  const score = scoreNumerical(items, answers)
  return (
    <div className="mx-auto w-full max-w-2xl px-4 py-8" lang={lang}>
      <div className="rounded-card border border-steel-700 bg-steel-800/40 p-6 text-center">
        <div className="font-mono text-6xl font-semibold tabular-nums text-brass-300">
          {score}
          <span className="text-2xl text-steel-500"> {t.score}</span>
        </div>
        <p className="mt-2 text-sm text-steel-400">{t.pass}</p>
      </div>
      <ol className="mt-6 space-y-4">
        {items.map((it, i) => (
          <li key={i} className="rounded-card border border-steel-700 bg-steel-900/50 p-4 text-sm">
            <p className="text-steel-200">
              {i + 1}. {it.question}
            </p>
            <p className={`mt-2 ${answers[i] === it.correct ? 'text-verdigris-400' : 'text-rust-400'}`}>
              {t.yours}: {answers[i] === undefined ? t.none : it.options[answers[i]!]}
            </p>
            <p className="text-verdigris-400">
              {t.right}: {it.options[it.correct]}
            </p>
            <p data-testid="solution" className="mt-2 text-steel-400">
              {it.solution}
            </p>
          </li>
        ))}
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
