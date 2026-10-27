import { describe, it, expect } from 'vitest'
import { emptyProgress, mergeProgress, type ProgressData } from './progress'
import { loadProgress, saveProgress, STORAGE_KEY } from './storage'
import { ALL_QUESTIONS } from './questions'
import {
  setCollected,
  isCollected,
  commonplaceEntries,
  commonplaceText,
  sanitizeCommonplace,
} from './commonplace'
import type { Citation } from './types'

const cited = ALL_QUESTIONS.filter((q) => q.verified && q.sources && q.sources.length > 1)
const q = cited[0]
const c0 = q.sources![0]
const c1 = q.sources![1]

const add = (p: ProgressData, c: Citation, qid: number, at: number) => setCollected(p, c, qid, true, at)
const remove = (p: ProgressData, c: Citation, at: number) => setCollected(p, c, 0, false, at)

describe('commonplace book', () => {
  it('collects and removes a passage', () => {
    let p = emptyProgress()
    expect(isCollected(p, c0)).toBe(false)
    p = add(p, c0, q.id, 100)
    expect(isCollected(p, c0)).toBe(true)
    expect(isCollected(p, c1)).toBe(false)
    p = remove(p, c0, 200)
    expect(isCollected(p, c0)).toBe(false)
  })

  it('identifies a passage by its text, so the same passage met in two cases is one entry', () => {
    let p = add(emptyProgress(), c0, q.id, 1)
    const sameText = { ...c0 } // e.g. cited again by another question
    expect(isCollected(p, sameText)).toBe(true)
    p = add(p, sameText, 9999, 2)
    expect(commonplaceEntries(p).flatMap((g) => g.entries)).toHaveLength(1)
  })

  it('keeps the passage it collected even if the bank later changes', () => {
    const p = add(emptyProgress(), { doc: 'ai-act', ref: 'Art 5(1)', quote: 'a passage no question cites any longer, kept as collected' }, 424242, 1)
    const all = commonplaceEntries(p).flatMap((g) => g.entries)
    expect(all).toHaveLength(1)
    expect(all[0].quote).toMatch(/kept as collected/)
    expect(all[0].question).toBeNull()
  })

  it('files by act in registry order, then articles in numeric order, then recitals, then annexes', () => {
    let p = emptyProgress()
    const mk = (ref: string, n: number): Citation => ({ doc: 'ai-act', ref, quote: `passage number ${n} long enough to count` })
    for (const [i, ref] of ['Recital 26', 'Art 26(10)', 'Annex III', 'Art 26(6)', 'Art 5(1)', 'Recital 12'].entries())
      p = add(p, mk(ref, i), q.id, i)
    p = add(p, { doc: 'gdpr', ref: 'Art 35(3)', quote: 'a gdpr passage long enough to count here' }, q.id, 9)
    const groups = commonplaceEntries(p)
    expect(groups.map((g) => g.doc)).toEqual(['ai-act', 'gdpr'])
    expect(groups[0].entries.map((e) => e.ref)).toEqual([
      'Art 5(1)', 'Art 26(6)', 'Art 26(10)', 'Recital 12', 'Recital 26', 'Annex III',
    ])
  })

  it('exports exactly what is shown, with the reference under each passage', () => {
    const p = add(emptyProgress(), c0, q.id, 1)
    const text = commonplaceText(commonplaceEntries(p))
    expect(text).toContain(c0.quote)
    expect(text).toContain(c0.ref)
  })

  it('a removal on one device wins over an older copy on another after sync', () => {
    const phone = add(emptyProgress(), c0, q.id, 10)
    const laptop = remove(phone, c0, 50)
    expect(isCollected(mergeProgress(phone, laptop), c0)).toBe(false)
    expect(isCollected(mergeProgress(laptop, phone), c0)).toBe(false)
    const both = mergeProgress(add(emptyProgress(), c1, q.id, 5), phone)
    expect(isCollected(both, c0) && isCollected(both, c1)).toBe(true)
  })

  it('survives save/load and ignores malformed stored values', () => {
    saveProgress(add(emptyProgress(), c0, q.id, 1))
    expect(isCollected(loadProgress(), c0)).toBe(true)
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ ...emptyProgress(), commonplace: 'nonsense' }))
    expect(loadProgress().commonplace).toBeUndefined()
    expect(sanitizeCommonplace([{ doc: 'x' }, null, 3])).toEqual([])
    expect(() => mergeProgress({ ...emptyProgress(), commonplace: null as never }, emptyProgress())).not.toThrow()
  })
})
