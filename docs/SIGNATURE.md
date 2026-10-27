# SIGNATURE.md — EPSO AI Field Trainer

The founder signature for this product, per the deep-round charter (flywheel
`docs/program/2026-10-27-deep-round.md`). The idea in one line: **ad fontes**. Learn the law
from the law itself, test yourself before you are told, and measure honestly.

## 1. Lineage

| Source | Year | URL | changes: |
|---|---|---|---|
| Erasmus, *De duplici copia verborum ac rerum* and *De ratione studii*; the humanist commonplace book (later systematised in John Locke's *A New Method of Making Common-Place-Books*, 1706) | 1512; 1511; 1706 | https://en.wikipedia.org/wiki/De_Copia · https://en.wikipedia.org/wiki/Commonplace_book | The candidate keeps their own **commonplace book**: verbatim passages from the AI Act and the acquis, collected while practising and filed by act and article. These are passages they met while working through a problem, not a summary someone else wrote. |
| *Ad fontes*: the humanists' return to source texts, and the glossed legal page (Accursius, *Glossa ordinaria* on the Corpus Juris, c. 1230) | 15th–16th c.; c. 1230 | https://en.wikipedia.org/wiki/Ad_fontes · https://en.wikipedia.org/wiki/Glossa_ordinaria_(law) | Every governance and policy answer carries the passage of the official text that settles it, checked verbatim in CI. The explanation reads as a gloss on the source, set beside the text with its reference. |
| Langdell's case method, Harvard Law School | 1870 | https://en.wikipedia.org/wiki/Case_method | Questions are set as cases ("A start-up is placing an Annex III recruitment tool on the market…"), and you answer by applying the article to the facts. The bank is written that way, and new questions follow it. |
| Thomas Aquinas, *Summa Theologiae*: the *quaestio* (question, objections, *sed contra*, *respondeo*, replies) | 1265–1274 | https://en.wikipedia.org/wiki/Summa_Theologica#Structure | Each rationale names the tempting wrong option and says why it fails, the "reply to the objection". Planned: a reply to every distractor, shown for the option you actually chose. |
| Ebbinghaus, *Über das Gedächtnis* (the spacing effect); Roediger & Karpicke, "Test-Enhanced Learning" (the testing effect) | 1885; 2006 | https://psychclassics.yorku.ca/Ebbinghaus/index.htm · https://doi.org/10.1111/j.1467-9280.2006.01693.x | Practice is retrieval, not rereading: missed questions come back on a schedule, and mastery means right twice in a row. The study guide is there to be read *after* a question has exposed a gap. |
| Slamecka & Graf, "The generation effect"; Lichtenstein, Fischhoff & Phillips, "Calibration of probabilities"; Brier, "Verification of forecasts expressed in terms of probability" | 1978; 1982; 1950 | https://doi.org/10.1037/0278-7393.4.6.592 · https://doi.org/10.1017/CBO9780511809477.023 · https://doi.org/10.1175/1520-0493(1950)078<0001:VOFEIT>2.0.CO;2 | Answer before you see the options (Socratic: the question first). Readiness is a calibrated range from first tries, never a flattering single number. A later step scores confidence ratings against outcomes. |

## 2. Refused

- **Toy gamification.** No confetti, mascots, cartoon emoji, or badges for their own sake.
  Candidates are professionals preparing for a career exam.
- **Streak anxiety.** The day count stays a quiet number. There are no loss warnings, no
  "don't break your streak" notifications, and no streak freezes for sale.
- **Flattering scores.** We don't predict a pass, guarantee results, or invent a cut-off. EPSO
  doesn't publish the cut-off, so neither do we. A mock built from questions you've already seen
  doesn't count as evidence.
- **Sources dressed up.** An unverified question never shows a quote as if the quote settled it.
- **The generic AI-app look.** No purple gradients, blobs, rounded-everything or "✨". No
  chatbot tutor that answers confidently from training data older than the law.
- **Engagement bought at the cost of learning.** No infinite feed and no daily-goal inflation.

## 3. Signature mechanics

| Mechanic | What the user sees | From | How we'll know it works | Status |
|---|---|---|---|---|
| **The cited answer** | Under each rationale, the verbatim passage with its article reference and a EUR-Lex link, and "Checked against the official text on …" | *Ad fontes*, the glossa | Share of answered verified questions where the user opens the source link (`key_action` with `{action: 'source_open'}`); target ≥ 10% | shipped (PR #2) |
| **Likely score on a fresh paper** | A 10th–90th percentile range of 0–30 from first tries only, the chance of reaching 15/30, and the notice's real ranking rule (about 360 essays marked for 240 places) | Brier, Lichtenstein et al.; the testing effect | Predicted vs actual first-try score on the next mock, over users with ≥ 2 mocks; the 80% range should contain the actual score ~80% of the time | shipped (this round) |
| **Commonplace book** | "Copy to my commonplace book" on each cited passage. A Commonplace view files the passages by act and article, with the case they came from; it can be exported as text | Erasmus, *De Copia*; Locke 1706 | Users with ≥ 5 entries; their 7-day return rate vs users with none (`key_action` with `{action: 'commonplace_add'}`) | building (this round) |
| **Question first** | Optional "recall first" mode: the stem appears alone and the options appear after a tap, once you've formed an answer | Socratic questioning; the generation effect | First-try accuracy on later reviews of the same questions, recall-first vs normal | proposed |

## 4. Visual signature

The glossed legal page and the Official Journal. The law sits in the middle of the page, and
the gloss and reference sit beside it in a smaller face. In the app:

- Source passages are set as quotations: a text serif in italic, a rule on the left, and the
  reference (act, article) in small mono, the way an apparatus or margin note is set. This is
  the one signature element on the answer screen.
- The rest stays the instrument-panel palette already in use (steel, brass, verdigris), held
  to the taste standard's rules: four type steps, accent twice per screen, AA contrast, the
  375 px phone contract. No redesign for its own sake.

## 5. Founder lens

- **II (the order).** The product must not cost Pavol's presence. Verification runs in CI, and
  re-verification is a scripted pass when an act changes, not an evening of reading. The
  readiness model needs no server and no moderation.
- **VI (moat, reach, loose ends).** The moat is frozen judgment: a verification trail checked
  against the law and kept current. It reaches the people it's for through answers that are
  findable and citable: prerendered article explainers with verified quotes, and an honest
  llms.txt. Unsourced questions are listed rather than hidden, so they aren't loose ends.
- **VIII (never lie or trick).** Ranges instead of promises, no invented cut-off, unverified
  questions shown as such, no dark patterns. Where we don't know something, the screen says
  so.

The difference that follows: incumbents sell volume ("1,500+ questions"). We sell
correctness you can check, and an honest estimate of where you stand.
