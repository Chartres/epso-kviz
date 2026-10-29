# Verbal reasoning items

Practice for the verbal reasoning test of EPSO/AD/430/26: 20 questions in 35 minutes, in
language 1, pass 10/20 (Notice of Competition, OJ C/2026/4668, section 4.3.2(b), Table 3;
read from the Publications Office on 2026-10-29).

## Passages (`passages.json`)

14 recitals from 8 EU acts, each taken word for word from the Czech, Slovak and English
editions of the Official Journal. The text was fetched from the Publications Office (Cellar) by
CELEX number on 2026-10-29; each passage carries its CELEX number, recital number and EUR-Lex
link. The three languages are the official parallel texts, so they say the same thing.

© European Union, https://eur-lex.europa.eu. Reuse is authorised under Commission Decision
2011/833/EU, provided the source is acknowledged. Only the Official Journal editions are
authentic. The passages are not covered by the bank's CC BY-NC-SA licence.

The passages are recitals as first published. Later amendments don't matter here: the test
asks only what the passage says.

## Items (`items.json`)

69 statements, 4 to 5 per passage. Each is written in Czech, Slovak and English with one key:
`true` (the passage says or directly implies it), `false` (it says or directly implies the
opposite) or `cannot` (the passage alone doesn't settle it). Each item has a short reason in
each language; where the reason quotes the passage, the quote is checked verbatim in that
language by `src/domain/reasoning/verbal.test.ts`.

A sitting takes up to 4 statements from each of 5 random passages, kept together so each
passage is read once.

## Blind check (2026-10-29)

Three fresh reviewers, one per language, each got only the passages and the statements (no
keys) and answered true / false / cannot say. 70 items × 3 languages: all 210 answers matched
the key. One item (gdpr43-2, "consent can never be valid where the controller is a public
authority") was dropped anyway, because two reviewers noted that "cannot say" was arguable.
One item (ai63-4) was reworded from "must" to "should" to match the passage's hedging, and
re-checked blind in all three languages.
