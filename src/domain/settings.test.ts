import { describe, it, expect, beforeEach } from 'vitest'
import {
  DEFAULT_QUESTION_FIRST,
  SETTINGS_KEY,
  loadSettings,
  questionFirstFor,
  sanitizeSettings,
  saveSettings,
} from './settings'

describe('settings', () => {
  beforeEach(() => localStorage.clear())

  it('defaults to question-first form B (Pavol, 2026-10-29)', () => {
    expect(DEFAULT_QUESTION_FIRST).toBe('b')
    expect(loadSettings()).toEqual({ questionFirst: 'b' })
  })

  it('round-trips every mode through storage', () => {
    for (const m of ['none', 'a', 'b', 'c'] as const) {
      saveSettings({ questionFirst: m })
      expect(loadSettings().questionFirst).toBe(m)
    }
  })

  it('falls back to the default on unknown or broken data', () => {
    expect(sanitizeSettings({ questionFirst: 'z' })).toEqual({ questionFirst: 'b' })
    expect(sanitizeSettings(null)).toEqual({ questionFirst: 'b' })
    localStorage.setItem(SETTINGS_KEY, '{not json')
    expect(loadSettings()).toEqual({ questionFirst: 'b' })
  })

  it('never applies question first to the exam simulation', () => {
    for (const m of ['none', 'a', 'b', 'c'] as const) {
      expect(questionFirstFor('exam', m)).toBe('none')
      expect(questionFirstFor('practice', m)).toBe(m)
      expect(questionFirstFor('lesson', m)).toBe(m)
    }
  })
})
