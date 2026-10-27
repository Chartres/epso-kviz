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

const sitemap = await (await fetch(`https://${host}/sitemap.xml`)).text()
const urlList = [...sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1])
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
}
