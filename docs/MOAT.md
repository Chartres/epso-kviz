# MOAT.md — epso-kviz

Stage-3 record per the Flywheel Standard (`flywheel/docs/standards/moat.md`). Written 2026-10-25.
Facts carry a source; estimates are marked as such.

## 1. Audit: what exists today

**The test it trains for.** EPSO/AD/430/26, Field 1 (Artificial Intelligence), AD8.
Per the Notice (OJ C/2026/4668, read via a full copy on Impactpool because EUR-Lex blocks automated
fetches; one manual check of the original is still owed):

| Test | Language | Format | Pass mark | Role |
|---|---|---|---|---|
| Verbal reasoning | L1 | 20 q / 35 min | 10/20 | eliminatory |
| Numerical + abstract reasoning | L1 | 10 q / 20 min + 10 q / 10 min | 10/20 combined | eliminatory |
| Field-related MCQ | L2 | 30 q / 40 min | 15/30 | **the only ranking test** |
| EU free-text essay (EUFTE) | L2 | 40 min | 5/10 | eliminatory, marked only for the top ~1.5× places |

All remote and proctored. Testing "beginning 12/2026 (indicative)" and 3,665 applications
received (EPSO competition page, read 2026-10-25; the page does not split the count by field).
Field 1 has 240 places, so about 360 MCQ-ranked candidates go on to have their essay marked
(1.5 × 240): passing 15/30 is not the bar, ranking near the top is. EPSO publishes **no
field-MCQ samples and no syllabus**; Annex II's three duty categories are the only content guide.
Its sample tests cover reasoning only.

**The app.** React PWA, offline, no account needed; optional magic-link sync via Supabase;
cookieless first-party analytics. Daily 12-question lesson with spaced repetition and mastery,
practice by category, 30q/40min exam simulation with per-category breakdown, a 12-lesson study
guide. Tests after this PR: 106 unit/component tests and 8 Playwright e2e tests, all green.

**The bank.** 231 questions (README and data/README said 180; corrected in this PR):
engineering 80, governance 78, policy 73. Every question has four options and a 1–3 sentence
rationale (average 295 characters). Distractors are written as plausible near-misses, and the
merge script enforces anti-test-wiseness gates (the correct option is the unique longest in
39/231 = 17%; options are shuffled per id). Key distribution: a 47, b 70, c 58, d 56 — mildly
skewed to b, worth evening out. **Sourcing before this PR: none per question.** Legal
references appeared only inside the prose rationale, and nothing checked them against the
law. The Digital Omnibus on AI (Reg. (EU) 2026/1744, OJ 24.7.2026) moved the high-risk dates
(Annex III to 2 Dec 2027, Annex I to 2 Aug 2028), rewrote Art 4 (AI literacy) and added
Art 4a; any bank written before it needs checking against it.

**Coverage gaps against the real test.**
- Reasoning tests (verbal, numerical, abstract) — not covered. They are eliminatory and taken
  in the candidate's **L1**: for Czech and Slovak candidates, that is Czech or Slovak.
- The field MCQ is taken in **L2**, which can be any of the 23 other official languages. The
  bank is English only.
- EUFTE — not covered. It is not a knowledge test; EPSO publishes the document pack shortly
  before the test.
- No rank signal: the exam result says "pass at 15 of 30". Only the study guide mentions
  the ~360 cut, so the target the app trains for is the wrong one.

**What a competitor copies in a weekend.** Everything. The repo is public with no licence;
`data/questions.json` is one file. The code is a standard quiz shell. A solo dev with an LLM
could also generate 200 plausible questions in a day. Entrant-difficulty today: **0–1**.
The one thing that is not cheap to copy is *correct, current* content, because checking every
answer against the amended AI Act is slow, and an LLM-generated bank will carry pre-Omnibus
dates and confident errors.

## 2. Market (who pays, for what, where it is weak)

Desk research on 2026-10-25; prices are as indexed by search, not checked at checkout.

| Product | What | Price | Source |
|---|---|---|---|
| EU Training | Generalist AD5 packages (reasoning, EU knowledge, written); field MCQ sets sold per field and question block | €135 basic → €475 premium (3-month EU course included); custom items e.g. verbal reasoning €0.17/question | [exam questions](https://eutraining.eu/products/exam-questions), [field MCQ](https://eutraining.eu/content/how-can-i-practice-field-related-mcq) |
| EU Training, AD/430/26 | Webcast on the ICT AD8 competition (free with account); no AI-field MCQ set or price listed on the competition article | free / not listed | [article](https://eutraining.eu/content/epso-ict-ad8-competition-2026-ai-cybersecurity) |
| EPSOready | 1,500+ questions in a TAO-like interface: reasoning, EU knowledge, digital skills, essay | from €19.99 one-off, 30-day refund | [Trustpilot listing](https://www.trustpilot.com/review/epsoready.eu) |
| Euphorum | Reasoning tests in EN/FR/DE, EPSO-length | credit system | [offers](https://www.euphorum.org/en/offers) |
| Ya Semos Europeos | Self-study reasoning course, 200 verbal questions, 1 year | not shown | [course](https://ya-semos-europeos-s-school.teachable.com/courses/2795029) |

Where they are weak:
- **No AI-field MCQ product found at any price.** Generalists and reasoning dominate; field
  MCQs are sold per field where a vendor has written them, and for AD/430/26 Field 1 we found
  a webinar, not a question bank.
- **Quality complaints are about the questions.** EU Training's Trustpilot (3.5/5, 26 reviews):
  "So many of the questions are sloppily written", "many questions that I bought did not even
  have explanations", "Very poor value for money"
  ([reviews](https://www.trustpilot.com/review/eutraining.eu)).
- **Languages.** One reviewer notes numerical tests in only three languages. No vendor we
  found offers Czech or Slovak reasoning practice, which CZ/SK candidates sit in L1.

Implication: a cited, current AI-field bank has no direct competitor today. EPSOready sets
the floor for one-off pricing (~€20); EU Training sets the ceiling for bundles (€135+).

## 3. Moat hypotheses

Scored on the Standard's entrant-difficulty scale ("a competent solo dev with our code, two
weeks, $0").

| # | Hypothesis | Compounding asset | Accrues per week | Score |
|---|---|---|---|---|
| H1 | **Verified, cited bank.** Every answer traced to a verbatim passage of the official text, checked in CI against pinned snapshots, re-checked when the law changes. | `data/sources/` snapshots + per-question `sources`/`verified`; the change log of re-verifications | new questions verified; re-verification after each amendment or Commission act | 2 |
| H2 | **Czech/Slovak reasoning sets.** Verbal/numerical/abstract practice in the L1 that CZ/SK candidates actually sit, in EPSO's format and timing. | original item bank in cs/sk with difficulty calibration | items written and calibrated from user answers | 2–3 |
| H3 | **Calibrated rank, not pass mark.** Per-question difficulty and time-to-answer from real users turn a mock score into an estimated percentile against people preparing for the same competition. | anonymous per-item stats (p-value, median time) keyed to question id | every answered question | 2 |
| H4 | **Candidate outcomes.** Opt-in report after each stage ("passed reasoning", "EUFTE marked", "reserve list") tied to their app history. Gives the only public-facing cut-off estimate. | outcome table joined to usage | once per stage per user, slow but unique | 3 |
| H5 | **Freshness ritual.** Each EU AI act, guideline or Commission decision becomes questions within a week, with a dated "what changed" note. | dated changelog + questions | per publication | 1 (copyable once published) |

**Does not rely on:** the question text staying secret. The bank is public today and an LLM can
write plausible questions. The moat is the verification trail, calibration data and outcomes
behind the questions, not the questions themselves.

## 4. What we can source legally

| Asset | Source | Terms |
|---|---|---|
| Official EU texts (acts, recitals, COM documents) | Publications Office / EUR-Lex | reuse allowed with acknowledgement, Commission Decision 2011/833/EU |
| Notice of Competition, EPSO pages, sample reasoning tests | EPSO | read and cite; do not copy EPSO's sample items |
| EU terminology in cs/sk/fr/de… | IATE, EUR-Lex parallel texts | free reuse |
| Item statistics, timing, outcomes | our own users, opt-in, anonymous | first-party; needs a short privacy note in the app |
| Candidate-reported formats (forums, Reddit) | public posts | read only, paraphrase with attribution, no scraping into the product |

Not legal to use: commercial prep vendors' questions; leaked real-test items (EPSO's rules
forbid disclosure of test content, and candidates agree to that).

## 5. Plan

1. **This PR — H1, first slice.** Citation schema, 19 pinned source texts, a CI test that every
   quote appears verbatim in its source, citations shown under each rationale with a EUR-Lex
   link, and the governance and policy categories verified (results in section 6).
2. **H3 instrumentation** — record per-item correctness and time (already in local progress;
   add an anonymous aggregate event), then show "harder than 80% of questions" and a rough
   rank band on the exam result. 1–2 evenings.
3. **Exam realism** — single-sitting, no pause, no back-navigation, remote-proctor-style
   rules screen; replace "pass at 15/30" with the rank target. 1 evening.
4. **H2 pilot** — 40 numerical + 40 abstract items (language-light, so cs/sk is cheap), then
   verbal in Czech/Slovak. Validate demand first: count CZ/SK visitors in analytics.
5. **H4** — opt-in outcome prompt timed to EPSO's stage announcements.
6. Engineering category: cite canonical references (papers, NIST/ISO/ENISA documents we can
   pin) so all three categories carry evidence.

## 6. Verification results (this PR)

151 questions (all governance and policy) were read against the pinned texts. Log:
`data/verification/2026-10-25.json`.

- **111 verified** (governance 65, policy 46): the key is right and each carries 1–4 verbatim
  passages, which CI checks against `data/sources/`.
- **40 unsourced**: no pinned text decides them. They rest on the GPAI Code of Practice, the
  Commission's AI-system-definition guidelines (C(2025) 924), EDPB Opinion 28/2024, Council
  Reg. (EU) 2026/150 on gigafactories, the Council of Europe AI Convention, the Coordinated
  Plan, DSA guidelines, or comparative and judgment questions. The keys look sound; they
  stay unmarked until we pin the document or rewrite the question.
- **0 wrong answer keys. 14 rationales and 1 option corrected.** Eight were outdated by the
  Digital Omnibus (2026/1744): AI literacy (Art 4 replaced), AI Office competence and
  conformity assessment (new Art 75(1), (1e)), the CRA presumption for Art 15 cybersecurity
  (new Art 42(3)), FRIA/DPIA reuse (Art 27(4)), fundamental-rights bodies' access (Art 77),
  data-protection carve-outs (Art 2(7)). One misdescribed what the Omnibus amended. The rest:
  a rationale that overstated Recital 12, a misquoted Art 14(4)(b), Art 5(2) making the
  FRIA a precondition for real-time biometric identification, DSA researcher access sitting in
  Art 40, "up to 5" gigafactories, and the DGA's registration (not notification) of
  data-altruism organisations.

That is the moat in miniature: any bank written before July 2026, or generated by a model
trained before it, carries these errors, and a candidate cannot tell.

Engineering (80 questions) is not yet cited: it rests on textbooks and papers that are not
freely reusable. Next step there is pinning open references (NIST AI RMF, ENISA reports,
ISO/IEC terminology where free, arXiv papers under CC licences).
