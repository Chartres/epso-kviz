import type { Citation } from './types'

/**
 * Pure citation helpers with no imports beyond types, so the build-time prerender script
 * (plain Node) can share them with the app. `citations.ts` binds them to the registry.
 */

export interface SourceDoc {
  short: string
  title: string
  celex: string
  url: string
}

export type Sources = Record<string, SourceDoc>

export function labelFor(c: Citation, sources: Sources): string {
  return `${sources[c.doc]?.short ?? c.doc}, ${c.ref}`
}

/** EUR-Lex ELI pages carry art_N / rct_N / anx_N anchors; other documents link to the top. */
export function urlFor(c: Citation, sources: Sources): string {
  const base = sources[c.doc]?.url ?? ''
  if (!base.includes('/eli/')) return base
  const m = /^Art(?:icle)?\s+(\d+[a-z]?)/i.exec(c.ref)
  if (m) return `${base}#art_${m[1]}`
  const r = /^Recital\s+(\d+)/i.exec(c.ref)
  if (r) return `${base}#rct_${r[1]}`
  const a = /^Annex\s+([IVXLC]+)/i.exec(c.ref)
  if (a) return `${base}#anx_${a[1]}`
  return base
}
