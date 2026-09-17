# AGENTS.md — epso-kviz

The build/test/release contract for this repo. An agent (or the overnight ralph loop) should be
able to read only this file and ship correctly. Keep every command copy-pasteable and current.
Taste rules that apply to every flywheel product live in the hub: `flywheel/docs/standards/taste.md`.

> One-liner: Free practice trainer for the EPSO/AD/430/26 competition's Field 1 (Artificial
> Intelligence) field-related MCQ — 180 questions across 3 Annex II categories, 30q/40min exam sim.
> Stack/template: Vite + React 19 + TS + Tailwind 4 (PWA), Supabase auth/sync  ·  Track: community
> Portfolio record: `flywheel/data/products/epso-kviz.json`

## Build
```bash
npm ci
npm run build   # tsc -b && vite build
```

## Test (TDD required; persona-journey test per primary journey)
```bash
npm run typecheck   # tsc -b --noEmit
npm test            # vitest run
npm run e2e         # playwright test (builds + previews on :4173, writes shots to e2e/shots/)
```
Gate: typecheck · test · build must pass (CI is `.github/workflows/deploy.yml`, shaped after
`docs/standards/ci.template.yml`). Block only on these; e2e also runs in CI on every PR.

## Run / verify a change in the real app
```bash
npm run dev         # Vite dev server (http://localhost:5173)
```
Primary journeys: home → daily lesson (12 q) → completion + streak; practice by category; exam
mode (30 q, 40-min timer) → results with per-category breakdown and mistake review.

## Release (the finish line — produces a storefront link)
- **Web** → GitHub Pages at `https://epsokviz.dravec.org` (`public/CNAME`). Deploy is automatic
  on push to `main` via `.github/workflows/deploy.yml`. Platform env for the build:
  `VITE_SUPABASE_URL`, `VITE_SUPABASE_PUBLISHABLE_KEY` (repo secrets; no-op locally/in tests).
- Data source: `data/bank/*.json` (180 Q, Annex II Field 1 — AI); regenerate the merged
  `data/questions.json`/`meta.json` via `node scripts/merge.mjs`.

## Analytics (Common Platform)
Vendored client: `src/platform/flywheel-client.ts`, wrapped by `src/analytics.ts`. First-party,
cookieless, fire-and-forget into the shared flywheel-core (Supabase). Fires the shared taxonomy
(`app_open`, `start_lesson`/`start_practice`/`start_exam`, `lesson_complete`, `feedback_given`,
`error`). Activation KPI is `lesson_complete` (set in the portfolio record); the feedback card on
the results screen fires `feedback_given`.

## Done means
Green CI · deployed to epsokviz.dravec.org · portfolio record updated (stage/gate/links)
· storefront link live · (outward promotion only after Pavol's sign-off).
