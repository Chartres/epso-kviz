// Which bank scripts/merge.mjs reads (docs/plans/private-bank.md). The full bank lives in a
// private repo and lands in data/bank/ at build (scripts/fetch-bank.mjs), or is Pavol's local
// copy. Without it, a clone runs on the public sample in data/sample/.
import { existsSync, readdirSync } from 'node:fs'

const listDir = (url) => (existsSync(url) ? readdirSync(url) : [])

export function bankSource(dataDir, list = listDir) {
  const bank = new URL('bank/', dataDir)
  const full = list(bank).some((f) => f.endsWith('.json'))
  return full ? { dir: bank, sample: false } : { dir: new URL('sample/', dataDir), sample: true }
}
