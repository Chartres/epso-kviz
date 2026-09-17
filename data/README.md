# Question dataset — provenance

[`questions.json`](./questions.json) (180 questions) and [`meta.json`](./meta.json) cover the
EPSO/AD/430/26 competition Field 1 (Artificial Intelligence) syllabus (Annex II of the Notice
of Competition).

## Source of truth

- **Notice of Competition EPSO/AD/430/26**, Annex II (Field 1 — Artificial Intelligence),
  [OJ C/2026/4668](https://eur-lex.europa.eu/eli/C/2026/4668/oj).
- **Regulation (EU) 2024/1689** (AI Act) as amended by Regulation (EU) 2026/1744 (Digital
  Omnibus on AI).
- Standard ML engineering practice and the EU digital acquis primary sources, for the questions
  outside the two regulations above.

## Structure

- `bank/*.json` — one file per category (`engineering.json`, `governance.json`, `policy.json`),
  60 questions each, hand-authored against the sources above. Each question is
  `{id, cat, q, a, b, c, d, correct, explain}` — four options, a single correct letter, and a
  1–2 sentence rationale (`explain`) shown as control-of-error feedback after answering.
- `questions.json` + `meta.json` — merged/derived output. **Generated, do not hand-edit.**

## Regenerating

```bash
node scripts/merge.mjs
```

Merges `bank/*.json` into `questions.json` (sorted by id) and refreshes each category's
`count`/`range` plus `totalQuestions` in `meta.json`. Validates that every question has all
required fields and a valid `correct` letter before writing.
