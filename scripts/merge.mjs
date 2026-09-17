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
