import { sanitizeCommonplace } from './commonplace'
import { emptyProgress, PROGRESS_VERSION, type ProgressData } from './progress'

export const STORAGE_KEY = 'epso-kviz:progress:v1'

function storage(): Storage | null {
  try {
    return typeof localStorage !== 'undefined' ? localStorage : null
  } catch {
    return null
  }
}

export function loadProgress(): ProgressData {
  const s = storage()
  if (!s) return emptyProgress()
  try {
    const raw = s.getItem(STORAGE_KEY)
    if (!raw) return emptyProgress()
    const parsed = JSON.parse(raw) as Partial<ProgressData>
    if (parsed.version !== PROGRESS_VERSION) return emptyProgress()
    const commonplace = sanitizeCommonplace(parsed.commonplace)
    return {
      version: PROGRESS_VERSION,
      stats: parsed.stats ?? {},
      bookmarks: parsed.bookmarks ?? [],
      ...(commonplace.length ? { commonplace } : {}),
      streak: {
        current: typeof parsed.streak?.current === 'number' ? parsed.streak.current : 0,
        best: typeof parsed.streak?.best === 'number' ? parsed.streak.best : 0,
        lastDate: typeof parsed.streak?.lastDate === 'string' ? parsed.streak.lastDate : '',
      },
      updatedAt: parsed.updatedAt ?? 0,
    }
  } catch {
    return emptyProgress()
  }
}

export function saveProgress(data: ProgressData): void {
  const s = storage()
  if (!s) return
  try {
    s.setItem(STORAGE_KEY, JSON.stringify(data))
  } catch {
    // private mode / quota exceeded — degrade gracefully to in-memory only
  }
}
