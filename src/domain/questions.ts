import rawQuestions from '@data/questions.json'
import rawMeta from '@data/meta.json'
import type {
  CategoryName,
  ExamGroup,
  Meta,
  Question,
} from './types'

export const ALL_QUESTIONS = rawQuestions as unknown as Question[]
export const META = rawMeta as unknown as Meta

const BY_ID = new Map<number, Question>(ALL_QUESTIONS.map((q) => [q.id, q]))

export function getQuestion(id: number): Question | undefined {
  return BY_ID.get(id)
}

export function byCategory(cat: CategoryName): Question[] {
  return ALL_QUESTIONS.filter((q) => q.cat === cat)
}

const GROUP_CATEGORIES: Record<ExamGroup, CategoryName[]> = {
  engineering: ['AI Engineering & Operations'],
  governance: ['AI Act & Governance'],
  policy: ['EU Digital Policy & Strategy'],
}

export function questionsForGroup(group: ExamGroup): Question[] {
  const cats = new Set<CategoryName>(GROUP_CATEGORIES[group])
  return ALL_QUESTIONS.filter((q) => cats.has(q.cat))
}

export const CATEGORY_NAMES: CategoryName[] = META.categories.map((c) => c.name)
