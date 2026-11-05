/**
 * The unfinished round (Pavol's rule for all quiz apps, 2026-11-01).
 *
 * Every answer already counts in progress the moment it is given. This module keeps the
 * round itself, so a lesson or practice round left early waits on home with "Continue" and
 * "New round":
 *  - Continue resumes the same questions (option order is fixed, A–D) at the first unanswered.
 *  - New round replaces it.
 * Streaks and completion events count only a finished round (see `completionEvent`).
 * The exam simulation is never kept: left early, its answers stay in progress, with no attempt
 * and no score.
 *
 * The snapshot lives in this device's localStorage and is not synced; progress and Supabase
 * are unchanged.
 */
import type { CategoryName, Choice } from './types'
import { getQuestion, CATEGORY_NAMES } from './questions'
import { isFinished, type AnswerRecord, type SessionState } from './session'

export type ResumableMode = 'lesson' | 'practice' | 'review' | 'bookmarks'
export const RESUMABLE_MODES: ResumableMode[] = ['lesson', 'practice', 'review', 'bookmarks']

export function isResumable(mode: string | null): mode is ResumableMode {
  return (RESUMABLE_MODES as string[]).includes(mode ?? '')
}

export interface RoundSnapshot {
  v: 1
  mode: ResumableMode
  /** The round's questions, in order. */
  ids: number[]
  /** The answers given, in the order given. */
  answers: { id: number; choice: Choice }[]
  /** Practice only: the filter the round was built from, so "New round" rebuilds the same kind. */
  filter?: { categories: CategoryName[]; search: string }
}

export const ROUND_KEY = 'epso-kviz:round:v1'
const CHOICES: Choice[] = ['a', 'b', 'c', 'd']

/**
 * The snapshot to keep for this round, or null when there is nothing to resume: the exam,
 * a finished round, or a round with no answer yet.
 */
export function snapshotRound(
  mode: string | null,
  session: SessionState | null,
  filter?: { categories: Iterable<CategoryName>; search: string },
): RoundSnapshot | null {
  if (!session || !isResumable(mode) || isFinished(session) || session.records.length === 0) return null
  const snap: RoundSnapshot = {
    v: 1,
    mode,
    ids: session.questions.map((q) => q.id),
    answers: session.records.map((r) => ({ id: r.id, choice: r.choice })),
  }
  if (mode === 'practice' && filter) {
    snap.filter = { categories: [...filter.categories], search: filter.search }
  }
  return snap
}

/**
 * Rebuild the session: same questions, same answers, at the first unanswered question. If all
 * are answered (left on the last feedback), it opens on the last one so Finish counts the round.
 * Null if a question is no longer in the bank.
 */
export function restoreRound(snap: RoundSnapshot): SessionState | null {
  const questions = snap.ids.map((id) => getQuestion(id))
  if (questions.length === 0 || questions.some((q) => q === undefined)) return null
  const qs = questions as NonNullable<(typeof questions)[number]>[]
  const byId = new Map(qs.map((q) => [q.id, q]))
  const records: AnswerRecord[] = []
  const chosen: Record<number, Choice> = {}
  for (const a of snap.answers) {
    const q = byId.get(a.id)
    if (!q || chosen[a.id] !== undefined) continue
    records.push({ id: a.id, choice: a.choice, correct: a.choice === q.correct })
    chosen[a.id] = a.choice
  }
  const firstOpen = qs.findIndex((q) => chosen[q.id] === undefined)
  return { questions: qs, index: firstOpen === -1 ? qs.length - 1 : firstOpen, records, chosen }
}

export function answeredCount(snap: RoundSnapshot): number {
  return snap.answers.length
}

/** Accept only a well-formed snapshot (storage is user-writable and may be from an old build). */
export function sanitizeRound(raw: unknown): RoundSnapshot | null {
  if (!raw || typeof raw !== 'object') return null
  const r = raw as Record<string, unknown>
  if (r.v !== 1 || !isResumable(r.mode as string)) return null
  if (!Array.isArray(r.ids) || !r.ids.every((x) => Number.isInteger(x))) return null
  if (!Array.isArray(r.answers)) return null
  // Deduplicate ids so the restored round's total matches the displayed count.
  const ids = new Set(r.ids as number[])
  // Deduplicate answers (keep the first per id) so answeredCount never exceeds len(ids).
  const seenAnswers = new Set<number>()
  const answers = (r.answers as unknown[]).filter(
    (a): a is { id: number; choice: Choice } => {
      if (!a || typeof a !== 'object') return false
      const id = (a as { id: number }).id
      if (!ids.has(id) || !CHOICES.includes((a as { choice: Choice }).choice)) return false
      if (seenAnswers.has(id)) return false
      seenAnswers.add(id)
      return true
    },
  )
  if (answers.length === 0) return null
  const snap: RoundSnapshot = { v: 1, mode: r.mode as ResumableMode, ids: [...ids], answers }
  const f = r.filter as { categories?: unknown; search?: unknown } | undefined
  if (snap.mode === 'practice' && f && Array.isArray(f.categories)) {
    snap.filter = {
      categories: f.categories.filter(
        (c): c is CategoryName => typeof c === 'string' && (CATEGORY_NAMES as string[]).includes(c),
      ),
      search: typeof f.search === 'string' ? f.search : '',
    }
  }
  return snap
}

function storage(): Storage | null {
  try {
    return typeof localStorage !== 'undefined' ? localStorage : null
  } catch {
    return null
  }
}

export function loadRound(): RoundSnapshot | null {
  const s = storage()
  if (!s) return null
  try {
    const raw = s.getItem(ROUND_KEY)
    return raw ? sanitizeRound(JSON.parse(raw)) : null
  } catch {
    return null
  }
}

export function saveRound(snap: RoundSnapshot | null): void {
  const s = storage()
  if (!s) return
  try {
    if (snap) s.setItem(ROUND_KEY, JSON.stringify(snap))
    else s.removeItem(ROUND_KEY)
  } catch {
    // private mode / quota exceeded — the round lasts for this visit only
  }
}

export type CompletionEvent = 'exam_finish' | 'lesson_complete' | 'session_finish'

/**
 * The completion event for a round, or null if it is not finished. A finished exam is one the
 * candidate completed or the timer ended (it has a result); other rounds must reach the end.
 */
export function completionEvent(
  mode: string | null,
  session: SessionState | null,
  examResult: unknown,
): CompletionEvent | null {
  if (!session || !mode) return null
  if (mode === 'exam') return examResult ? 'exam_finish' : null
  if (!isFinished(session)) return null
  return mode === 'lesson' ? 'lesson_complete' : 'session_finish'
}
