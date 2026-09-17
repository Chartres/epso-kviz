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
}

export interface Meta {
  source: string
  sourceUrl: string
  totalQuestions: number
  categories: Category[]
  exam: ExamConfig
  duplicatePairs: [number, number][]
}
