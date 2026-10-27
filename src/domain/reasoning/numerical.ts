import { shuffle, type Rng } from '../rng'

/**
 * Numerical reasoning practice in the candidate's language 1. The format follows the Notice
 * of Competition EPSO/AD/430/26, Table 3: 10 questions in 20 minutes, combined with the
 * abstract test for a pass of 10/20. Items are generated from templates with seeded,
 * fictional data, so every answer is computed, never typed. Distractors are the classic
 * slips: the wrong base for a percentage, an inverted ratio, linear instead of compound growth.
 */

export const NUMERICAL = { questions: 10, minutes: 20 } as const

export type Lang = 'cs' | 'sk' | 'en'
export const LANGS: Lang[] = ['cs', 'sk', 'en']

export type Template = 'pct-change' | 'share' | 'per-capita' | 'currency' | 'largest-rise' | 'project'
export const TEMPLATES: Template[] = ['pct-change', 'share', 'per-capita', 'currency', 'largest-rise', 'project']

export interface NumTable {
  caption: string
  columns: string[]
  rows: { label: string; values: number[] }[]
  note: string
}

export interface NumItem {
  template: Template
  table: NumTable
  question: string
  options: string[]
  correct: number
  /** The exact value behind the keyed option (numeric templates). */
  answerValue?: number
  /** Worked solution, shown after answering. */
  solution: string
  /** Which cells the answer uses, for tests and review. */
  check: Record<string, number>
}

type L<T = string> = Record<Lang, T>

const LOCALE: L = { cs: 'cs-CZ', sk: 'sk-SK', en: 'en-GB' }
const MINUS = '−'

function num(n: number, lang: Lang, digits: number): string {
  return new Intl.NumberFormat(LOCALE[lang], {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  })
    .format(n)
    .replace('-', MINUS)
}
const pct = (n: number, lang: Lang, signed = false) =>
  `${signed && n > 0 ? '+' : ''}${num(n, lang, 1)}${lang === 'en' ? '%' : ' %'}`
const eur = (n: number, lang: Lang, digits = 0) =>
  lang === 'en' ? `EUR ${num(n, lang, digits)}` : `${num(n, lang, digits)} EUR`

const FICTIONAL: L = { cs: 'Fiktivní údaje.', sk: 'Fiktívne údaje.', en: 'Fictional data.' }

// Population in millions (rounded, 2025) only sets a plausible scale; the data is fictional.
const COUNTRIES: { name: L; pop: number }[] = [
  { name: { cs: 'Rakousko', sk: 'Rakúsko', en: 'Austria' }, pop: 9.2 },
  { name: { cs: 'Belgie', sk: 'Belgicko', en: 'Belgium' }, pop: 11.8 },
  { name: { cs: 'Česko', sk: 'Česko', en: 'Czechia' }, pop: 10.9 },
  { name: { cs: 'Dánsko', sk: 'Dánsko', en: 'Denmark' }, pop: 6.0 },
  { name: { cs: 'Finsko', sk: 'Fínsko', en: 'Finland' }, pop: 5.6 },
  { name: { cs: 'Francie', sk: 'Francúzsko', en: 'France' }, pop: 68.6 },
  { name: { cs: 'Německo', sk: 'Nemecko', en: 'Germany' }, pop: 83.5 },
  { name: { cs: 'Irsko', sk: 'Írsko', en: 'Ireland' }, pop: 5.3 },
  { name: { cs: 'Itálie', sk: 'Taliansko', en: 'Italy' }, pop: 58.9 },
  { name: { cs: 'Nizozemsko', sk: 'Holandsko', en: 'Netherlands' }, pop: 18.0 },
  { name: { cs: 'Polsko', sk: 'Poľsko', en: 'Poland' }, pop: 36.6 },
  { name: { cs: 'Portugalsko', sk: 'Portugalsko', en: 'Portugal' }, pop: 10.6 },
  { name: { cs: 'Slovensko', sk: 'Slovensko', en: 'Slovakia' }, pop: 5.4 },
  { name: { cs: 'Španělsko', sk: 'Španielsko', en: 'Spain' }, pop: 48.6 },
  { name: { cs: 'Švédsko', sk: 'Švédsko', en: 'Sweden' }, pop: 10.6 },
]

const int = (rng: Rng, lo: number, hi: number) => lo + Math.floor(rng() * (hi - lo + 1))
const pick = <T,>(rng: Rng, xs: readonly T[], n: number): T[] => shuffle(xs, rng).slice(0, n)

/** Format the correct value and distractors, nudge any that collide, shuffle. */
function finish(
  values: number[],
  format: (n: number) => string,
  rng: Rng,
): { options: string[]; correct: number } {
  const out: string[] = []
  for (const [i, v0] of values.entries()) {
    let v = v0
    let s = format(v)
    for (let k = 1; out.includes(s) && k < 50; k++) {
      v = v0 * (1 + 0.07 * k * (i % 2 ? 1 : -1))
      s = format(v)
    }
    out.push(s)
  }
  const order = shuffle([0, 1, 2, 3], rng)
  return { options: order.map((i) => out[i]), correct: order.indexOf(0) }
}

function pctChange(rng: Rng, lang: Lang): NumItem {
  const years = [2023, 2024, 2025]
  const countries = pick(rng, COUNTRIES, 4)
  const rows = countries.map((c) => {
    const a = int(rng, 20, 400)
    const b = Math.max(5, Math.round(a * (0.7 + rng() * 0.7)))
    const c3 = Math.max(5, Math.round(b * (0.8 + rng() * 0.6)))
    return { label: c.name[lang], values: [a, b, c3] }
  })
  const row = int(rng, 0, 3)
  let [from, to] = rng() < 0.5 ? [0, 1] : [1, 2]
  if (rng() < 0.3) [from, to] = [0, 2]
  // Keep the change clear of zero so the slips give visibly different answers.
  const r = rows[row].values
  if (Math.abs(r[to] - r[from]) / r[from] < 0.05) r[to] = Math.round(r[from] * 1.18)
  const a = r[from]
  const b = r[to]
  const v = ((b - a) / a) * 100
  const { options, correct } = finish([v, ((b - a) / b) * 100, (b / a) * 100, -v], (n) => pct(n, lang, true), rng)
  const y1 = years[from]
  const y2 = years[to]
  const c = rows[row].label
  const q: L = {
    cs: `${c}: o kolik procent se změnil počet podniků využívajících AI mezi roky ${y1} a ${y2}?`,
    sk: `${c}: o koľko percent sa zmenil počet podnikov využívajúcich AI medzi rokmi ${y1} a ${y2}?`,
    en: `${c}: by what percentage did the number of enterprises using AI change between ${y1} and ${y2}?`,
  }
  const sol: L = {
    cs: `(${b} ${MINUS} ${a}) / ${a} × 100 = ${pct(v, lang, true)}. Základem je starší hodnota; dělit novou (${b}) je nejčastější chyba.`,
    sk: `(${b} ${MINUS} ${a}) / ${a} × 100 = ${pct(v, lang, true)}. Základom je staršia hodnota; deliť novou (${b}) je najčastejšia chyba.`,
    en: `(${b} ${MINUS} ${a}) / ${a} × 100 = ${pct(v, lang, true)}. The base is the earlier value; dividing by the later one (${b}) is the usual slip.`,
  }
  return {
    template: 'pct-change',
    table: {
      caption: {
        cs: 'Podniky využívající umělou inteligenci (v tisících)',
        sk: 'Podniky využívajúce umelú inteligenciu (v tisícoch)',
        en: 'Enterprises using artificial intelligence (thousands)',
      }[lang],
      columns: years.map(String),
      rows,
      note: FICTIONAL[lang],
    },
    question: q[lang],
    options,
    correct,
    answerValue: v,
    solution: sol[lang],
    check: { row, from, to },
  }
}

const PROGRAMMES: L<string[]> = {
  cs: ['Výzkum', 'Výpočetní kapacita', 'Dovednosti', 'Zavádění ve veřejné správě', 'Start-upy'],
  sk: ['Výskum', 'Výpočtová kapacita', 'Zručnosti', 'Zavádzanie vo verejnej správe', 'Start-upy'],
  en: ['Research', 'Compute', 'Skills', 'Public-sector uptake', 'Start-ups'],
}

function share(rng: Rng, lang: Lang): NumItem {
  const labels = PROGRAMMES[lang]
  const rows = labels.map((label) => ({ label, values: [int(rng, 40, 900)] }))
  const row = int(rng, 0, rows.length - 1)
  const total = rows.reduce((s, r) => s + r.values[0], 0)
  const part = rows[row].values[0]
  const v = (part / total) * 100
  const other = rows[(row + 1) % rows.length].values[0]
  const { options, correct } = finish(
    [v, (part / (total - part)) * 100, 100 / rows.length, (other / total) * 100],
    (n) => pct(n, lang),
    rng,
  )
  const q: L = {
    cs: `Jaký podíl z celkových investic připadl na položku „${labels[row]}“?`,
    sk: `Aký podiel z celkových investícií pripadol na položku „${labels[row]}“?`,
    en: `What share of total investment went to “${labels[row]}”?`,
  }
  const sol: L = {
    cs: `Celkem ${total}; ${part} / ${total} × 100 = ${pct(v, lang)}. Dělit zbytkem (${total - part}) místo celkem je častá chyba.`,
    sk: `Spolu ${total}; ${part} / ${total} × 100 = ${pct(v, lang)}. Deliť zvyškom (${total - part}) namiesto celku je častá chyba.`,
    en: `Total ${total}; ${part} / ${total} × 100 = ${pct(v, lang)}. Dividing by the rest (${total - part}) instead of the total is a common slip.`,
  }
  return {
    template: 'share',
    table: {
      caption: {
        cs: 'Veřejné investice do AI podle programu, 2025 (mil. EUR)',
        sk: 'Verejné investície do AI podľa programu, 2025 (mil. EUR)',
        en: 'Public investment in AI by programme, 2025 (EUR million)',
      }[lang],
      columns: ['2025'],
      rows,
      note: FICTIONAL[lang],
    },
    question: q[lang],
    options,
    correct,
    answerValue: v,
    solution: sol[lang],
    check: { row, col: 0 },
  }
}

function perCapita(rng: Rng, lang: Lang): NumItem {
  const countries = pick(rng, COUNTRIES, 4)
  const rows = countries.map((c) => ({
    label: c.name[lang],
    values: [c.pop, int(rng, 20, Math.max(40, Math.round(c.pop * 12)))],
  }))
  const row = int(rng, 0, 3)
  const [people, spend] = rows[row].values
  const v = spend / people
  const otherRow = rows[(row + 1) % 4].values
  const { options, correct } = finish(
    [v, people / spend, v * 10, otherRow[1] / otherRow[0]],
    (n) => eur(n, lang, 2),
    rng,
  )
  const c = rows[row].label
  const q: L = {
    cs: `${c}: kolik činily výdaje na školení v AI na jednoho obyvatele?`,
    sk: `${c}: koľko predstavovali výdavky na školenia v AI na jedného obyvateľa?`,
    en: `${c}: how much was spent on AI training per inhabitant?`,
  }
  const sol: L = {
    cs: `Obě veličiny jsou v milionech, takže se miliony vykrátí: ${num(spend, lang, 0)} / ${num(people, lang, 1)} = ${eur(v, lang, 2)}.`,
    sk: `Obe veličiny sú v miliónoch, takže sa milióny vykrátia: ${num(spend, lang, 0)} / ${num(people, lang, 1)} = ${eur(v, lang, 2)}.`,
    en: `Both columns are in millions, so the millions cancel: ${num(spend, lang, 0)} / ${num(people, lang, 1)} = ${eur(v, lang, 2)}.`,
  }
  return {
    template: 'per-capita',
    table: {
      caption: { cs: 'Výdaje na školení v oblasti AI, 2025', sk: 'Výdavky na školenia v oblasti AI, 2025', en: 'Spending on AI training, 2025' }[lang],
      columns: {
        cs: ['Obyvatelstvo (mil.)', 'Výdaje (mil. EUR)'],
        sk: ['Obyvateľstvo (mil.)', 'Výdavky (mil. EUR)'],
        en: ['Population (million)', 'Spending (EUR million)'],
      }[lang],
      rows,
      note: FICTIONAL[lang],
    },
    question: q[lang],
    options,
    correct,
    answerValue: v,
    solution: sol[lang],
    check: { row, value: 1, people: 0, factor: 1 },
  }
}

function currency(rng: Rng, lang: Lang): NumItem {
  const rate = Math.round((24.1 + rng() * 1.8) * 100) / 100
  const letters = ['A', 'B', 'C', 'D']
  const word: L = { cs: 'Smlouva', sk: 'Zmluva', en: 'Contract' }
  const rows = letters.map((x) => ({ label: `${word[lang]} ${x}`, values: [int(rng, 40, 900) * 10_000] }))
  const row = int(rng, 0, 3)
  const amount = rows[row].values[0]
  const v = amount / rate
  const { options, correct } = finish(
    [v, amount / Math.round(rate), v * 10, v / 10],
    (n) => eur(n, lang, 0),
    rng,
  )
  const rateTxt = num(rate, lang, 2)
  const q: L = {
    cs: `Jaká je hodnota smlouvy ${letters[row]} v eurech?`,
    sk: `Aká je hodnota zmluvy ${letters[row]} v eurách?`,
    en: `What is the value of contract ${letters[row]} in euros?`,
  }
  const sol: L = {
    cs: `${num(amount, lang, 0)} / ${rateTxt} = ${eur(v, lang, 0)}. Zaokrouhlit kurz na celé koruny dá ${eur(amount / Math.round(rate), lang, 0)}, což je jiná možnost.`,
    sk: `${num(amount, lang, 0)} / ${rateTxt} = ${eur(v, lang, 0)}. Zaokrúhliť kurz na celé koruny dá ${eur(amount / Math.round(rate), lang, 0)}, čo je iná možnosť.`,
    en: `${num(amount, lang, 0)} / ${rateTxt} = ${eur(v, lang, 0)}. Rounding the rate to a whole number gives ${eur(amount / Math.round(rate), lang, 0)}, a different option.`,
  }
  return {
    template: 'currency',
    table: {
      caption: { cs: 'Zakázky na služby AI', sk: 'Zákazky na služby AI', en: 'Contracts for AI services' }[lang],
      columns: [{ cs: 'Hodnota (Kč)', sk: 'Hodnota (CZK)', en: 'Value (CZK)' }[lang]],
      rows,
      note: `${{ cs: `Kurz: 1 EUR = ${rateTxt} Kč.`, sk: `Kurz: 1 EUR = ${rateTxt} CZK.`, en: `Exchange rate: EUR 1 = CZK ${rateTxt}.` }[lang]} ${FICTIONAL[lang]}`,
    },
    question: q[lang],
    options,
    correct,
    answerValue: v,
    solution: sol[lang],
    check: { amount, rate },
  }
}

function largestRise(rng: Rng, lang: Lang): NumItem {
  const countries = pick(rng, COUNTRIES, 4)
  // One row has the largest absolute rise; another, from a small base, the largest % rise.
  for (;;) {
    const rows = countries.map((c) => {
      const a = int(rng, 100, 2000)
      return { label: c.name[lang], values: [a, a + int(rng, 10, 600)] }
    })
    const smallBase = int(rng, 0, 3)
    rows[smallBase].values = [int(rng, 40, 90), 0]
    rows[smallBase].values[1] = rows[smallBase].values[0] * 3
    const rises = rows.map((r) => r.values[1] - r.values[0])
    const max = Math.max(...rises)
    if (rises.filter((x) => x === max).length !== 1) continue
    const best = rises.indexOf(max)
    if (best === smallBase) continue
    const order = shuffle([0, 1, 2, 3], rng)
    const y1 = 2024
    const y2 = 2026
    const q: L = {
      cs: `Ve které zemi se počet odborníků na AI mezi roky ${y1} a ${y2} zvýšil nejvíce (v absolutních číslech)?`,
      sk: `V ktorej krajine sa počet odborníkov na AI medzi rokmi ${y1} a ${y2} zvýšil najviac (v absolútnych číslach)?`,
      en: `In which country did the number of AI specialists rise most between ${y1} and ${y2}, in absolute terms?`,
    }
    const sol: L = {
      cs: `Rozdíly: ${rows.map((r) => `${r.label} ${r.values[1] - r.values[0]}`).join(', ')}. ${rows[smallBase].label} roste nejrychleji v procentech, ale z malého základu.`,
      sk: `Rozdiely: ${rows.map((r) => `${r.label} ${r.values[1] - r.values[0]}`).join(', ')}. ${rows[smallBase].label} rastie najrýchlejšie v percentách, ale z malého základu.`,
      en: `Rises: ${rows.map((r) => `${r.label} ${r.values[1] - r.values[0]}`).join(', ')}. ${rows[smallBase].label} grows fastest in percentage terms, but from a small base.`,
    }
    return {
      template: 'largest-rise',
      table: {
        caption: { cs: 'Odborníci na AI ve veřejné správě', sk: 'Odborníci na AI vo verejnej správe', en: 'AI specialists in public administration' }[lang],
        columns: [String(y1), String(y2)],
        rows,
        note: FICTIONAL[lang],
      },
      question: q[lang],
      options: order.map((i) => rows[i].label),
      correct: order.indexOf(best),
      solution: sol[lang],
      check: { best, smallBase },
    }
  }
}

function project(rng: Rng, lang: Lang): NumItem {
  const countries = pick(rng, COUNTRIES, 4)
  const rows = countries.map((c) => {
    const a = int(rng, 80, 900)
    return { label: c.name[lang], values: [a, Math.round(a * (1.08 + rng() * 0.4))] }
  })
  const row = int(rng, 0, 3)
  const [a, b] = rows[row].values
  const v = b * (b / a)
  const { options, correct } = finish(
    [v, b + (b - a), b * (b / a) ** 2, (b * (b - a)) / a],
    (n) => `${num(n, lang, 1)} GWh`,
    rng,
  )
  const c = rows[row].label
  const q: L = {
    cs: `${c}: pokud spotřeba poroste mezi roky 2025 a 2026 stejným tempem (v %) jako mezi roky 2024 a 2025, jaká bude v roce 2026?`,
    sk: `${c}: ak bude spotreba rásť medzi rokmi 2025 a 2026 rovnakým tempom (v %) ako medzi rokmi 2024 a 2025, aká bude v roku 2026?`,
    en: `${c}: if electricity use grows from 2025 to 2026 at the same percentage rate as from 2024 to 2025, what will it be in 2026?`,
  }
  const sol: L = {
    cs: `Tempo ${b} / ${a}; ${b} × ${b} / ${a} = ${num(v, lang, 1)} GWh. Přičíst stejný přírůstek (${b - a}) je lineární růst, ne stejné tempo.`,
    sk: `Tempo ${b} / ${a}; ${b} × ${b} / ${a} = ${num(v, lang, 1)} GWh. Pripočítať rovnaký prírastok (${b - a}) je lineárny rast, nie rovnaké tempo.`,
    en: `Rate ${b} / ${a}; ${b} × ${b} / ${a} = ${num(v, lang, 1)} GWh. Adding the same increase (${b - a}) is linear growth, not the same rate.`,
  }
  return {
    template: 'project',
    table: {
      caption: {
        cs: 'Datová centra pro AI: spotřeba elektřiny (GWh)',
        sk: 'Dátové centrá pre AI: spotreba elektriny (GWh)',
        en: 'AI data centres: electricity use (GWh)',
      }[lang],
      columns: ['2024', '2025'],
      rows,
      note: FICTIONAL[lang],
    },
    question: q[lang],
    options,
    correct,
    answerValue: v,
    solution: sol[lang],
    check: { row },
  }
}

const GENERATORS: Record<Template, (rng: Rng, lang: Lang) => NumItem> = {
  'pct-change': pctChange,
  share,
  'per-capita': perCapita,
  currency,
  'largest-rise': largestRise,
  project,
}

export function generateItem(t: Template, rng: Rng, lang: Lang): NumItem {
  return GENERATORS[t](rng, lang)
}

/** One sitting: every template once, then random ones to make up 10, in shuffled order. */
export function buildNumericalTest(rng: Rng, lang: Lang): NumItem[] {
  const ts = [...TEMPLATES]
  while (ts.length < NUMERICAL.questions) ts.push(TEMPLATES[int(rng, 0, TEMPLATES.length - 1)])
  return shuffle(ts, rng).map((t) => generateItem(t, rng, lang))
}

export function scoreNumerical(items: NumItem[], answers: (number | undefined)[]): number {
  return items.reduce((s, it, i) => s + (answers[i] === it.correct ? 1 : 0), 0)
}

/** A table cell in the item's language: integers grouped, decimals to one place. */
export function formatCell(n: number, lang: Lang): string {
  return num(n, lang, Number.isInteger(n) ? 0 : 1)
}
