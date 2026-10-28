import { describe, expect, it, vi } from 'vitest'
import { beaconScript } from './beacon'

const CFG = { url: 'https://abc.supabase.co', key: 'sb_publishable_x', app: 'epso-kviz' }

function memory(seed: Record<string, string> = {}) {
  const m = new Map(Object.entries(seed))
  return { getItem: (k: string) => m.get(k) ?? null, setItem: (k: string, v: string) => void m.set(k, v), m }
}

/** Run the inline script against stubbed browser globals; returns what it sent and the click handler. */
function run(opts: { webdriver?: boolean; userAgent?: string; vid?: string } = {}) {
  const fetch = vi.fn(() => Promise.resolve())
  let onClick: ((e: { target: unknown }) => void) | undefined
  const document = { addEventListener: (_: string, fn: typeof onClick) => (onClick = fn) }
  const local = memory(opts.vid ? { 'fw:vid': opts.vid } : {})
  const session = memory()
  const nav = { webdriver: opts.webdriver ?? false, userAgent: opts.userAgent ?? 'Mozilla/5.0 (iPhone) Safari/604.1' }
  const crypto = { randomUUID: () => 'new-uuid' }
  const location = { pathname: '/ai-act/article-5/' }
  new Function('navigator', 'localStorage', 'sessionStorage', 'fetch', 'location', 'document', 'crypto', beaconScript(CFG))(
    nav, local, session, fetch, location, document, crypto,
  )
  const sent = () =>
    (fetch.mock.calls as unknown as [string, RequestInit][]).map(([u, init]) => ({ url: u, init, row: JSON.parse(init.body as string) }))
  return { fetch, sent, onClick: () => onClick, local }
}

describe('static page beacon', () => {
  it('sends one page_view with the path, as the app client would (same table, headers, visitor id)', () => {
    const { sent } = run({ vid: 'visitor-1' })
    expect(sent()).toHaveLength(1)
    const [{ url, init, row }] = sent()
    expect(url).toBe('https://abc.supabase.co/rest/v1/events')
    expect(init.method).toBe('POST')
    expect(init.keepalive).toBe(true)
    expect(init.headers).toMatchObject({ apikey: 'sb_publishable_x', Authorization: 'Bearer sb_publishable_x' })
    expect(row).toMatchObject({
      app: 'epso-kviz',
      event: 'page_view',
      props: { path: '/ai-act/article-5/', static: true },
      visitor_id: 'visitor-1',
      session_id: 'new-uuid',
      flywheel_uid: null,
    })
    expect(typeof row.created_at).toBe('string')
  })

  it('creates the shared visitor id when there is none', () => {
    const { local } = run()
    expect(local.m.get('fw:vid')).toBe('new-uuid')
  })

  it('sends nothing from automated browsers (webdriver, crawlers, headless)', () => {
    expect(run({ webdriver: true }).fetch).not.toHaveBeenCalled()
    expect(run({ userAgent: 'Mozilla/5.0 (compatible; Googlebot/2.1)' }).fetch).not.toHaveBeenCalled()
    expect(run({ userAgent: 'HeadlessChrome/131' }).fetch).not.toHaveBeenCalled()
  })

  it('reports opening a cited source as key_action source_open', () => {
    const { sent, onClick } = run()
    const link = { dataset: { doc: 'ai-act', ref: 'Art 5(1)' } }
    onClick()!({ target: { closest: (sel: string) => (sel === 'a[data-doc]' ? link : null) } })
    expect(sent()[1].row).toMatchObject({
      event: 'key_action',
      props: { action: 'source_open', doc: 'ai-act', ref: 'Art 5(1)', from: 'static', path: '/ai-act/article-5/', static: true },
    })
  })

  it('ignores other clicks', () => {
    const { sent, onClick } = run()
    onClick()!({ target: { closest: () => null } })
    expect(sent()).toHaveLength(1)
  })
})
