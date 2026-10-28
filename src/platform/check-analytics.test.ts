// @vitest-environment node
import { describe, expect, it } from 'vitest'

const { hasProjectUrl } = (await import('../../scripts/check-analytics.mjs' as string)) as {
  hasProjectUrl: (js: string) => boolean
}

describe('analytics bundle guard', () => {
  it('passes when the build baked in a Supabase project URL', () => {
    expect(hasProjectUrl('const u="https://abcdefghijklmnopqrst.supabase.co";')).toBe(true)
  })

  it("fails on a build without the env, even though supabase-js carries its own '*.supabase.co' literal", () => {
    expect(hasProjectUrl('return t.push(`*.supabase.co`,`*.supabase.in`),t')).toBe(false)
  })
})
