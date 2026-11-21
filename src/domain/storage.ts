import { emptyProgress, sanitizeProgress, type ProgressData } from './progress'

export const STORAGE_KEY = 'epso-kviz:progress:v1'

/** localStorage, or null where it is missing or throws (SSR, some private modes). */
export function storage(): Storage | null {
  try {
    return typeof localStorage !== 'undefined' ? localStorage : null
  } catch {
    return null
  }
}

/** The parsed, sanitized value under `key`, or null if missing, unreadable or rejected. */
export function readJson<T>(key: string, sanitize: (raw: unknown) => T | null): T | null {
  const s = storage()
  if (!s) return null
  try {
    const raw = s.getItem(key)
    return raw ? sanitize(JSON.parse(raw)) : null
  } catch {
    return null
  }
}

/** Store `value` as JSON under `key`; null removes it. */
export function writeJson(key: string, value: unknown): void {
  const s = storage()
  if (!s) return
  try {
    if (value === null) s.removeItem(key)
    else s.setItem(key, JSON.stringify(value))
  } catch {
    // private mode / quota exceeded — degrade gracefully to in-memory only
  }
}

export function loadProgress(): ProgressData {
  return readJson(STORAGE_KEY, sanitizeProgress) ?? emptyProgress()
}

export function saveProgress(data: ProgressData): void {
  writeJson(STORAGE_KEY, data)
}
