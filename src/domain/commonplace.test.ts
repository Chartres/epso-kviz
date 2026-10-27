import { describe, it, expect } from 'vitest'
import { emptyProgress, mergeProgress } from './progress'
import { loadProgress, saveProgress } from './storage'
import { ALL_QUESTIONS } from './questions'
import {
  toggleCommonplace,
  isCollected,
  commonplaceEntries,
  commonplaceText,
} from './commonplace'

const cited = ALL_QUESTIONS.filter((q) => q.verified && q.sources && q.sources.length > 1)
const q = cited[0]

describe('commonplace book', () => {
  it('starts empty and collects a passage by question and citation index', () => {
    let p = emptyProgress()
    expect(isCollected(p, q.id, 1)).toBe(false)
    p = toggleCommonplace(p, q.id, 1, 100)
    expect(isCollected(p, q.id, 1)).toBe(true)
    expect(isCollected(p, q.id, 0)).toBe(false)
    p = toggleCommonplace(p, q.id, 1, 200)
    expect(isCollected(p, q.id, 1)).toBe(false)
  })

  it('files entries by source document, then by reference, with the case they came from', () => {
    let p = emptyProgress()
    p = toggleCommonplace(p, q.id, 0, 1)
    p = toggleCommonplace(p, cited[1].id, 0, 2)
    const groups = commonplaceEntries(p)
    const all = groups.flatMap((g) => g.entries)
    expect(all).toHaveLength(2)
    expect(all.map((e) => e.quote)).toContain(q.sources![0].quote)
    expect(all.find((e) => e.questionId === q.id)!.question).toBe(q.q)
    for (const g of groups) expect(g.title.length).toBeGreaterThan(0)
  })

  it('skips entries whose question or citation no longer exists', () => {
    let p = emptyProgress()
    p = toggleCommonplace(p, 999999, 0, 1)
    p = toggleCommonplace(p, q.id, 9, 1)
    expect(commonplaceEntries(p)).toEqual([])
  })

  it('exports as plain text with the reference under each passage', () => {
    let p = toggleCommonplace(emptyProgress(), q.id, 0, 1)
    const text = commonplaceText(p)
    expect(text).toContain(q.sources![0].quote)
    expect(text).toContain(q.sources![0].ref)
  })

  it('survives a save/load round trip and a sync merge (union, earliest kept)', () => {
    const a = toggleCommonplace(emptyProgress(), q.id, 0, 10)
    const b = toggleCommonplace(emptyProgress(), cited[1].id, 0, 20)
    saveProgress(a)
    expect(isCollected(loadProgress(), q.id, 0)).toBe(true)
    const merged = mergeProgress(a, b)
    expect(isCollected(merged, q.id, 0)).toBe(true)
    expect(isCollected(merged, cited[1].id, 0)).toBe(true)
  })
})
