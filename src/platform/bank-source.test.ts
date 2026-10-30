import { describe, it, expect } from 'vitest'

// Which bank merge.mjs reads: the full bank in data/bank/ (fetched from the private repo, or
// Pavol's local copy), else the public sample in data/sample/ (docs/plans/private-bank.md).
const { bankSource } = (await import('../../scripts/bank-source.mjs' as string)) as {
  bankSource: (dataDir: URL, list?: (dir: URL) => string[]) => { dir: URL; sample: boolean }
}

const data = new URL('file:///repo/data/')
const lister = (bank: string[]) => (dir: URL) => (dir.pathname.endsWith('/bank/') ? bank : [])

describe('bank-source', () => {
  it('uses data/bank/ when it holds JSON', () => {
    const s = bankSource(data, lister(['governance.json']))
    expect(s.sample).toBe(false)
    expect(s.dir.href).toBe('file:///repo/data/bank/')
  })

  it('falls back to the public sample when data/bank/ is missing or has no JSON', () => {
    for (const bank of [[], ['README.md']]) {
      const s = bankSource(data, lister(bank))
      expect(s.sample).toBe(true)
      expect(s.dir.href).toBe('file:///repo/data/sample/')
    }
  })
})
