export type Choice = 'a' | 'b' | 'c' | 'd'

export type CategoryName =
  | 'AI Engineering & Operations'
  | 'AI Act & Governance'
  | 'EU Digital Policy & Strategy'

export type ExamGroup = 'engineering' | 'governance' | 'policy'

export interface Question {
  id: number
  cat: CategoryName
  q: string
  a: string
  b: string
  c: string
  d: string
  correct: Choice
  explain: string
  /** Primary-source citations; each quote is checked verbatim against data/sources/ in CI. */
  sources?: Citation[]
  /** YYYY-MM-DD when the answer and its citations were last checked against the sources. */
  verified?: string
}

export interface Citation {
  /** Key into data/sources/registry.json. */
  doc: string
  /** Human reference: "Art 99(3)", "Recital 12", "Annex III", "Section 2". */
  ref: string
  /** Verbatim passage from the source that supports the correct answer. */
  quote: string
}

export interface Category {
  id: string
  name: CategoryName
  group: ExamGroup
  range: [number, number]
  count: number
}

export interface ExamCompositionPart {
  group: ExamGroup
  categories: CategoryName[]
  count: number
}

export interface ExamConfig {
  totalQuestions: number
  composition: ExamCompositionPart[]
  passThreshold: number
  timeLimitMinutes: number
  /** Successful candidates sought in this field (notice, Table 1). */
  places: number
  /** Essays marked for at most this multiple of `places`, in ranking order (notice 4.3.3(c)). */
  essayMultiple: number
  notice: string
}

export interface Meta {
  source: string
  sourceUrl: string
  totalQuestions: number
  categories: Category[]
  exam: ExamConfig
  duplicatePairs: [number, number][]
}
