# EPSO AI Field Trainer — evolve ledger (`/flywheel:evolve`)

Dated sections, newest first. Each run scores the previous run's picks against their signal,
then proposes new ones. Corrections stay visible.

## 2026-11-18 — first pass (overnight flywheel run)

### 0. Gate check

The soft-launch time box and the locked kill criterion both end **2026-11-24**, six days from
now. The criterion: fewer than 20 users after 2 honest channel attempts, or activation under
10% after one iteration. Next gate (set 2026-10-27): two honest channel attempts, signed by
Pavol, by 2026-11-24.

Status on 2026-11-18: **zero human channel attempts.** `flywheel/data/launch-log/epso-kviz.jsonl`
holds only automated IndexNow pings (Bing, Seznam). The one drafted listing
(`docs/plans/listing-draft.md`, r/EUCareers modmail) is still marked "draft only". So the kill
criterion cannot fire as written: its first condition needs two attempts that have not
happened. This is the first evolve run, so there are no earlier picks to score.

### Corrections

- **The exam date moved.** `docs/research/competition-2026-10.md` quotes EPSO's page (read
  2026-10-25) as "testing beginning 12/2026 (indicative)". Read 2026-11-18, the same page says
  **"1/2027 (indicative)"** and 3,661 applications (application period 08/09–13/10/2026):
  <https://selection.eu-careers.europa.eu/en/job-opportunities/artificial-intelligence-ai>.
  The time box therefore closes about six weeks before candidates sit the field MCQ.
- **The digest's "5 activated" includes a synthetic run.** Of the 5 `lesson_complete`
  visitors in the 28 days to 2026-11-14 (`flywheel/data/digest/latest.md`), one (`31dbba41…`)
  finished a 12-question lesson 2.5 s after opening, scoring 0/12, inside a burst of 4 new
  visitors in 6 s on 2026-10-27 10:52 UTC. Real activations in that window: 4.

### 1. Discover

Usage window: 60 days to 2026-11-18, `events` where `app = 'epso-kviz'` (flywheel-core),
run read-only through the Supabase MCP because `evolve-signals.mjs` had no credentials. 149
rows, 25 visitor ids. The SQL is in the PR body.

- **D1 — Volume.** 25 ids, minus `flywheel-probe` (daily live probe) = 24. Minus the
  2026-10-27 10:52 burst (4 ids, 6 s) and `1f2808ff…` (`numerical_start` 0.4 s after open,
  same day) = **19 human visitors in 60 days**, about 2 a week. First-party 14 vs edge 82
  visitors in 28 days (digest `edge_divergence`); the static-page beacon drops webdriver and
  bot user agents, so most of the 82 is likely crawlers.
- **D2 — Activation is not the problem at this volume.** 6 of 19 humans completed a lesson
  (32%); 6 of 11 who started a lesson finished one. That passes the playbook's ≥30% soft-launch
  bar and is far from the <10% kill line. n is small; read it as "not broken".
- **D3 — Recurrence.** 4 humans came back on 2+ days: `256f34fa…` (about 10 days, 2026-10-19 to
  11-10, cycled question-first through none/A/B/C in 17 s on 11-10: reads as the founder
  testing), `d450c18b…` (3 days, 2 lessons, 6/12 then 11/12), `ce807459…` (4 days, 3 lesson
  starts, no completion), `0e162add…` (2 days). Last human app event: 2026-11-10.
- **D4 — The exam paper is unused.** `start_exam`: 1 event, synthetic. `exam_finish`,
  `session_finish`: 0. The mock paper (30 q / 40 min, unseen first) is the closest thing to the
  ranking test and no human ran it in 60 days.
- **D5 — The signature moves are not firing.** `source_open` (cited passage) and
  `commonplace_add`: 0 events in 60 days, though both are instrumented
  (`src/components/SourceNote.tsx`, `src/app/collect.ts`, `src/seo/beacon.ts`). Question-first
  B fired 30 times from 3 visitors; the learner wrote an answer 2 times out of 30.
- **D6 — Lessons are slow.** Last `start_lesson` to `lesson_complete`, 7 human completions:
  6, 8, 27, 42 and 47 min, plus 98 min and 3 h with breaks. 12 questions each; the real paper
  allows 80 s a question (16 min for 12).
- **D7 — Static pages barely seen by people.** 70 sitemap URLs, all 200 (spot check of 5 plus
  `/`, `/ai-act/`, `/acts/`, `/llms.txt`, `/robots.txt`, `/questions/engineering/`, 2026-11-18).
  One human static `page_view` in 60 days (`/ai-act/`, 2026-11-14).
- **D8 — Exam facts (founder lens).** OJ C/2026/4668 per `docs/research/competition-2026-10.md`:
  field MCQ 30 q / 40 min, pass 15/30, the only ranking test; EUFTE marked for about 1.5× the
  240 places. EPSO publishes no field-MCQ samples. Pavol sits this exam himself; his own prep is
  the one sustained use case on record (D3).
- **D9 — Market.** Unchanged since `docs/research/competition-2026-10.md` (2026-10-27): EU
  Training sells per-field MCQ sets but lists no AI-field set for AD/430/26; EPSOready, EU
  Testing, JobTestPrep, Euphorum cover reasoning only. No incumbent covers the AI Act /
  Digital Omnibus with cited answers. EU Training's November rundown
  (<https://eutraining.eu/content/epso-news-november-2026-eu-exams-rundown>) is where
  candidates read testing news; it was not re-checked for new AI-field products this run.
- **D10 — Voice.** No `feedback` rows, no issues, no reviews. Zero qualitative signal.
- **D11 — Product state.** Open PRs: #8, #29, #32 (sweeps, being landed tonight by another
  agent), #19 (private bank, draft, untouched). No BACKLOG file.
- **D12 — Telemetry gaps.** (a) The flywheel digest's synthetic filter missed a 4-visitor,
  6-second burst and a 0.4-s `numerical_start`; activations are overstated by one in 28 days.
  The fix belongs in flywheel's filter (min time-to-complete, or a burst rule like
  `evolve-signals.mjs`'s anomaly hours, which needs ≥10 per hour and so misses 4), not in this
  repo. (b) No lesson-abandon event: `ce807459…` started 3 lessons on 4 days and finished none,
  and we cannot see where it stopped. (c) Founder traffic is not marked, so D2/D3 mix Pavol
  with candidates.

**No-regret fixes this run:** none shipped. No broken links or crashes found (D7). The one
measurement hole found (D12a) lives in the flywheel repo; it is listed for the flywheel sweep.

### 2. Define

- HMW-1: reach the 3,661 AI-field applicants in the 6–8 weeks before testing (D1, D8, D9)?
- HMW-2: get learners onto the mock paper, the format that ranks them (D4, D6, D8)?
- HMW-3: make the cited passage visible enough that people open it (D5)?
- HMW-4: tell candidate use apart from founder and bot use (D3, D12)?

**Binding constraint: reach (D1).** 19 humans in 60 days, zero human channel attempts. At 2 a
week, nothing about retention or the signature can be measured. This agrees with the kill
criterion, which is about reach. Demand is seasonal: it peaks in the weeks before the January
2027 sitting, which falls after the box closes.

### 3–4. Develop and deliver

| # | Idea | Kind | HMW | Signal | Impact | Conf | Effort | Rev | First cheapest test |
|---|---|---|---|---|---|---|---|---|---|
| 1 | Send the r/EUCareers modmail (draft exists) and one EPSO-candidate LinkedIn/Telegram group post, both signed by Pavol | adjacent · reach | 1 | D1, D9 | 4 | M | S | 2-way | Pavol sends 2 drafts; count new humans 7 days after |
| 2 | Extend the time box to 2027-02-15 (after the January sitting), keep the criterion's wording | radical · gate | 1 | D8, corrections | 4 | M | S | 2-way | Pavol's decision in `advance.md` |
| 3 | Founder diary: Pavol's own mock-paper scores weekly, published on one static page ("a candidate preparing with this") | mid · founder lens | 1, 2 | D3, D8 | 3 | L | S | 2-way | One page, linked from home; source_open from it |
| 4 | Mock paper as the home screen's first button; lesson second | adjacent | 2 | D4, D6 | 3 | M | S | 2-way | `start_exam` by humans > 0 in 14 days |
| 5 | Show the cited passage open by default after a wrong answer (one line, link to EUR-Lex) | adjacent | 3 | D5 | 2 | M | S | 2-way | `source_open` > 0 in 14 days |
| 6 | `lesson_abandon` event with question index on unload | adjacent · measurement | 4 | D12b | 2 | H | S | 2-way | Event appears in tests and live |
| 7 | Mark founder traffic: `?me=1` sets a local flag sent as a prop, filtered in the digest | adjacent · measurement | 4 | D3, D12c | 2 | H | S | 2-way | Digest shows founder rows apart |
| 8 | Remove question-first B as default (set to none); keep the setting | mid · removes | 2 | D5, D6 | 2 | L | S | 2-way | Lesson time and completion rate before/after |
| 9 | Partner with EU Training: offer the cited AI-Act bank as their missing AI-field set, free with attribution | radical · uses incumbent | 1 | D9 | 4 | L | M | 1-way | One email (Pavol signs) asking if they want it |
| 10 | "Ask your assistant": llms.txt plus a one-click prompt that makes ChatGPT/Claude quiz you from the cited pages | mid · post-AGI | 1 | D7, D9 | 3 | L | S | 2-way | Referrer from an assistant in 30 days |
| 11 | Cybersecurity field (AD/430/26 Field 2) from the same engine and texts (NIS2, CRA, CSA) | radical · 2× scope | 1 | D8, D9 | 4 | L | L | 2-way | Count applicants on EPSO's page for field 2 first |
| 12 | EPSO Discord/Telegram study-group "question of the day" bot reading from the cited bank | mid · fringe | 1 | D1, D10 | 3 | L | M | 2-way | One group admin says yes |

Nothing marked ✅: no no-regret fix shipped this run.

**Top 3**

1. **Adjacent quick win — #1, the two channel attempts.** They are the gate's own condition
   and are already drafted. Kill test: if the two posts, sent by 2026-11-24, bring fewer than
   10 new human visitors (excluding probe and bursts) by **2026-12-01**, the channel thesis
   fails and the gate reads KILL or maintain.
2. **Mid bet — #4, mock paper first.** Kill test: if no human finishes a mock paper
   (`exam_finish`) by **2026-12-15** with #1 live, the paper is not what candidates want here;
   revert the order.
3. **Radical probe — #2, move the box past the exam.** Kill test: if by **2027-02-15** the
   product has fewer than 50 human visitors in the 8 weeks before the sitting, KILL.

Constraints respected: Max-only, $0 infra, every outward step (#1, #3, #9, #12) needs Pavol's
sign-off, stays free until his AD/430 result (decision 2026-10-27).

### Gate recommendation: ITERATE, with the box moved to 2027-02-15

- **For:** the criterion has not been tested (zero channel attempts), activation passes the
  bar (6/19, D2), demand peaks in December–January before a sitting now set for 1/2027, and
  the product is Pavol's own exam prep, so it pays for itself through 2027-01 regardless.
- **Against:** 19 humans in 60 days with no outreach; the signature moves (cited passage,
  commonplace, mock paper) have zero human use (D4, D5); extending a box that ran out because
  the channel step was skipped rewards the skip. If Pavol will not send the two posts this
  week, KILL to maintain (keep it live for his own prep, no feature work) is the honest call.

ADVANCE is not supported: launched needs a cohort and W1 return, and there is no cohort.

### 5. Questions for Pavol

1. **Gate:** will you send the two channel drafts (r/EUCareers modmail plus one group) by
   2026-11-24? If yes: ITERATE with the box at 2027-02-15. If no: maintain.
2. Is `256f34fa…` (about 10 days of use, 2026-10-19 to 11-10) you? If yes, real candidate
   recurrence is 3 people, and D2/D3 shrink accordingly.
3. Would you put your own weekly mock score on a public page (#3)? It is the one story no
   competitor can tell, and it is outward-facing.
