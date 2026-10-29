// Fetch the question bank from a private repo at build time (docs/plans/private-bank.md).
//
// Off by default: with EPSO_BANK_SOURCE unset this does nothing and the build uses the local
// data/bank/ as it always has. Nothing calls this script yet; it waits for Pavol's go.
//
//   EPSO_BANK_SOURCE=github     turn it on
//   EPSO_BANK_TOKEN=...         fine-grained, read-only "Contents" on the bank repo
//   EPSO_BANK_REPO=owner/name   default Chartres/epso-bank
//   EPSO_BANK_REF=main          branch, tag or commit
//
// It copies bank/*.json and verification/*.json from the bank repo into data/, then the
// caller runs `node scripts/merge.mjs` to rebuild data/questions.json and meta.json.
// Usage: node scripts/fetch-bank.mjs [--allow-local]
//   --allow-local  if the flag is on but no token is set (a local dev run), keep the local copy
import { mkdirSync, writeFileSync } from 'node:fs'
import { pathToFileURL } from 'node:url'

export const DEFAULT_REPO = 'Chartres/epso-bank'
/** Folders in the bank repo, copied to data/<folder>/. */
export const FOLDERS = ['bank', 'verification']

/** Reads the env into a plan: skip (flag off), local (dev fallback) or fetch. Throws on bad config. */
export function bankConfig(env, { allowLocal = false } = {}) {
  const source = (env.EPSO_BANK_SOURCE ?? '').trim()
  if (!source) return { mode: 'skip', reason: 'EPSO_BANK_SOURCE unset: using the local data/bank/' }
  if (source !== 'github') throw new Error(`EPSO_BANK_SOURCE must be "github" or unset, got "${source}"`)
  const token = (env.EPSO_BANK_TOKEN ?? '').trim()
  if (!token) {
    if (allowLocal) return { mode: 'local', reason: 'no EPSO_BANK_TOKEN: keeping the local data/bank/' }
    throw new Error('EPSO_BANK_SOURCE=github needs EPSO_BANK_TOKEN (a read-only token on the bank repo)')
  }
  const repo = (env.EPSO_BANK_REPO ?? '').trim() || DEFAULT_REPO
  if (!/^[\w.-]+\/[\w.-]+$/.test(repo)) throw new Error(`EPSO_BANK_REPO must be owner/name, got "${repo}"`)
  const ref = (env.EPSO_BANK_REF ?? '').trim() || 'main'
  return { mode: 'fetch', repo, ref, token }
}

/** The JSON files worth copying from a GitHub contents listing. */
export function jsonFiles(listing) {
  if (!Array.isArray(listing)) throw new Error('expected a directory listing from the GitHub contents API')
  return listing
    .filter((e) => e.type === 'file' && /^[\w.-]+\.json$/.test(e.name))
    .map((e) => e.name)
    .sort()
}

async function get(url, token, accept) {
  const res = await fetch(url, {
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: accept,
      'X-GitHub-Api-Version': '2022-11-28',
      'User-Agent': 'epso-kviz-build',
    },
  })
  if (!res.ok) throw new Error(`${res.status} ${res.statusText} for ${url.replace(/\?.*$/, '')}`)
  return res
}

export async function fetchBank({ repo, ref, token }, dataDir = new URL('../data/', import.meta.url)) {
  const api = `https://api.github.com/repos/${repo}/contents`
  let total = 0
  for (const folder of FOLDERS) {
    const listing = await (await get(`${api}/${folder}?ref=${encodeURIComponent(ref)}`, token, 'application/vnd.github+json')).json()
    const names = jsonFiles(listing)
    if (folder === 'bank' && names.length === 0) throw new Error(`${repo}@${ref} has no bank/*.json`)
    const out = new URL(`${folder}/`, dataDir)
    mkdirSync(out, { recursive: true })
    for (const name of names) {
      const text = await (await get(`${api}/${folder}/${name}?ref=${encodeURIComponent(ref)}`, token, 'application/vnd.github.raw')).text()
      JSON.parse(text) // refuse to write anything that isn't JSON
      writeFileSync(new URL(name, out), text)
      total++
    }
  }
  return total
}

if (import.meta.url === pathToFileURL(process.argv[1] ?? '').href) {
  const plan = bankConfig(process.env, { allowLocal: process.argv.includes('--allow-local') })
  if (plan.mode !== 'fetch') {
    console.log(`fetch-bank: ${plan.reason}`)
  } else {
    const n = await fetchBank(plan)
    console.log(`fetch-bank: ${n} files from ${plan.repo}@${plan.ref}`)
  }
}
