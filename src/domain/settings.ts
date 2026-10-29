/**
 * Learner settings, kept on this device next to progress (localStorage, versioned key).
 *
 * Question first (SIGNATURE.md): the stem appears alone and the options come once the
 * candidate has formed an answer. Pavol's pick (2026-10-29): B by default, switchable.
 *  - none: options shown with the stem (the behaviour before question first)
 *  - a:    tap to reveal the options
 *  - b:    write your answer in a few words, then compare with the options
 *  - c:    the options appear after a short hold
 * It never applies to the exam simulation, which has to match the real format.
 */
export type QuestionFirstMode = 'none' | 'a' | 'b' | 'c'

export const QUESTION_FIRST_MODES: QuestionFirstMode[] = ['none', 'a', 'b', 'c']
export const DEFAULT_QUESTION_FIRST: QuestionFirstMode = 'b'
/** Form C: seconds before the options appear. */
export const QUESTION_FIRST_HOLD_SECONDS = 8

export interface Settings {
  questionFirst: QuestionFirstMode
}

export const SETTINGS_KEY = 'epso-kviz:settings:v1'

export function defaultSettings(): Settings {
  return { questionFirst: DEFAULT_QUESTION_FIRST }
}

export function sanitizeSettings(raw: unknown): Settings {
  const s = defaultSettings()
  if (raw && typeof raw === 'object') {
    const q = (raw as Record<string, unknown>).questionFirst
    if (QUESTION_FIRST_MODES.includes(q as QuestionFirstMode)) s.questionFirst = q as QuestionFirstMode
  }
  return s
}

function storage(): Storage | null {
  try {
    return typeof localStorage !== 'undefined' ? localStorage : null
  } catch {
    return null
  }
}

export function loadSettings(): Settings {
  const s = storage()
  if (!s) return defaultSettings()
  try {
    const raw = s.getItem(SETTINGS_KEY)
    return raw ? sanitizeSettings(JSON.parse(raw)) : defaultSettings()
  } catch {
    return defaultSettings()
  }
}

export function saveSettings(settings: Settings): void {
  const s = storage()
  if (!s) return
  try {
    s.setItem(SETTINGS_KEY, JSON.stringify(settings))
  } catch {
    // private mode / quota exceeded — the setting lasts for this visit only
  }
}

/** The form a session actually uses: never anything but 'none' in the exam simulation. */
export function questionFirstFor(mode: string | null, setting: QuestionFirstMode): QuestionFirstMode {
  return mode === 'exam' ? 'none' : setting
}
