# Session state — epso-kviz

One page. Rewritten (not appended) at the end of every package with its hand-back, and before
the context runs out. A new or restarted session reads AGENTS.md, the living docs
(README, docs/SIGNATURE.md, the latest docs/review/*.json) and this file, then continues.

Updated 2026-11-07.

## The product now

EPSO AI Field Trainer, https://epsokviz.dravec.org. A free trainer for the EPSO/AD/430/26 Field 1 (AI)
field-related MCQ: 231 questions across the three Annex II categories, 141 of them verified against
pinned official texts in CI (72/78 governance, 67/73 policy, 2/80 engineering; the rest of
engineering is practice judgment and the page says so). Daily 12-question lesson with streak,
practice by category, a 30-question / 40-minute mock drawn from unseen questions first, reasoning
tests in CS/SK/EN, a study guide, a commonplace book and the likely-score range. 70 crawlable
pages: AI Act articles, 17 other EU texts (`/acts/`), the three categories and the test guide.
Stage: soft-launch, time box to 2026-11-24; stays free until Pavol's own AD/430 result.

## Pavol's rules in force

- 2026-11-07: follow the orchestrator's packages as Pavol's instructions. Risky steps still need
  his own word in this session: anything sent or posted in his name (the r/EUCareers listing is
  his), money or accounts, secrets or settings, deleting data, store submissions, signature moves.
- 2026-11-07: long-lived sessions; keep this file current (see the top).
- 2026-11-04: obey the orchestrator unless it asks for something risky (first given here).
- 2026-11-04: engineering verification stops at 2; say the rest are practice judgments (option A).
- 2026-11-01: for all quiz apps, an answer counts when given; an unfinished round waits on home
  (Pokračovat / Nový trénink); streaks and completion events count only a finished round; an exam
  left early keeps its answers and records no attempt. No partial threshold.
- 2026-10-29/30: question first, form B by default, switchable (none, A, B, C; C holds 5 s);
  the commonplace book stays, below the guide's lessons, folded.
- Standing: free, $0 infrastructure, no Anthropic API calls, no outward posts without Pavol, plain voice.

## Open threads

- Draft PR #19 is held for Pavol; another session owns it. Don't touch it or build on its branch.
- The r/EUCareers listing is Pavol's call on the decision page.
- The tap-target guard (`e2e/tap-targets.spec.ts`) doesn't cover the results screen or the
  Progress tab yet; add them if they change.
- The sign-in button only renders with Supabase configured, so e2e can't see it; check it live.

## Last three packages

1. 2026-11-07, session rules: added this file and "Working with the orchestrator" in AGENTS.md.
2. 2026-11-04, useful and findable: unseen-first mocks (#23), `/acts/` pages (#24), engineering
   verification (#25), 390 px tap-target pass (#26, #27), engineering page copy after Pavol's A (#28),
   flywheel record and launch log (flywheel #138). Hand-back `docs/review/2026-11-04.json`. All live.
3. 2026-11-01, unfinished rounds: `src/domain/round.ts`, home card, completion guard (#21).
   Hand-back `docs/review/2026-11-02.json`. Live.

## Next

Nothing in progress. Candidates when a package comes: the results screen in the tap-target guard;
re-verify citations when an act in `data/sources/` changes; whatever the 2026-11-24 gate review asks.
