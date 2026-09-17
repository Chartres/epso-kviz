// Rasterize PWA icons from the EU star mark using Playwright (no native SVG tools needed).
// Outputs to public/icons/. Run: node scripts/gen-icons.mjs
import { chromium } from '@playwright/test'
import { mkdirSync } from 'node:fs'

const OUT = 'public/icons'
mkdirSync(OUT, { recursive: true })

const STAR_POINTS =
  '16.00,6.50 18.13,13.06 25.04,13.06 19.45,17.12 21.58,23.69 16.00,19.63 10.42,23.69 12.55,17.12 6.96,13.06 13.87,13.06'

// The star, centred in a 32x32 box. `border` draws the framed look (for "any"
// icons); maskable omits it and bleeds the background to the edges (OS adds mask).
const star = (border) => `
  ${border ? '<rect x="1" y="1" width="30" height="30" rx="4" fill="none" stroke="#FFCC00" stroke-width="1" opacity="0.55"/>' : ''}
  <polygon points="${STAR_POINTS}" fill="#FFCC00"/>`

// markScale = fraction of the canvas the 32-unit mark occupies (rest is padding).
function pageSVG(px, bg, markScale, border) {
  const mark = px * markScale
  const off = (px - mark) / 2
  return `<!doctype html><meta charset="utf-8">
  <style>html,body{margin:0}#c{width:${px}px;height:${px}px;background:${bg}}</style>
  <div id="c"><svg width="${px}" height="${px}" viewBox="0 0 ${px} ${px}" xmlns="http://www.w3.org/2000/svg">
    <g transform="translate(${off} ${off}) scale(${mark / 32})">${star(border)}</g>
  </svg></div>`
}

const EU_BLUE = '#003399'

const jobs = [
  { file: 'icon-192.png', px: 192, bg: EU_BLUE, scale: 0.86, border: true },
  { file: 'icon-512.png', px: 512, bg: EU_BLUE, scale: 0.86, border: true },
  // maskable: full-bleed bg, mark in the ~60% safe zone, no frame
  { file: 'maskable-512.png', px: 512, bg: EU_BLUE, scale: 0.6, border: false },
  // apple touch icon: opaque, slight padding, no frame (iOS rounds corners itself)
  { file: 'apple-touch-icon.png', px: 180, bg: EU_BLUE, scale: 0.7, border: false },
]

const browser = await chromium.launch()
const page = await browser.newPage()
for (const j of jobs) {
  await page.setViewportSize({ width: j.px, height: j.px })
  await page.setContent(pageSVG(j.px, j.bg, j.scale, j.border))
  await page.locator('#c').screenshot({ path: `${OUT}/${j.file}` })
  console.log(`  ${OUT}/${j.file} (${j.px}px)`)
}
await browser.close()
console.log('icons done')
