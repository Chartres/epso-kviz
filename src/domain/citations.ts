import registry from '@data/sources/registry.json'
import type { Citation } from './types'

export interface SourceDoc {
  short: string
  title: string
  celex: string
  url: string
}

export const SOURCES: Record<string, SourceDoc> = registry.docs

/** Shortest quote accepted: long enough that a verbatim match means something. */
export const MIN_QUOTE_LENGTH = 30

/** Collapse whitespace and typographic variants so a wrapped or curly-quoted passage still matches. */
export function normalizeQuote(text: string): string {
  return text
    .replace(/[‘’]/g, "'")
    .replace(/[“”]/g, '"')
    .replace(/[‐-―−]/g, '-')
    .replace(/\s+/g, ' ')
    .trim()
}

export function citationLabel(c: Citation): string {
  return `${SOURCES[c.doc]?.short ?? c.doc}, ${c.ref}`
}

/** EUR-Lex ELI pages carry art_N / rct_N / anx_N anchors; other documents link to the top. */
export function citationUrl(c: Citation): string {
  const base = SOURCES[c.doc]?.url ?? ''
  if (!base.includes('/eli/')) return base
  const m = /^Art(?:icle)?\s+(\d+[a-z]?)/i.exec(c.ref)
  if (m) return `${base}#art_${m[1]}`
  const r = /^Recital\s+(\d+)/i.exec(c.ref)
  if (r) return `${base}#rct_${r[1]}`
  const a = /^Annex\s+([IVXLC]+)/i.exec(c.ref)
  if (a) return `${base}#anx_${a[1]}`
  return base
}
