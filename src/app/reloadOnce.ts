/**
 * Load a lazy chunk; if it is gone (an old cached shell after a deploy), reload the page once
 * to pick up the new build. A successful load clears the flag so a later deploy in the same tab
 * gets its reload too; a failure right after a reload (offline) resolves to `fallback` instead of
 * throwing, since an uncaught lazy rejection unmounts the whole tree.
 */
export function reloadOnce<T>(
  load: () => Promise<T>,
  key: string,
  fallback: T,
  reload: () => void = () => location.reload(),
): Promise<T> {
  return load().then(
    (m) => {
      sessionStorage.removeItem(key)
      return m
    },
    () => {
      if (sessionStorage.getItem(key)) return fallback
      sessionStorage.setItem(key, '1')
      reload()
      return new Promise<never>(() => {})
    },
  )
}
