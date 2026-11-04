/**
 * Paths the service worker must not answer with the app shell: the prerendered pages
 * (scripts/prerender.ts) are real documents. pages.test.ts checks every page matches.
 */
export const STATIC_PAGE_PREFIXES = ['ai-act', 'acts', 'questions', 'guide'] as const

export const NAVIGATE_FALLBACK_DENYLIST: RegExp[] = [
  new RegExp(`^/(${STATIC_PAGE_PREFIXES.join('|')})(/|$)`),
  /^\/llms\.txt$/,
  /^\/sitemap\.xml$/,
]
