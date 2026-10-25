import type { Question } from '@/domain/types'
import { ALL_QUESTIONS } from '@/domain/questions'
import { isEntitlementActive, type Entitlement } from './entitlement'

/** Questions per category in the free slice (3 × 20 = 60 of the bank). */
export const FREE_PER_CATEGORY = 20
/** Full timed mock exams a free user may take (drawn from the free slice). */
export const FREE_MOCK_EXAMS = 1

/**
 * The free slice: the lowest ids of each category. Deterministic, so a free
 * user's progress keeps pointing at the same questions across releases as long
 * as existing ids aren't renumbered.
 */
export function freeSlice(
  questions: readonly Question[],
  perCategory = FREE_PER_CATEGORY,
): Set<number> {
  const byCat = new Map<string, number[]>()
  for (const q of questions) {
    const list = byCat.get(q.cat) ?? []
    list.push(q.id)
    byCat.set(q.cat, list)
  }
  const ids: number[] = []
  for (const list of byCat.values()) {
    ids.push(...list.sort((a, b) => a - b).slice(0, perCategory))
  }
  return new Set(ids.sort((a, b) => a - b))
}

export type Tier = 'open' | 'free' | 'full'

export interface Access {
  /** open = paid tier switched off (today's behaviour); free / full when it's on. */
  tier: Tier
  /** Questions this user may draw from; null = all. */
  questionIds: Set<number> | null
  /** Timed mock exams allowed in total; null = unlimited. */
  mockExams: number | null
  /** Per-category progress breakdown on the Progress tab. */
  categoryStats: boolean
}

const UNLIMITED = { questionIds: null, mockExams: null, categoryStats: true }

export function resolveAccess(opts: {
  enabled: boolean
  entitlement: Entitlement | null
  now: number
}): Access {
  if (!opts.enabled) return { tier: 'open', ...UNLIMITED }
  if (isEntitlementActive(opts.entitlement, opts.now)) return { tier: 'full', ...UNLIMITED }
  return {
    tier: 'free',
    questionIds: freeSlice(ALL_QUESTIONS),
    mockExams: FREE_MOCK_EXAMS,
    categoryStats: false,
  }
}

export function canStartExam(access: Access, mocksUsed: number): boolean {
  return access.mockExams === null || mocksUsed < access.mockExams
}
