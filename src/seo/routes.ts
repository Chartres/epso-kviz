/**
 * Paths the service worker must not answer with the app shell: the prerendered pages
 * (scripts/prerender.ts) are real documents. pages.test.ts checks every page matches.
 */
export const STATIC_PAGE_PREFIXES = ['ai-act', 'acts', 'questions', 'guide'] as const

/** `base` is Vite's base ('/' or e.g. '/epso-kviz/'); Workbox tests the full pathname. */
export function navigateFallbackDenylist(base = '/'): RegExp[] {
  const b = base.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  return [
    new RegExp(`^${b}(${STATIC_PAGE_PREFIXES.join('|')})(/|$)`),
    new RegExp(`^${b}llms\\.txt$`),
    new RegExp(`^${b}sitemap\\.xml$`),
  ]
}

export const NAVIGATE_FALLBACK_DENYLIST: RegExp[] = navigateFallbackDenylist()
