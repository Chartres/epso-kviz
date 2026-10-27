# Competition — EPSO AI Field Trainer, October 2026

Deep-round record (flywheel `docs/program/2026-10-27-deep-round.md`). Prices are as published
or as indexed by search on the access date. If a price could not be found, the table says
"not found".

## The test we prepare for

EPSO/AD/430/26, Field 1 (Artificial Intelligence), 240 places. Checked against the official
text (OJ C/2026/4668, fetched from the Publications Office on 2026-10-27):

- Reasoning, in language 1: verbal (20 q / 35 min, pass 10/20), then numerical (10 q / 20 min)
  and abstract (10 q / 10 min), with a combined pass of 10/20. These are eliminatory.
- Field-related MCQ, in language 2: 30 q / 40 min, pass 15/30. It is **the only ranking test**.
- EUFTE essay, in language 2: 40 min, pass 5/10. It is marked only for the top MCQ scorers,
  "in principle not exceed[ing] 1,5 times" the 240 places, so about 360 candidates.
- All tests are remote and proctored. EPSO's page (read 2026-10-25) shows 3,665 applications
  and testing "beginning 12/2026 (indicative)".

EPSO publishes sample reasoning tests and no field-MCQ samples.

## Competitors

| # | Product | URL | Model and price (seen) | Audience | Does well | Does badly |
|---|---|---|---|---|---|---|
| 1 | EU Training | https://eutraining.eu/products/exam-questions | One-off packages. AD5 generalist: €135 basic, €275 pro, €395 full, €475 premium. Custom: verbal reasoning €0.17 per question, EUFTE €49 each. Field MCQ sets are sold per field. (seen 2026-10-25/27) | All EPSO candidates | Breadth; exam-like interface; coaching and support praised in reviews | Trustpilot 3.5/5 (26 reviews): "So many of the questions are sloppily written", "many questions that I bought did not even have explanations", "Very poor value for money" ([reviews](https://www.trustpilot.com/review/eutraining.eu), 2026-10-27). For AD/430/26 it offers a free webcast; no AI-field MCQ set is listed ([article](https://eutraining.eu/content/epso-ict-ad8-competition-2026-ai-cybersecurity)) |
| 2 | EPSOready | https://www.trustpilot.com/review/epsoready.eu | One-off, "from €19.99", 30-day refund (seen 2026-10-25) | AD5/AST generalists | 1,500+ questions in a TAO-like interface; reasoning, EU knowledge, digital skills, essay | Generalist only: no field MCQ. One Trustpilot review |
| 3 | EU Testing | https://eutesting.org/guide/epso-ad7-it-overview.html | Free first 25 questions; full price not found (2026-10-27) | Reasoning-test takers, 11 languages | Timed reasoning practice in several languages | No field-specific bank; it tells ICT candidates to read the notice's duties |
| 4 | JobTestPrep | https://www.jobtestprep.co.uk/epso_pack_ast | AD and AST packs; price not found (2026-10-27) | Aptitude-test buyers | Score reports, solving tips | Aptitude tests only; no field MCQ |
| 5 | John Harper Publishing, *The Ultimate EU Test Book* | https://www.johnharperpublishing.co.uk/?p=3872 | Book: €55 / £47 (Assistants 2024); Administrators 2025 edition price not found (2026-10-27) | Candidates who prefer paper | Long-standing title; worked solutions | Printed annually, so slow to update; no field MCQ; no AI Act or Omnibus content |
| 6 | Euphorum | https://www.euphorum.org/en/offers | Credit system; euro price not found (2026-10-25) | EN/FR/DE candidates | EPSO-length reasoning tests in three languages | No field MCQ; three languages |
| 7 | Ya Semos Europeos | https://ya-semos-europeos-s-school.teachable.com/courses/2795029 | Self-study course, one-year access; price not found (2026-10-25) | Spanish-speaking candidates | 200 verbal questions across 10 tests | Reasoning only |
| 8 | EPSO sample tests | https://selection.eu-careers.europa.eu/en/how-to-apply/sample-tests | Free | Everyone | Official platform and format | Reasoning only; no field content |
| 9 | General-purpose chatbots (ChatGPT, Gemini, Claude) | — | Free or about €20/month | Anyone | Generate unlimited practice questions | Confident errors. Models trained before July 2026 don't know the Digital Omnibus (2026/1744); our own verification pass caught 8 outdated rationales of that kind in a hand-written bank |

## Feature gap

| Feature | Us | EU Training | EPSOready | EU Testing | JobTestPrep | Harper book | Chatbot |
|---|---|---|---|---|---|---|---|
| AD/430/26 Field 1 (AI) question bank | ✓ 231 q | not listed | ✗ | ✗ | ✗ | ✗ | generated |
| Answers checked against the official text, with the quote shown | ✓ 111 q, CI-checked | ✗ | ✗ | ✗ | ✗ | ✗ | ✗ |
| Up to date with the Digital Omnibus (Jul 2026) | ✓ | unknown | n/a | n/a | n/a | ✗ | ✗ (most models) |
| Spaced repetition / mastery | ✓ | ✗ | ✗ | ✗ | ✗ | ✗ | ✗ |
| Timed 30 q / 40 min mock in the official composition | ✓ | per field, if sold | ✗ | ✗ | ✗ | ✗ | ✗ |
| Likely-score range from first tries (calibrated rank) | ✓ (this round) | ✗ | ✗ | ✗ | score reports | ✗ | ✗ |
| Reasoning tests | ✗ (CZ/SK pilot planned) | ✓ | ✓ | ✓ | ✓ | ✓ | — |
| Czech / Slovak reasoning practice | planned | not found | not found | 11 languages, list not checked | not found | ✗ | — |
| EUFTE essay practice | ✗ | ✓ €49 | ✓ | ✗ | ✗ | guidance | — |
| Price | free | €135–475 | €19.99 | free tier | not found | €55 | €0–20/mo |

## Where we win

The one thing nobody sells is a correct, current AI-field bank. The incumbents compete on
breadth (reasoning, EU knowledge, essays) across all competitions. The Field 1 content they
would need changed in July 2026, and an LLM-generated bank inherits whatever its model knew.
Our bet:

1. **Ad fontes verification as a process, not a claim.** Every governance and policy answer is
   traced to a verbatim passage of the pinned official text, CI fails on a mismatch, and the
   pass is re-run whenever an act changes. A copy of today's bank goes stale at the next
   amendment; the pipeline doesn't.
2. **First-try calibration.** The likely-score range uses only first attempts. With outcome
   reports (H4 in MOAT.md), this becomes the only public estimate of the ranking cut-off.
3. **Czech/Slovak reasoning.** The eliminatory tests are sat in language 1, and no vendor we
   found serves Czech or Slovak.

Entrant-difficulty score (`flywheel/docs/standards/moat.md`):

- **Before this round: 1.** A public, uncited bank that an LLM could approximate in a day.
- **Target after this round: 2.** Pinned sources, a CI-enforced verification trail, re-verification
  after amendments, first-try calibration data accruing per user, and a CZ/SK reasoning set. A
  competitor needs months of the same work. Reaching 3 needs the outcome data and a name
  candidates recognise.

## Sources (accessed 2026-10-25 to 2026-10-27)

- Notice of Competition EPSO/AD/430/26, OJ C/2026/4668 — http://publications.europa.eu/resource/oj/C_202604668
- EPSO competition page — https://selection.eu-careers.europa.eu/en/job-opportunities/artificial-intelligence-ai
- EPSO sample tests — https://selection.eu-careers.europa.eu/en/how-to-apply/sample-tests
- EU Training packages — https://eutraining.eu/products/exam-questions; field MCQ — https://eutraining.eu/content/how-can-i-practice-field-related-mcq; AD/430/26 article — https://eutraining.eu/content/epso-ict-ad8-competition-2026-ai-cybersecurity
- EU Training reviews — https://www.trustpilot.com/review/eutraining.eu
- EPSOready — https://www.trustpilot.com/review/epsoready.eu
- EU Testing — https://eutesting.org/guide/epso-ad7-it-overview.html
- JobTestPrep — https://www.jobtestprep.co.uk/epso_pack_ast
- John Harper Publishing — https://www.johnharperpublishing.co.uk/?p=3872
- Euphorum — https://www.euphorum.org/en/offers
- Ya Semos Europeos — https://ya-semos-europeos-s-school.teachable.com/courses/2795029
- Regulation (EU) 2026/1744 (Digital Omnibus on AI) — https://eur-lex.europa.eu/eli/reg/2026/1744/oj
