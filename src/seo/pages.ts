import type { Citation, Meta, Question } from '../domain/types'
import { labelFor, urlFor, type Sources } from '../domain/citationRefs.ts'

/**
 * Static pages prerendered at build time (scripts/prerender.ts), so search engines and AI
 * assistants, which mostly don't run JavaScript, can read and cite the verified material:
 * AI Act article pages, one page of questions per category, and a guide to the test.
 * Pure functions with type-only imports, so the plain-Node build script can run them.
 */

export interface SiteInput {
  questions: readonly Question[]
  sources: Sources
  meta: Meta
  /** https://host, no trailing slash. */
  base: string
  /** YYYY-MM-DD, used for sitemap lastmod. */
  date: string
  /** AI Act article titles ("Penalties"), keyed by number, read from the pinned text. */
  articleTitles?: Record<number, string>
}

export interface Page {
  path: string
  title: string
  description: string
  /** Inner HTML of <main>. */
  body: string
  jsonLd: Record<string, unknown>[]
}

const NOTICE_URL = 'https://eur-lex.europa.eu/eli/C/2026/4668/oj'
const APP = 'EPSO AI Field Trainer'

export function esc(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

/** The AI Act article a citation is about: its own "Art N", or the article an Omnibus change amends. */
export function articleOf(c: Citation): number | null {
  if (c.doc === 'ai-act') {
    const m = /^Art(?:icle)?\s+(\d+)/i.exec(c.ref)
    return m ? Number(m[1]) : null
  }
  if (c.doc === 'ai-omnibus') {
    const m = /AI Act Art(?:icle)?\s+(\d+)/i.exec(c.ref)
    return m ? Number(m[1]) : null
  }
  return null
}

const LETTERS = ['a', 'b', 'c', 'd'] as const

function questionHtml(q: Question, n: number, input: SiteInput): string {
  const opts = LETTERS.map((k) => `<li>${esc(q[k])}</li>`).join('')
  const src =
    q.verified && q.sources?.length
      ? `<div class="src">${q.sources
          .map(
            (c) =>
              `<figure><blockquote>${esc(c.quote)}</blockquote><figcaption><a href="${esc(urlFor(c, input.sources))}" rel="noopener">${esc(labelFor(c, input.sources))}</a></figcaption></figure>`,
          )
          .join('')}<p class="chk">Checked against the official text on ${esc(q.verified)}.</p></div>`
      : ''
  return `<article class="q" id="q${q.id}"><h3>${n}. ${esc(q.q)}</h3><ol type="A">${opts}</ol><p class="ans"><strong>Answer: ${q.correct.toUpperCase()}</strong> — ${esc(q[q.correct])}</p><p>${esc(q.explain)}</p>${src}</article>`
}

function quizLd(name: string, qs: readonly Question[], path: string, input: SiteInput) {
  return {
    '@context': 'https://schema.org',
    '@type': 'Quiz',
    name,
    url: input.base + path,
    inLanguage: 'en',
    learningResourceType: 'Practice problem',
    educationalUse: 'EPSO/AD/430/26 Field 1 (Artificial Intelligence) field-related MCQ preparation',
    isAccessibleForFree: true,
    hasPart: qs.map((q) => ({
      '@type': 'Question',
      eduQuestionType: 'Multiple choice',
      text: q.q,
      acceptedAnswer: { '@type': 'Answer', text: q[q.correct] },
      suggestedAnswer: LETTERS.filter((k) => k !== q.correct).map((k) => ({ '@type': 'Answer', text: q[k] })),
    })),
  }
}

const cta = `<p class="cta"><a href="/">Practise with spaced repetition, a 30-question timed mock and your likely-score range →</a></p>`

function articlePages(input: SiteInput): Page[] {
  const byArticle = new Map<number, { qs: Question[]; passages: Citation[] }>()
  for (const q of input.questions) {
    if (!q.verified) continue
    const seen = new Set<number>()
    for (const c of q.sources ?? []) {
      const n = articleOf(c)
      if (n === null) continue
      const entry = byArticle.get(n) ?? { qs: [], passages: [] }
      if (!entry.passages.some((p) => p.quote === c.quote)) entry.passages.push(c)
      if (!seen.has(n)) entry.qs.push(q)
      seen.add(n)
      byArticle.set(n, entry)
    }
  }
  const nums = [...byArticle.keys()].sort((a, b) => a - b)
  const name = (n: number) => {
    const t = input.articleTitles?.[n]
    return t ? `Article ${n} (${t})` : `Article ${n}`
  }

  const pages: Page[] = nums.map((n) => {
    const { qs, passages } = byArticle.get(n)!
    const path = `/ai-act/article-${n}/`
    const title = `AI Act ${name(n)}: official text and EPSO practice questions`
    return {
      path,
      title,
      description: `${qs.length} verified practice question${qs.length === 1 ? '' : 's'} on Article ${n} of the EU AI Act (Regulation (EU) 2024/1689, as amended by the Digital Omnibus 2026/1744), with the official passage quoted and linked to EUR-Lex.`,
      body:
        `<p class="crumb"><a href="/ai-act/">AI Act articles</a></p><h1>AI Act ${esc(name(n))}</h1>` +
        `<p>${qs.length} practice question${qs.length === 1 ? '' : 's'} for the EPSO/AD/430/26 Field 1 (Artificial Intelligence) test cite Article ${n} of Regulation (EU) 2024/1689. Every answer below was checked against the official text, and the passage that settles it is quoted under the explanation. Where the Digital Omnibus on AI (Regulation (EU) 2026/1744) changed the article, the amending text is quoted.</p>` +
        `<h2>The text</h2>` +
        passages
          .map(
            (c) =>
              `<figure><blockquote>${esc(c.quote)}</blockquote><figcaption><a href="${esc(urlFor(c, input.sources))}" rel="noopener">${esc(labelFor(c, input.sources))}</a></figcaption></figure>`,
          )
          .join('') +
        `<h2>Practice questions</h2>` +
        qs.map((q, i) => questionHtml(q, i + 1, input)).join('') +
        cta,
      jsonLd: [quizLd(title, qs, path, input)],
    }
  })

  const total = new Set(nums.flatMap((n) => byArticle.get(n)!.qs.map((q) => q.id))).size
  pages.unshift({
    path: '/ai-act/',
    title: 'EU AI Act article by article: verified practice questions for EPSO AD/430/26',
    description: `Practice questions on ${nums.length} articles of the EU AI Act, each answer checked against the official text of Regulation (EU) 2024/1689 and the Digital Omnibus on AI, for the EPSO AI field test.`,
    body:
      `<h1>The AI Act, article by article</h1><p>${total} verified practice questions on ${nums.length} articles of Regulation (EU) 2024/1689 (the AI Act), as amended by Regulation (EU) 2026/1744 (Digital Omnibus on AI). Each page quotes the official text and links it to EUR-Lex.</p><ul class="toc">` +
      nums
        .map((n) => `<li><a href="/ai-act/article-${n}/">${esc(name(n))}</a> — ${byArticle.get(n)!.qs.length} question${byArticle.get(n)!.qs.length === 1 ? '' : 's'}</li>`)
        .join('') +
      `</ul>` +
      cta,
    jsonLd: [],
  })
  return pages
}

function categoryPages(input: SiteInput): Page[] {
  return input.meta.categories.map((c) => {
    const all = input.questions.filter((q) => q.cat === c.name)
    const verified = all.filter((q) => q.verified)
    // Categories without verified questions yet show a fixed sample, labelled as such.
    const shown = verified.length ? verified : all.slice(0, 20)
    const path = `/questions/${c.id}/`
    const title = `${c.name}: ${shown.length} practice questions for EPSO AD/430/26 Field 1 (AI)`
    const intro = verified.length
      ? `${verified.length} of the ${all.length} questions in this category are verified: the answer was checked against the official text, and the passage that settles it is quoted. The others are in the trainer, marked as not yet verified.`
      : `A sample of ${shown.length} of the ${all.length} questions in this category. They rest on standard ML engineering practice and are not yet cited to pinned sources.`
    return {
      path,
      title,
      description: `${c.name} practice questions for the EPSO/AD/430/26 Field 1 (Artificial Intelligence) field-related test, with answers and explanations${verified.length ? ' checked against the official EU texts' : ''}.`,
      body: `<h1>${esc(c.name)}</h1><p>One of the three Annex II categories of the EPSO/AD/430/26 Field 1 test; the 30-question paper draws 10 from each. ${intro}</p>${shown.map((q, i) => questionHtml(q, i + 1, input)).join('')}${cta}`,
      jsonLd: [quizLd(title, shown, path, input)],
    }
  })
}

function guidePage(input: SiteInput): Page {
  const e = input.meta.exam
  const marked = Math.round(e.places * e.essayMultiple)
  const faq: [string, string][] = [
    [
      'How long is the AD/430/26 Field 1 field-related test, and how many questions does it have?',
      `${e.totalQuestions} multiple-choice questions in ${e.timeLimitMinutes} minutes, taken in your language 2, scored 0 to ${e.totalQuestions}.`,
    ],
    [
      'What is the pass mark?',
      `${e.passThreshold}/${e.totalQuestions}. Passing only keeps you in the ranking: the field-related test is the one test that ranks candidates, and only the top scorers go on.`,
    ],
    [
      'How many candidates go forward after the field-related test?',
      `The essay (EUFTE) is marked, and eligibility checked, for a number that in principle does not exceed ${e.essayMultiple} times the places sought. With ${e.places} places in Field 1, that is about ${marked} candidates, in descending order of their field-test score.`,
    ],
    [
      'Which other tests are there?',
      'Reasoning tests in your language 1: verbal (20 questions, 35 minutes, pass 10/20), numerical (10 questions, 20 minutes) and abstract (10 questions, 10 minutes) with a combined pass of 10/20. They are eliminatory. The EU free-text essay (EUFTE) is 40 minutes in language 2, pass 5/10. All tests are taken remotely.',
    ],
    [
      'What does the Field 1 test cover?',
      `The duties in Annex II of the notice, which this trainer groups as ${input.meta.categories.map((c) => c.name).join(', ')}.`,
    ],
    [
      'Does EPSO publish sample questions for the AI field test?',
      'No. EPSO publishes sample reasoning tests but no field-related MCQ samples and no syllabus beyond Annex II.',
    ],
    [
      'Is this trainer official?',
      'No. It is an unofficial, free study aid, not affiliated with EPSO or the European Commission.',
    ],
  ]
  const path = '/guide/ad-430-26-field-1/'
  return {
    path,
    title: 'EPSO AD/430/26 Field 1 (Artificial Intelligence): how the tests work',
    description: `The EPSO/AD/430/26 AI field test: ${e.totalQuestions} questions in ${e.timeLimitMinutes} minutes, pass ${e.passThreshold}/${e.totalQuestions}, the only ranking test; about ${marked} essays marked for ${e.places} places. Taken from the Notice of Competition.`,
    body:
      `<h1>EPSO/AD/430/26 Field 1 (Artificial Intelligence): how the tests work</h1>` +
      `<p>From the <a href="${NOTICE_URL}" rel="noopener">Notice of Competition, OJ C/2026/4668</a>. AD8, ${e.places} places in Field 1.</p>` +
      `<table><thead><tr><th>Test</th><th>Language</th><th>Format</th><th>Pass</th><th>Role</th></tr></thead><tbody>` +
      `<tr><td>Verbal reasoning</td><td>1</td><td>20 questions, 35 min</td><td>10/20</td><td>eliminatory</td></tr>` +
      `<tr><td>Numerical + abstract reasoning</td><td>1</td><td>10 q, 20 min + 10 q, 10 min</td><td>10/20 combined</td><td>eliminatory</td></tr>` +
      `<tr><td>Field-related MCQ</td><td>2</td><td>${e.totalQuestions} questions, ${e.timeLimitMinutes} min</td><td>${e.passThreshold}/${e.totalQuestions}</td><td><strong>ranking</strong></td></tr>` +
      `<tr><td>EU free-text essay (EUFTE)</td><td>2</td><td>40 min</td><td>5/10</td><td>eliminatory, marked for about ${marked}</td></tr>` +
      `</tbody></table>` +
      `<h2>Questions candidates ask</h2>` +
      faq.map(([q, a]) => `<h3>${esc(q)}</h3><p>${esc(a)}</p>`).join('') +
      `<h2>Practice material</h2><ul class="toc"><li><a href="/ai-act/">The AI Act, article by article</a></li>${input.meta.categories.map((c) => `<li><a href="/questions/${c.id}/">${esc(c.name)}</a></li>`).join('')}</ul>` +
      cta,
    jsonLd: [
      {
        '@context': 'https://schema.org',
        '@type': 'FAQPage',
        mainEntity: faq.map(([q, a]) => ({ '@type': 'Question', name: q, acceptedAnswer: { '@type': 'Answer', text: a } })),
      },
    ],
  }
}

export function buildSite(input: SiteInput): Page[] {
  return [guidePage(input), ...categoryPages(input), ...articlePages(input)]
}

const CSS = `:root{color-scheme:dark}body{margin:0;background:#0d0f13;color:#d6dae1;font:17px/1.6 system-ui,-apple-system,Segoe UI,sans-serif}
header,main,footer{max-width:46rem;margin:0 auto;padding:0 16px}header{padding-top:16px;display:flex;flex-wrap:wrap;gap:8px 20px;align-items:baseline}
header a{color:#e3c27a;text-decoration:none}header strong a{color:#f2f4f7;text-transform:uppercase;letter-spacing:.02em}
h1{font-size:28px;line-height:1.15;color:#f2f4f7}h2{font-size:20px;margin-top:48px;color:#f2f4f7}h3{font-size:17px;color:#f2f4f7}
a{color:#e3c27a}.crumb{font-size:13px;text-transform:uppercase;letter-spacing:.12em}
.q{border-top:1px solid #2a2f38;padding:24px 0}.q ol{padding-left:24px}.ans{color:#7fd1b4}
figure{margin:12px 0}blockquote{margin:0;padding-left:12px;border-left:2px solid #4a5160;font-family:Georgia,'Times New Roman',serif;font-style:italic;color:#b9bfca}
figcaption{padding-left:12px;font:13px ui-monospace,Menlo,monospace}.chk{font:13px ui-monospace,Menlo,monospace;color:#8b93a1}
table{border-collapse:collapse;width:100%;font-size:15px}td,th{border-bottom:1px solid #2a2f38;padding:8px 6px;text-align:left;vertical-align:top}
.cta{margin:48px 0;font-weight:600}footer{padding-bottom:48px;font-size:13px;color:#8b93a1}`

export function renderPage(p: Page, input: SiteInput): string {
  const url = input.base + p.path
  const ld = p.jsonLd.map((x) => `<script type="application/ld+json">${JSON.stringify(x).replace(/</g, '\\u003c')}</script>`).join('')
  return `<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<title>${esc(p.title)}</title><meta name="description" content="${esc(p.description)}">
<link rel="canonical" href="${url}"><link rel="icon" href="/favicon.svg" type="image/svg+xml">
<meta property="og:type" content="article"><meta property="og:title" content="${esc(p.title)}"><meta property="og:description" content="${esc(p.description)}"><meta property="og:url" content="${url}">
<style>${CSS}</style>${ld}</head>
<body><header><strong><a href="/">${APP}</a></strong><a href="/guide/ad-430-26-field-1/">How the test works</a><a href="/ai-act/">AI Act articles</a>${input.meta.categories.map((c) => `<a href="/questions/${c.id}/">${esc(c.name)}</a>`).join('')}</header>
<main>${p.body}</main>
<footer><p>Unofficial study aid, not affiliated with EPSO or the European Commission. Questions and explanations: CC BY-NC-SA 4.0. Quoted passages: © European Union, reused under Commission Decision 2011/833/EU, and other sources as credited.</p></footer>
</body></html>
`
}

export function sitemapXml(pages: Page[], input: SiteInput): string {
  const urls = ['/', ...pages.map((p) => p.path)]
  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.map((u) => `  <url><loc>${input.base}${u}</loc><lastmod>${input.date}</lastmod></url>`).join('\n')}
</urlset>
`
}

export function llmsTxt(pages: Page[], input: SiteInput): string {
  const e = input.meta.exam
  const verified = input.questions.filter((q) => q.verified).length
  const lines = [
    `# ${APP}`,
    '',
    `> Free, unofficial practice trainer for the EPSO/AD/430/26 competition, Field 1 (Artificial Intelligence): the field-related MCQ (${e.totalQuestions} questions, ${e.timeLimitMinutes} minutes, pass ${e.passThreshold}/${e.totalQuestions}, the only ranking test). Not affiliated with EPSO or the European Commission.`,
    '',
    `- ${input.questions.length} questions across the three Annex II categories: ${input.meta.categories.map((c) => `${c.name} (${c.count})`).join(', ')}.`,
    `- ${verified} of ${input.questions.length} are verified: the answer was checked against the official text (AI Act 2024/1689 as amended by the Digital Omnibus 2026/1744, and other EU texts), and the passage is quoted. AI-engineering questions are not yet cited.`,
    `- Features: daily 12-question lessons with spaced repetition, practice by category, a timed 30-question mock in the official composition, a likely-score range from first attempts only, and a commonplace book of collected passages.`,
    `- Free, no account needed, works offline. Source code: https://github.com/Chartres/epso-kviz`,
    '',
    '## Pages',
    '',
    ...pages.map((p) => `- [${p.title}](${input.base}${p.path})`),
    '',
  ]
  return lines.join('\n')
}
