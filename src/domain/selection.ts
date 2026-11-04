import type { CategoryName, Question } from './types'
import { ALL_QUESTIONS, getQuestion } from './questions'
import { shuffle, type Rng } from './rng'
import { dueForReview, statFor, type ProgressData } from './progress'

export function normalizeForSearch(text: string): string {
  return text
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '') // strip combining diacritics
    .toLowerCase()
}

export interface FilterOptions {
  categories?: Set<CategoryName>
  search?: string
}

export function filterQuestions(opts: FilterOptions): Question[] {
  const term = opts.search ? normalizeForSearch(opts.search.trim()) : ''
  return ALL_QUESTIONS.filter((q) => {
    if (opts.categories && opts.categories.size > 0 && !opts.categories.has(q.cat))
      return false
    if (term) {
      const hay = normalizeForSearch(q.q + ' ' + q.a + ' ' + q.b + ' ' + q.c + ' ' + q.d)
      if (!hay.includes(term)) return false
    }
    return true
  })
}

/** At most this share of a practice set is questions already answered (wrong or not mastered). */
export const PRACTICE_REVIEW_FRACTION = 0.4

/**
 * A practice set. Pavol's rule (2026-11-01): every answer counts the moment it is given, so a
 * new set skips what was answered. Due review (wrong, or not yet mastered) may come back, as a
 * minority of the set. Two exceptions serve the whole filtered pool, shuffled:
 *  - a search, which is a lookup for particular questions;
 *  - nothing left unanswered in the filter, so the button never serves an empty set.
 */
export function buildPractice(opts: FilterOptions, rng: Rng, progress?: ProgressData): Question[] {
  const pool = filterQuestions(opts)
  if (!progress || opts.search?.trim()) return shuffle(pool, rng)
  const unseen = pool.filter((q) => statFor(progress, q.id).seen === 0)
  if (unseen.length === 0) return shuffle(pool, rng)
  const inPool = new Map(pool.map((q) => [q.id, q]))
  const cap = Math.floor((unseen.length * PRACTICE_REVIEW_FRACTION) / (1 - PRACTICE_REVIEW_FRACTION))
  const review = dueForReview(progress, 0)
    .map((id) => inPool.get(id))
    .filter((q): q is Question => q !== undefined)
    .slice(0, cap)
  return shuffle([...unseen, ...review], rng)
}

export function reviewQuestions(p: ProgressData, now = 0): Question[] {
  return dueForReview(p, now)
    .map((id) => getQuestion(id))
    .filter((q): q is Question => q !== undefined)
}

export function bookmarkedQuestions(p: ProgressData): Question[] {
  return p.bookmarks
    .map((id) => getQuestion(id))
    .filter((q): q is Question => q !== undefined)
}
