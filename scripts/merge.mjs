// Merge data/bank/*.json into data/questions.json and refresh meta.json counts.
import { readFileSync, writeFileSync, readdirSync } from 'node:fs'

const dir = new URL('../data/', import.meta.url)
const bankDir = new URL('bank/', dir)
const meta = JSON.parse(readFileSync(new URL('meta.json', dir), 'utf8'))

const questions = readdirSync(bankDir)
  .filter((f) => f.endsWith('.json'))
  .flatMap((f) => JSON.parse(readFileSync(new URL(f, bankDir), 'utf8')))
  .sort((a, b) => a.id - b.id)

const ids = new Set()
for (const q of questions) {
  if (ids.has(q.id)) throw new Error(`duplicate id ${q.id}`)
  ids.add(q.id)
  for (const k of ['cat', 'q', 'a', 'b', 'c', 'd', 'correct', 'explain'])
    if (!q[k]) throw new Error(`question ${q.id} missing ${k}`)
  if (!'abcd'.includes(q.correct)) throw new Error(`question ${q.id} bad correct`)
}

// Option order in the bank is authoring order; the served order is a deterministic
// per-id shuffle so key position carries no signal.
const rand = (seed) => () => ((seed = (seed * 1664525 + 1013904223) >>> 0) / 2 ** 32)
for (const q of questions) {
  const r = rand(q.id * 2654435761)
  const opts = ['a', 'b', 'c', 'd'].map((k) => ({ text: q[k], right: k === q.correct }))
  for (let i = 3; i > 0; i--) {
    const j = Math.floor(r() * (i + 1))
    ;[opts[i], opts[j]] = [opts[j], opts[i]]
  }
  'abcd'.split('').forEach((k, i) => (q[k] = opts[i].text))
  q.correct = 'abcd'[opts.findIndex((o) => o.right)]
}

// Test-wiseness gates: a candidate must not be able to score by option length.
const len = (q, k) => q[k].length
const longest = questions.filter((q) => 'abcd'.split('').every((k) => len(q, q.correct) >= len(q, k))).length
const ratio =
  questions.reduce((s, q) => s + len(q, q.correct), 0) /
  (questions.reduce((s, q) => s + 'abcd'.split('').filter((k) => k !== q.correct).reduce((t, k) => t + len(q, k), 0), 0) / 3)
console.log(`correct-is-longest ${longest}/${questions.length}, correct/distractor length ratio ${ratio.toFixed(2)}`)
if (longest / questions.length > 0.4) throw new Error('length leak: correct option is the longest in >40% of questions')
if (ratio > 1.2) throw new Error('length leak: correct options average >1.2x distractor length')

for (const c of meta.categories) {
  const qs = questions.filter((q) => q.cat === c.name)
  if (!qs.length) throw new Error(`no questions for category ${c.name}`)
  c.count = qs.length
  c.range = [qs[0].id, qs[qs.length - 1].id]
}
meta.totalQuestions = questions.length

writeFileSync(new URL('questions.json', dir), JSON.stringify(questions, null, 1) + '\n')
writeFileSync(new URL('meta.json', dir), JSON.stringify(meta, null, 2) + '\n')
console.log(`merged ${questions.length} questions:`, meta.categories.map((c) => `${c.id}=${c.count}`).join(' '))
