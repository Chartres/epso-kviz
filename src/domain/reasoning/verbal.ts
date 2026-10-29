import { sample, shuffle, type Rng } from '../rng'
import type { Lang } from './numerical'
import passageData from '@data/verbal/passages.json'
import itemData from '@data/verbal/items.json'

/**
 * Verbal reasoning practice in the candidate's language 1. The format follows the Notice of
 * Competition EPSO/AD/430/26, Table 3: 20 questions in 35 minutes, pass 10/20. Passages are
 * recitals of EU acts taken verbatim from the Czech, Slovak and English Official Journal
 * editions (EUR-Lex), so all three languages read the same text. Each item is a statement
 * about its passage: true, false, or cannot say from the passage alone.
 */

export const VERBAL = { questions: 20, minutes: 35, pass: 10, perPassage: 4 } as const

export type Answer = 'true' | 'false' | 'cannot'
export const ANSWERS: Answer[] = ['true', 'false', 'cannot']

type L = Record<Lang, string>

export interface Passage {
  id: string
  celex: string
  recital: number
  act: L
  url: string
  text: L
}

export interface VerbalItem {
  id: string
  passage: string
  answer: Answer
  statement: L
  why: L
}

export const PASSAGES: Passage[] = passageData.passages
export const ITEMS: VerbalItem[] = itemData.items as VerbalItem[]
export const ATTRIBUTION: string = passageData.attribution

const byId = new Map(PASSAGES.map((p) => [p.id, p]))

export function passageOf(item: VerbalItem): Passage {
  const p = byId.get(item.passage)
  if (!p) throw new Error(`verbal item ${item.id}: no passage ${item.passage}`)
  return p
}

/**
 * One sitting: passages in random order, up to four statements from each, until 20.
 * Statements on the same passage stay together, so each passage is read once.
 */
export function buildVerbalTest(rng: Rng): VerbalItem[] {
  const out: VerbalItem[] = []
  for (const p of shuffle(PASSAGES, rng)) {
    const mine = ITEMS.filter((it) => it.passage === p.id)
    const take = Math.min(VERBAL.perPassage, mine.length, VERBAL.questions - out.length)
    out.push(...sample(mine, take, rng))
    if (out.length === VERBAL.questions) break
  }
  return out
}

export function scoreVerbal(items: VerbalItem[], answers: (Answer | undefined)[]): number {
  return items.reduce((s, it, i) => s + (answers[i] === it.answer ? 1 : 0), 0)
}
