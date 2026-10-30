# Question dataset — provenance

[`questions.json`](./questions.json) (231 questions) and [`meta.json`](./meta.json) cover the
EPSO/AD/430/26 competition Field 1 (Artificial Intelligence) syllabus (Annex II of the Notice
of Competition).

## Source of truth

- **Notice of Competition EPSO/AD/430/26**, Annex II (Field 1 — Artificial Intelligence),
  [OJ C/2026/4668](https://eur-lex.europa.eu/eli/C/2026/4668/oj).
- **Regulation (EU) 2024/1689** (AI Act) as amended by Regulation (EU) 2026/1744 (Digital
  Omnibus on AI).
- Standard ML engineering practice and the EU digital acquis primary sources, for the questions
  outside the two regulations above.

## Where the bank lives

Since 30 October 2026 `bank/` and `verification/` are in the private repo
`Chartres/epso-bank`. CI fetches them at build with a read-only token (`EPSO_BANK_TOKEN`,
`scripts/fetch-bank.mjs`), so the live site still has all 231 questions. Both folders and
`questions.json` are gitignored here.

Without the bank (a fresh clone, a fork PR), `npm ci` runs `merge.mjs`, which builds from
`sample/`: 30 questions, 10 per category, all already on the public question pages. The app,
the exam simulation and the unit tests run on it; the tests that pin bank-wide numbers skip,
and so does the e2e suite in CI. `meta.json` then carries `"sample": true`.

With access: `EPSO_BANK_SOURCE=github EPSO_BANK_TOKEN=… node scripts/fetch-bank.mjs && node scripts/merge.mjs`.

## Structure

- `bank/*.json` — one file per category (`engineering.json`, `governance.json`, `policy.json`),
  80, 78 and 73 questions, hand-authored against the sources above. Each question is
  `{id, cat, q, a, b, c, d, correct, explain}` — four options, a single correct letter, and a
  1–2 sentence rationale (`explain`) shown as control-of-error feedback after answering.
- Optional per question: `sources` — `[{doc, ref, quote}]`, where `doc` is a key in
  [`sources/registry.json`](./sources/registry.json), `ref` is "Art 99(3)" / "Recital 12" /
  "Annex III", and `quote` is a verbatim passage that supports the correct answer — and
  `verified` (YYYY-MM-DD), set only when the key and rationale were checked against those
  passages. An unverified question may keep partial quotes for the next pass; the app shows
  sources only on verified questions. `src/domain/citations.test.ts` fails CI if any quote is not found verbatim in the
  pinned text, or if verified coverage per category drops below its floor.
- `sources/*.txt` — plain-text snapshots of the official English texts (Publications Office,
  fetched 2026-10-25). Re-fetch and re-verify when an act is amended.
- `questions.json` + `meta.json` — merged/derived output. **Generated, do not hand-edit.**

## Regenerating

```bash
node scripts/merge.mjs
```

Merges `bank/*.json` into `questions.json` (sorted by id) and refreshes each category's
`count`/`range` plus `totalQuestions` in `meta.json`. Validates that every question has all
required fields and a valid `correct` letter before writing.
