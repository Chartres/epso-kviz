import { useCallback, useMemo, useState } from 'react'
import { makeRng, timeSeed } from '@/domain/rng'
import type { Lang } from '@/domain/reasoning/numerical'
import { ANSWERS, VERBAL, buildVerbalTest, passageOf, scoreVerbal, type Answer, type VerbalItem } from '@/domain/reasoning/verbal'
import { ExamTimer } from '@/components/ExamTimer'
import { ProgressBar } from '@/components/ui/ProgressBar'
import { LANG_ORDER, defaultLang } from './NumericalScreen'

const UI: Record<Lang, Record<string, string>> = {
  cs: {
    name: 'Čeština',
    title: 'Verbální uvažování',
    intro: '20 otázek, 35 minut, ve vašem jazyce 1, jako v oznámení (tabulka 3). Texty jsou body odůvodnění právních předpisů EU, převzaté doslovně z EUR-Lex. U každého tvrzení rozhodněte jen podle textu, ne podle toho, co víte. Výsledky uvidíte až na konci.',
    langLegend: 'Jazyk 1',
    timer: 'Zbývající čas',
    start: 'Začít',
    question: 'Otázka',
    of: 'z',
    recital: 'bod odůvodnění',
    prompt: 'Podle textu je toto tvrzení:',
    true: 'Pravda',
    false: 'Nepravda',
    cannot: 'Nelze určit',
    next: 'Další',
    finish: 'Dokončit',
    score: 'z 20',
    pass: 'Minimální požadovaný počet bodů: 10 z 20 (oznámení, tabulka 3).',
    yours: 'Vaše odpověď',
    none: 'bez odpovědi',
    right: 'Správná odpověď',
    again: 'Nový test',
    back: '← Zpět',
    credit: '© Evropská unie, EUR-Lex. Opakované použití podle rozhodnutí Komise 2011/833/EU. Závazná jsou pouze vydání Úředního věstníku.',
  },
  sk: {
    name: 'Slovenčina',
    title: 'Verbálne uvažovanie',
    intro: '20 otázok, 35 minút, vo vašom jazyku 1, ako v oznámení (tabuľka 3). Texty sú odôvodnenia právnych predpisov EÚ, prevzaté doslovne z EUR-Lex. Pri každom tvrdení rozhodnite len podľa textu, nie podľa toho, čo viete. Výsledky uvidíte až na konci.',
    langLegend: 'Jazyk 1',
    timer: 'Zostávajúci čas',
    start: 'Začať',
    question: 'Otázka',
    of: 'z',
    recital: 'odôvodnenie',
    prompt: 'Podľa textu je toto tvrdenie:',
    true: 'Pravda',
    false: 'Nepravda',
    cannot: 'Nedá sa určiť',
    next: 'Ďalej',
    finish: 'Dokončiť',
    score: 'z 20',
    pass: 'Minimálny požadovaný počet bodov: 10 z 20 (oznámenie, tabuľka 3).',
    yours: 'Vaša odpoveď',
    none: 'bez odpovede',
    right: 'Správna odpoveď',
    again: 'Nový test',
    back: '← Späť',
    credit: '© Európska únia, EUR-Lex. Opakované použitie podľa rozhodnutia Komisie 2011/833/EÚ. Autentické sú len vydania Úradného vestníka.',
  },
  en: {
    name: 'English',
    title: 'Verbal reasoning',
    intro: '20 questions, 35 minutes, in your language 1, as in the notice (Table 3). The passages are recitals of EU acts, taken word for word from EUR-Lex. Judge each statement on the passage alone, not on what you know. No feedback until you finish.',
    langLegend: 'Language 1',
    timer: 'Time remaining',
    start: 'Start',
    question: 'Question',
    of: 'of',
    recital: 'recital',
    prompt: 'On the passage alone, this statement is:',
    true: 'True',
    false: 'False',
    cannot: 'Cannot say',
    next: 'Next',
    finish: 'Finish',
    score: 'of 20',
    pass: 'Pass mark: 10/20 (notice, Table 3).',
    yours: 'Your answer',
    none: 'no answer',
    right: 'Correct answer',
    again: 'New test',
    back: '← Back',
    credit: '© European Union, EUR-Lex. Reuse under Commission Decision 2011/833/EU. Only the Official Journal editions are authentic.',
  },
}

export interface VerbalResult {
  lang: Lang
  score: number
  total: number
}

/** The passage, set as a quotation with its act, recital and CELEX number underneath. */
function PassageText({ item, lang }: { item: VerbalItem; lang: Lang }) {
  const p = passageOf(item)
  return (
    <figure>
      <blockquote className="border-l-2 border-steel-600 pl-3 text-sm italic leading-relaxed text-steel-200">{p.text[lang]}</blockquote>
      <figcaption className="mt-2 pl-3 font-mono text-xs text-steel-500">
        {p.act[lang]}, {UI[lang].recital} {p.recital} ·{' '}
        <a href={p.url} target="_blank" rel="noopener noreferrer" className="text-brass-400 underline-offset-2 hover:underline">
          CELEX {p.celex} ↗
        </a>
      </figcaption>
    </figure>
  )
}

/**
 * Verbal reasoning in the candidate's language 1: 20 statements on EUR-Lex passages in 35
 * minutes, no feedback during the sitting (like the real test), the reasons at the end.
 */
export function VerbalScreen({
  seed,
  onExit,
  onFinish,
}: {
  seed?: number
  onExit: () => void
  onFinish?: (r: VerbalResult) => void
}) {
  const [lang, setLang] = useState<Lang>(defaultLang)
  const [phase, setPhase] = useState<'start' | 'test' | 'done'>('start')
  const [round, setRound] = useState(0)
  const [index, setIndex] = useState(0)
  const [answers, setAnswers] = useState<(Answer | undefined)[]>([])
  const [endsAt, setEndsAt] = useState(0)

  const items = useMemo(
    () => buildVerbalTest(makeRng((seed ?? timeSeed()) + round)),
    // a new sitting per round; the items are the same in every language
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [round],
  )
  const t = UI[lang]

  const finish = useCallback(() => {
    setPhase('done')
    onFinish?.({ lang, score: scoreVerbal(items, answers), total: items.length })
  }, [answers, items, lang, onFinish])

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
            setEndsAt(Date.now() + VERBAL.minutes * 60_000)
            setPhase('test')
          }}
          className="glow-brass mt-6 w-full rounded-card bg-brass-500 px-5 py-3 font-display font-semibold uppercase tracking-wide text-steel-950 hover:bg-brass-400"
        >
          {t.start}
        </button>
        <p lang={lang} className="mt-4 text-xs text-steel-500">
          {t.credit}
        </p>
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
          <ExamTimer endsAt={endsAt} onExpire={finish} label={t.timer} />
        </header>
        <div className="mb-5">
          <ProgressBar value={index} max={items.length} />
        </div>
        <PassageText item={item} lang={lang} />
        <fieldset className="mt-5">
          <legend className="text-lg font-medium leading-snug text-steel-50">{item.statement[lang]}</legend>
          <p className="mt-2 text-sm text-steel-400">{t.prompt}</p>
          <div className="mt-3 space-y-2">
            {ANSWERS.map((a, i) => (
              <label
                key={a}
                className={`flex min-h-11 cursor-pointer items-center gap-3 rounded-card border px-4 py-2 ${
                  answers[index] === a ? 'border-brass-500 bg-brass-500/10 text-steel-50' : 'border-steel-700 text-steel-200'
                }`}
              >
                <input
                  type="radio"
                  name={`q${index}`}
                  checked={answers[index] === a}
                  onChange={() => setAnswers((prev) => Object.assign([...prev], { [index]: a }))}
                  className="accent-brass-500"
                />
                <span className="font-mono text-xs text-steel-500">{'ABC'[i]}</span>
                <span>{t[a]}</span>
              </label>
            ))}
          </div>
        </fieldset>
        <button
          type="button"
          onClick={() => {
            if (last) return finish()
            setIndex(index + 1)
            // a new passage starts at the top
            window.scrollTo(0, 0)
          }}
          className="mt-6 w-full rounded-card bg-brass-500 px-5 py-3 font-display font-semibold uppercase tracking-wide text-steel-950 hover:bg-brass-400"
        >
          {last ? t.finish : t.next}
        </button>
      </div>
    )
  }

  const score = scoreVerbal(items, answers)
  return (
    <div className="mx-auto w-full max-w-2xl px-4 py-8" lang={lang}>
      <div className="rounded-card border border-steel-700 bg-steel-800/40 p-6 text-center">
        <div data-testid="verbal-score" className="font-mono text-6xl font-semibold tabular-nums text-brass-300">
          {score}
          <span className="text-2xl text-steel-500"> {t.score}</span>
        </div>
        <p className="mt-2 text-sm text-steel-400">{t.pass}</p>
      </div>
      <ol className="mt-6 space-y-4">
        {items.map((it, i) => {
          const p = passageOf(it)
          return (
            <li key={it.id} className="rounded-card border border-steel-700 bg-steel-900/50 p-4 text-sm">
              <p className="font-mono text-xs text-steel-500">
                {p.act[lang]}, {UI[lang].recital} {p.recital}
              </p>
              <p className="mt-1 text-steel-200">
                {i + 1}. {it.statement[lang]}
              </p>
              <p className={`mt-2 ${answers[i] === it.answer ? 'text-verdigris-400' : 'text-rust-400'}`}>
                {t.yours}: {answers[i] === undefined ? t.none : t[answers[i]!]}
              </p>
              <p className="text-verdigris-400">
                {t.right}: {t[it.answer]}
              </p>
              <p data-testid="solution" className="mt-2 text-steel-400">
                {it.why[lang]}
              </p>
            </li>
          )
        })}
      </ol>
      <p className="mt-4 text-xs text-steel-500">{t.credit}</p>
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
