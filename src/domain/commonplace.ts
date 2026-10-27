import type { Citation } from './types'
import { getQuestion } from './questions'
import { SOURCES, citationLabel } from './citations'
import type { CommonplaceEntry, ProgressData } from './progress'

/**
 * The commonplace book (Erasmus, De Copia, 1512; Locke, 1706): the learner's own collection
 * of verbatim passages from the law, met while working a case and filed by act and article.
 *
 * An entry is the passage itself (act, reference, quote), keyed by act + quote, so the same
 * passage met in two cases is one entry and later bank edits can't change what was
 * collected. Each entry carries an on/off state and the time of its last change; sync keeps
 * the latest change, so a removal on one device carries over to the others.
 */

const keyOf = (c: { doc: string; quote: string }) => `${c.doc}\u0000${c.quote}`

export function sanitizeCommonplace(value: unknown): CommonplaceEntry[] {
  if (!Array.isArray(value)) return []
  return value.filter(
    (e): e is CommonplaceEntry =>
      !!e &&
      typeof e === 'object' &&
      typeof e.doc === 'string' &&
      typeof e.ref === 'string' &&
      typeof e.quote === 'string' &&
      typeof e.q === 'number' &&
      typeof e.at === 'number' &&
      typeof e.on === 'boolean',
  )
}

function find(p: ProgressData, c: Citation): CommonplaceEntry | undefined {
  const k = keyOf(c)
  return sanitizeCommonplace(p.commonplace).find((e) => keyOf(e) === k)
}

export function isCollected(p: ProgressData, c: Citation): boolean {
  return find(p, c)?.on ?? false
}

/** Put a passage in (on) or take it out (off). Idempotent: setting the current state is a no-op. */
export function setCollected(
  p: ProgressData,
  c: Citation,
  questionId: number,
  on: boolean,
  now: number,
): ProgressData {
  const prev = find(p, c)
  if ((prev?.on ?? false) === on) return p
  const k = keyOf(c)
  const rest = sanitizeCommonplace(p.commonplace).filter((e) => keyOf(e) !== k)
  const entry: CommonplaceEntry = {
    doc: c.doc,
    ref: c.ref,
    quote: c.quote,
    q: on ? questionId : (prev?.q ?? questionId),
    at: now,
    on,
  }
  return { ...p, commonplace: [...rest, entry] }
}

/** Sync merge: per passage, the latest change wins (so removals propagate). */
export function mergeCommonplace(a: unknown, b: unknown): CommonplaceEntry[] {
  const byKey = new Map<string, CommonplaceEntry>()
  for (const e of [...sanitizeCommonplace(a), ...sanitizeCommonplace(b)]) {
    const prev = byKey.get(keyOf(e))
    if (!prev || e.at > prev.at) byKey.set(keyOf(e), e)
  }
  return [...byKey.values()].sort((x, y) => x.at - y.at)
}

export interface CollectedPassage extends Citation {
  /** The case it was collected from, or null if that question is no longer in the bank. */
  question: string | null
  at: number
}

export interface CommonplaceGroup {
  doc: string
  title: string
  entries: CollectedPassage[]
}

/** Articles first, then recitals, then annexes, then anything else; natural order inside each. */
function refRank(ref: string): number {
  if (/^Art(icle)?\s/i.test(ref)) return 0
  if (/^Recital\s/i.test(ref)) return 1
  if (/^Annex\s/i.test(ref)) return 2
  return 3
}

const natural = (a: string, b: string) => a.localeCompare(b, 'en', { numeric: true })

export function commonplaceEntries(p: ProgressData): CommonplaceGroup[] {
  const groups = new Map<string, CollectedPassage[]>()
  for (const e of sanitizeCommonplace(p.commonplace)) {
    if (!e.on) continue
    const entry: CollectedPassage = {
      doc: e.doc,
      ref: e.ref,
      quote: e.quote,
      question: getQuestion(e.q)?.q ?? null,
      at: e.at,
    }
    groups.set(e.doc, [...(groups.get(e.doc) ?? []), entry])
  }
  const docOrder = Object.keys(SOURCES)
  const rank = (doc: string) => {
    const i = docOrder.indexOf(doc)
    return i === -1 ? docOrder.length : i
  }
  return [...groups.entries()]
    .sort(([a], [b]) => rank(a) - rank(b) || natural(a, b))
    .map(([doc, entries]) => ({
      doc,
      title: SOURCES[doc]?.title ?? doc,
      entries: entries.sort((x, y) => refRank(x.ref) - refRank(y.ref) || natural(x.ref, y.ref)),
    }))
}

/** Plain-text export of exactly what the book shows: one passage per paragraph, reference under it. */
export function commonplaceText(groups: CommonplaceGroup[]): string {
  return groups
    .map((g) =>
      [g.title.toUpperCase(), ...g.entries.map((e) => `“${e.quote}”\n— ${citationLabel(e)}`)].join('\n\n'),
    )
    .join('\n\n\n')
}
