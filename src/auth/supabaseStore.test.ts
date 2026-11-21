import { describe, it, expect, vi } from 'vitest'
import { emptyProgress } from '@/domain/progress'

const row = vi.hoisted(() => ({ data: null as unknown }))
vi.mock('./supabase', () => {
  const q = {
    select: () => q,
    eq: () => q,
    maybeSingle: async () => ({ data: row.data, error: null }),
  }
  return { supabase: { from: () => q } }
})

import { supabaseStore } from './supabaseStore'

describe('supabaseStore.fetch', () => {
  it('returns null when the account has no row', async () => {
    row.data = null
    await expect(supabaseStore.fetch('u')).resolves.toBeNull()
  })

  it('returns the progress when the row is readable', async () => {
    row.data = { data: emptyProgress() }
    await expect(supabaseStore.fetch('u')).resolves.toEqual(emptyProgress())
  })

  it('throws (like a failed fetch, so nothing is pushed) when a row exists but cannot be read', async () => {
    row.data = { data: { version: 99, stats: {} } }
    await expect(supabaseStore.fetch('u')).rejects.toThrow()
    row.data = { data: 'garbage' }
    await expect(supabaseStore.fetch('u')).rejects.toThrow()
  })
})
