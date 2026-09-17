# EPSO AI Field Trainer

**Live:** https://epsokviz.dravec.org

A free, self-paced trainer for the **EPSO/AD/430/26** competition's Field 1 (Artificial
Intelligence) multiple-choice test — the field-related MCQ, 30 questions in 40 minutes. It is
the sole test that ranks candidates in Field 1; the reasoning tests and EU essay are pass/fail
gates. 180 practice questions across the three Annex II duty categories, drilled the way the
exam is actually won: fast elimination on the real wording, learning from mistakes.

## Categories

- **AI Engineering & Operations** — MLOps, the ML lifecycle, GenAI architectures, evaluation and
  AI security.
- **AI Act & Governance** — Regulation (EU) 2024/1689 as amended by Regulation (EU) 2026/1744:
  risk tiers, prohibited practices, high-risk obligations, GPAI, governance bodies.
- **EU Digital Policy & Strategy** — the European AI Office, the wider EU digital acquis, and
  the EU's AI strategy (compute, adoption, funding).

60 questions per category (180 total); the exam simulation draws 10 from each (30 total).

## Highlights

- **Montessori learning design.** Practice and lesson modes give immediate *control-of-error*
  feedback — the correct answer plus a 1–2 sentence rationale (`explain`) appears the moment you
  answer, so a mistake becomes a teaching moment rather than a verdict. Progress is tracked as
  **mastery** (answered correctly twice in a row), not as a single score. Missed questions
  resurface via lightweight **spaced repetition** — drill exactly your weak spots.
- **Daily lesson.** A 12-question batch mixing due review with new material, weighted to the real
  exam composition. Builds a streak.
- **Real exam simulation.** 30 questions in the official composition (10 engineering + 10
  governance + 10 policy), 40-minute timer, pass at 15/30, per-category breakdown — no feedback
  during the exam, matching the real test.
- **Study guide.** 12 lessons covering the material behind every question, sourced from the AI
  Act, the Notice of Competition, and Commission policy documents.
- **Profiles & sync (optional).** Sign in with a magic-link email to sync progress across
  devices — offline-first, with conflict-free merge. Works fully without an account too.
- **Free hosting.** Static site on GitHub Pages; free-tier Supabase for auth/sync.

## Data sources

- Notice of Competition EPSO/AD/430/26, Annex II (Field 1 — Artificial Intelligence),
  [OJ C/2026/4668](https://eur-lex.europa.eu/eli/C/2026/4668/oj).
- Regulation (EU) 2024/1689 (AI Act) as amended by Regulation (EU) 2026/1744 (Digital Omnibus
  on AI).
- Standard ML engineering practice and EU digital-policy primary sources for the rest. See
  [`data/README.md`](data/README.md).

## Tech & engineering

- **React 19 + TypeScript + Vite 8**, **Tailwind v4** design tokens.
- **Test-driven** throughout (red → green): **Vitest** + React Testing Library for the domain
  and components, **Playwright** for end-to-end journeys.
- Pure, framework-free **domain layer** (`src/domain`): seeded RNG, quiz session, exam rules,
  mastery/spaced-repetition progress store, versioned storage, search/selection.
- **CI/CD:** GitHub Actions runs typecheck + tests + build, then deploys to Pages.

## Develop

```bash
npm install
npm run dev          # local dev server
npm test             # unit/component tests (watch: npm run test:watch)
npm run e2e          # Playwright end-to-end
npm run build        # production build
node scripts/merge.mjs   # regenerate questions.json/meta.json from data/bank/*.json
```

Enabling sign-in/sync is optional — see [`docs/SUPABASE.md`](docs/SUPABASE.md).

## Project layout

```
data/            bank/*.json (source questions), merge.mjs, questions.json + meta.json
src/domain/      pure logic: rng, session, exam, progress, storage, selection, questions
src/content/     the study guide (12 lessons)
src/app/         reducer store + context (offline-first persistence + cloud sync)
src/auth/        Supabase client, sync, auth context (env-gated)
src/components/  QuestionCard, screens (home/practice/quiz/results/stats/study), AuthPanel
e2e/             Playwright journeys
docs/            Supabase setup
```

Unofficial study aid — not affiliated with EPSO or the European Commission.
