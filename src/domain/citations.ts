import registry from '@data/sources/registry.json'
import type { Citation } from './types'
import { labelFor, urlFor, type SourceDoc } from './citationRefs'

export type { SourceDoc }

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
  return labelFor(c, SOURCES)
}

export function citationUrl(c: Citation): string {
  return urlFor(c, SOURCES)
}
