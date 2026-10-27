// Submit every sitemap URL of the live site to IndexNow (Bing, Seznam, Yandex, Naver…).
// No account: the key is the public/<key>.txt file the site serves. Run after a deploy:
//   node scripts/indexnow.mjs            (dry run: prints the payload)
//   node scripts/indexnow.mjs --submit   (POSTs to api.indexnow.org)
// Log each real submission in flywheel data/launch-log/epso-kviz.jsonl.
import { readdirSync } from 'node:fs'

const host = 'epsokviz.dravec.org'
const key = readdirSync(new URL('../public/', import.meta.url))
  .find((f) => /^[0-9a-f]{32}\.txt$/.test(f))
  ?.slice(0, 32)
if (!key) throw new Error('no IndexNow key file in public/')

const res0 = await fetch(`https://${host}/sitemap.xml`)
if (!res0.ok) throw new Error(`sitemap: HTTP ${res0.status}`)
const urlList = [...(await res0.text()).matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1])
if (urlList.length === 0) throw new Error('sitemap has no <loc> entries')
const body = { host, key, keyLocation: `https://${host}/${key}.txt`, urlList }

if (!process.argv.includes('--submit')) {
  console.log(JSON.stringify({ ...body, urlList: `${urlList.length} urls` }, null, 2))
} else {
  const res = await fetch('https://api.indexnow.org/indexnow', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json; charset=utf-8' },
    body: JSON.stringify(body),
  })
  console.log(`IndexNow: HTTP ${res.status} for ${urlList.length} urls`)
  // 200 OK and 202 Accepted are success; anything else (400, 403 key, 422, 429) is not.
  if (res.status !== 200 && res.status !== 202) process.exit(1)
}
