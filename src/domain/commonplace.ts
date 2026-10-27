import type { Citation, Question } from './types'
import { getQuestion } from './questions'
import { SOURCES, citationLabel } from './citations'
import type { CommonplaceEntry, ProgressData } from './progress'

/**
 * The commonplace book (Erasmus, De Copia, 1512; Locke, 1706): the learner's own collection
 * of verbatim passages from the law, met while working a case and filed by act and article.
 * Entries point at (question, citation index), so the passage is always the verified text.
 */

export function isCollected(p: ProgressData, q: number, i: number): boolean {
  return (p.commonplace ?? []).some((e) => e.q === q && e.i === i)
}

export function toggleCommonplace(p: ProgressData, q: number, i: number, now: number): ProgressData {
  const list = p.commonplace ?? []
  const next = isCollected(p, q, i)
    ? list.filter((e) => !(e.q === q && e.i === i))
    : [...list, { q, i, at: now }]
  return { ...p, commonplace: next }
}

export interface CollectedPassage extends Citation {
  questionId: number
  /** Index into the question's `sources`. */
  index: number
  /** The case the passage came from. */
  question: string
  at: number
}

export interface CommonplaceGroup {
  doc: string
  title: string
  entries: CollectedPassage[]
}

function resolve(e: CommonplaceEntry): CollectedPassage | null {
  const q: Question | undefined = getQuestion(e.q)
  const c = q?.verified ? q.sources?.[e.i] : undefined
  if (!q || !c) return null
  return { ...c, questionId: q.id, index: e.i, question: q.q, at: e.at }
}

/** Article numbers sort as numbers ("Art 5" before "Art 26"), everything else after, by text. */
function refKey(ref: string): [number, string] {
  const m = /^(?:Art|Recital|Annex)\s+(\d+)/i.exec(ref)
  return [m ? Number(m[1]) : Number.MAX_SAFE_INTEGER, ref]
}

export function commonplaceEntries(p: ProgressData): CommonplaceGroup[] {
  const groups = new Map<string, CollectedPassage[]>()
  for (const e of p.commonplace ?? []) {
    const r = resolve(e)
    if (!r) continue
    groups.set(r.doc, [...(groups.get(r.doc) ?? []), r])
  }
  const docOrder = Object.keys(SOURCES)
  return [...groups.entries()]
    .sort(([a], [b]) => docOrder.indexOf(a) - docOrder.indexOf(b))
    .map(([doc, entries]) => ({
      doc,
      title: SOURCES[doc]?.title ?? doc,
      entries: entries.sort((x, y) => {
        const [nx, sx] = refKey(x.ref)
        const [ny, sy] = refKey(y.ref)
        return nx - ny || sx.localeCompare(sy)
      }),
    }))
}

/** Plain-text export: one passage per paragraph, reference underneath. */
export function commonplaceText(p: ProgressData): string {
  return commonplaceEntries(p)
    .map((g) =>
      [g.title.toUpperCase(), ...g.entries.map((e) => `“${e.quote}”\n— ${citationLabel(e)}`)].join('\n\n'),
    )
    .join('\n\n\n')
}
