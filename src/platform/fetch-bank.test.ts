import { describe, it, expect } from 'vitest'

// The build-time bank fetch (scripts/fetch-bank.mjs), off until Pavol moves the bank.
const { bankConfig, jsonFiles, DEFAULT_REPO } = (await import('../../scripts/fetch-bank.mjs' as string)) as {
  bankConfig: (env: Record<string, string | undefined>, o?: { allowLocal?: boolean }) => {
    mode: 'skip' | 'local' | 'fetch'
    repo?: string
    ref?: string
    token?: string
  }
  jsonFiles: (listing: unknown) => string[]
  DEFAULT_REPO: string
}

describe('fetch-bank', () => {
  it('does nothing while the flag is off (today: the local bank is used)', () => {
    expect(bankConfig({}).mode).toBe('skip')
    expect(bankConfig({ EPSO_BANK_TOKEN: 'x' }).mode).toBe('skip')
  })

  it('needs a token once on, unless a local run allows the local copy', () => {
    expect(() => bankConfig({ EPSO_BANK_SOURCE: 'github' })).toThrow(/EPSO_BANK_TOKEN/)
    expect(bankConfig({ EPSO_BANK_SOURCE: 'github' }, { allowLocal: true }).mode).toBe('local')
  })

  it('fetches from Chartres/epso-bank@main by default', () => {
    expect(bankConfig({ EPSO_BANK_SOURCE: 'github', EPSO_BANK_TOKEN: 't' })).toEqual({
      mode: 'fetch',
      repo: DEFAULT_REPO,
      ref: 'main',
      token: 't',
    })
    expect(DEFAULT_REPO).toBe('Chartres/epso-bank')
  })

  it('rejects an unknown source or a malformed repo', () => {
    expect(() => bankConfig({ EPSO_BANK_SOURCE: 's3' })).toThrow(/github/)
    expect(() =>
      bankConfig({ EPSO_BANK_SOURCE: 'github', EPSO_BANK_TOKEN: 't', EPSO_BANK_REPO: 'https://x/y' }),
    ).toThrow(/owner\/name/)
  })

  it('copies only plain .json files from a listing', () => {
    expect(
      jsonFiles([
        { type: 'file', name: 'policy.json' },
        { type: 'file', name: 'engineering.json' },
        { type: 'dir', name: 'old.json' },
        { type: 'file', name: 'README.md' },
        { type: 'file', name: '../evil.json' },
      ]),
    ).toEqual(['engineering.json', 'policy.json'])
    expect(() => jsonFiles({ message: 'Not Found' })).toThrow()
  })
})
