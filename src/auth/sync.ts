import { mergeProgress, type ProgressData } from '@/domain/progress'

/** Abstraction over the cloud store so the sync logic is testable. */
export interface RemoteProgressStore {
  fetch(userId: string): Promise<ProgressData | null>
  save(userId: string, data: ProgressData): Promise<void>
}

const byKey = ([a]: [string, unknown], [b]: [string, unknown]) => (a < b ? -1 : a > b ? 1 : 0)

/**
 * JSON with object keys sorted (jsonb returns them reordered, e.g. commonplace entries) and
 * bookmarks sorted (a set: shuffled into rounds, looked up with includes). Other arrays keep order.
 */
function canonical(p: ProgressData): string {
  return JSON.stringify({ ...p, bookmarks: [...p.bookmarks].sort((a, b) => a - b) }, (_k, v) =>
    v && typeof v === 'object' && !Array.isArray(v) ? Object.fromEntries(Object.entries(v).sort(byKey)) : v,
  )
}

/**
 * Reconcile local and cloud progress: pull remote, merge (last-write-wins per
 * question, union bookmarks), push the merged result (unless the cloud already holds it), and return it. On any
 * network failure we keep working locally — sync is best-effort, never blocking.
 */
export async function syncProgress(
  store: RemoteProgressStore,
  userId: string,
  local: ProgressData,
): Promise<ProgressData> {
  let remote: ProgressData | null
  try {
    remote = await store.fetch(userId)
  } catch {
    return local
  }
  const merged = remote ? mergeProgress(local, remote) : local
  // Cloud already holds this: return its row as is (callers can tell by identity) and send nothing.
  if (remote && canonical(merged) === canonical(remote)) return remote
  try {
    await store.save(userId, merged)
  } catch {
    // keep the merged view locally even if the upload failed
  }
  return merged
}
