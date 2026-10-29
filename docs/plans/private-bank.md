# Plan: the question bank in a private place

Status: **plan only.** Nothing has moved. The bank is still in `data/bank/`, the build is
unchanged, and no setting, secret or repo has been created. Pavol picked "move the bank to a
private repo and fetch it at build" on 2026-10-29. Each step below that only he can take is
marked **Pavol**.

## Read this first: what privacy can and cannot buy

The live site has to show the questions in order to work. Moving the source does not change
that.

- **The app bundle.** `src/domain/questions.ts` imports `data/questions.json` at build time.
  So all 231 questions, their keys and their explanations are inside the public JavaScript at
  https://epsokviz.dravec.org (checked: `dist/assets/index-*.js` contains the question text).
  Anyone can read them with the browser's developer tools.
- **The 51 prerendered pages.** The three `/questions/<category>/` pages publish every
  governance, policy and engineering question with its answer, by design. They are what
  search engines and AI assistants index (FAQ JSON-LD). The 46 `/ai-act/article-N/` pages and the
  `/ai-act/` index show the questions that cite each article. `/guide/ad-430-26-field-1/` shows
  none.
- **The verbal items** (`data/verbal/`), the study guide (`src/content/`) and the pinned
  source texts (`data/sources/`) are not part of "the bank". They stay where they are unless
  Pavol says otherwise.

What a private bank does buy:

- **No clean copy of the source.** `git clone` no longer hands over the bank as tidy JSON, with
  the authoring order, the verification notes (`data/verification/`) and the history of every
  correction.
- **A place for future work.** New and unreleased questions can be drafted where nobody sees
  them until they ship.
- **A clear line for the licence** (see below).

It does not stop someone who scrapes the live site. Stopping that would take a server that
hands out questions one at a time behind sign-in. That has a running cost and changes how the
app works offline, so it is not offered here.

## Option A: a private repo `Chartres/epso-bank`, fetched at build (Pavol's pick)

The bank lives in a new private repo. CI fetches it with a read-only token, then builds as
today. `epso-kviz` stays public: code, tests, pinned sources and the decision trail.

### Pavol's steps

1. **Create the repo.** GitHub → New repository → owner `Chartres`, name `epso-bank`,
   **Private**, no README, licence or .gitignore (it must start empty).
2. **Tell Claude "go, Option A".** Claude attaches the new repo to a session and pushes
   `bank/*.json` and `verification/*.json` from this repo (with a README naming the licence).
   He can also push them himself:
   ```bash
   mkdir epso-bank && cd epso-bank && git init -b main
   cp -r ../epso-kviz/data/bank ../epso-kviz/data/verification .
   git add . && git commit -m "Question bank as of $(date +%F)"
   git remote add origin git@github.com:Chartres/epso-bank.git && git push -u origin main
   ```
3. **Make a fine-grained token.** GitHub → Settings → Developer settings → Personal access
   tokens → Fine-grained tokens → Generate new token:
   - Resource owner: `Chartres`
   - Repository access: **Only select repositories** → `epso-bank`
   - Permissions: Repository → **Contents: Read-only** (Metadata: Read-only is added
     automatically). Nothing else.
   - Expiration: the longest the account allows (up to a year). Put the date in a calendar,
     because the build fails the day it expires.
   - If `Chartres` is an organisation that requires approval for fine-grained tokens, approve
     it under the organisation's Settings → Personal access tokens → Pending requests.
4. **Add the secret.** `epso-kviz` → Settings → Secrets and variables → Actions → New
   repository secret: name `EPSO_BANK_TOKEN`, value = the token. Optional: add the same name
   under Dependabot secrets so Dependabot PRs can build too.
5. **Tell Claude the secret is in.** Claude opens the switch-over PR (below). He reviews and
   merges it, or lets Claude merge it once CI is green.
6. **Answer the history question** (below): leave the history (recommended) or rewrite it.

### The code change

Ready now and off: `scripts/fetch-bank.mjs` (tests in `src/platform/fetch-bank.test.ts`).

- `EPSO_BANK_SOURCE` unset (today): it does nothing, and the build uses the local
  `data/bank/`.
- `EPSO_BANK_SOURCE=github` + `EPSO_BANK_TOKEN`: it lists `bank/` and `verification/` in
  `Chartres/epso-bank@main` through the GitHub contents API and writes each `*.json` into
  `data/`. It refuses anything that isn't JSON. Override the source with `EPSO_BANK_REPO` and
  `EPSO_BANK_REF`.
- `EPSO_BANK_SOURCE=github` with no token: it fails, so CI never ships a stale bank by
  accident. With `--allow-local` (a dev run) it keeps the local copy instead.

The switch-over PR, after step 5:

1. In `.github/workflows/deploy.yml`, before `npm run typecheck` (the tests and the type check
   both read the bank):
   ```yaml
   - name: Fetch the question bank (private)
     run: node scripts/fetch-bank.mjs && node scripts/merge.mjs
     env:
       EPSO_BANK_SOURCE: github
       EPSO_BANK_TOKEN: ${{ secrets.EPSO_BANK_TOKEN }}
   ```
2. `git rm -r --cached data/bank data/questions.json data/verification`, then add them to
   `.gitignore`. Pavol's local copies stay on disk and are the dev fallback:
   `npm run dev` works offline exactly as now.
3. Add `data/sample/` (about 12 questions, 4 per category, already public on the static
   pages), so that someone without access can clone and run the app. `merge.mjs` falls back
   to it when `data/bank/` is missing.
4. Fork and Dependabot PRs get no secret. Their CI says "bank not available" and runs on the
   sample instead of failing for an unrelated reason.
5. Update `AGENTS.md` (data source line), `README.md`, `data/README.md` and the licence files.

### What stays public on the live site

Everything that is public today: the app with all 231 questions in its bundle, and the 51
prerendered pages with their questions and answers. Option A changes the repo, not the site.

### Licence wording

`data/LICENSE` today covers `data/bank/`, `data/questions.json`, `data/meta.json`,
`data/verification/` and `src/content/` under CC BY-NC-SA 4.0. Proposed:

> Question bank, explanations and verification notes — EPSO AI Field Trainer
> Copyright (c) 2026 Pavol Dravecký. All rights reserved.
>
> From [date of the switch-over], the question bank is kept in a private repository and is
> not licensed for reuse. The questions shown on epsokviz.dravec.org may be read and quoted
> for personal study. Copying, scraping or republishing them, in whole or in part, needs
> written permission.
>
> Versions of the bank published in this repository before [date] were released under
> CC BY-NC-SA 4.0. That licence cannot be withdrawn for those copies, so anyone who received
> them keeps the rights it gives them. It does not extend to questions or changes made after
> [date].
>
> The study guide (`src/content/`) and the verbal items (`data/verbal/`) stay under
> CC BY-NC-SA 4.0 [or: move with the bank, Pavol's call].

The README "Licence" paragraph gets the same split in two sentences.

### The history question

The bank's past versions stay in this public repo's git history (`data/bank/`,
`data/questions.json`, every commit since the first) unless the history is rewritten. Anyone
can check out an old commit and get them.

Rewriting means running `git filter-repo` to strip those paths from every commit and then
force-pushing `main` and every tag. That is destructive:

- every commit hash changes, so old links to commits and the `deploy-*` tags break;
- existing clones and forks keep the old history anyway;
- GitHub keeps the old objects reachable through closed PRs until GitHub Support is asked to
  run garbage collection.

It also hides nothing the live site doesn't already show. **It happens only on Pavol's
explicit yes.**

## Option B: `epso-kviz` itself goes private, hosted on Cloudflare Pages

The whole repo becomes private, the bank included, with no fetch step. GitHub Pages can't
serve a private repo on a free plan (it needs GitHub Pro for a personal account or Team for an
organisation), so hosting moves to Cloudflare Pages' free plan.

### Pavol's steps

1. **Make a Cloudflare account** (free) if he doesn't have one. Workers & Pages → Create →
   Pages → Connect to Git → authorise the Cloudflare GitHub app for `Chartres/epso-kviz` only.
2. **Build settings:** framework none, build command `npm run build`, output directory
   `dist`, environment variables `NODE_VERSION=22`, `VITE_SUPABASE_URL`,
   `VITE_SUPABASE_PUBLISHABLE_KEY` (the same values as the GitHub secrets).
3. **Custom domain:** Pages project → Custom domains → `epsokviz.dravec.org`. At the DNS host
   of `dravec.org`, change the `epsokviz` CNAME from `chartres.github.io` to
   `<project>.pages.dev`. Cloudflare issues the certificate itself, and the zone does not need
   to move to Cloudflare for a subdomain.
4. **Check the site on `<project>.pages.dev` first**, then switch the DNS. Then GitHub repo →
   Settings → Pages → unpublish.
5. **Make the repo private:** Settings → General → Danger zone → Change visibility → Private.
6. **Tell Claude it's done.** Claude removes the Pages deploy job and `public/CNAME` and
   keeps CI as the gate.

### The code change

- `deploy.yml`: drop the `deploy` job and `upload-pages-artifact`. Keep the `test` job as
  the gate. A private repo gets 2,000 free Actions minutes a month; a run takes a few minutes,
  so that is enough at the current pace, but it is a limit that doesn't exist today.
- `scripts/fetch-bank.mjs` stays off. The bank is in the same private repo.
- The `deploy-*` release tags move to a Cloudflare deploy hook or are dropped.
- **Flywheel side:** the orchestrator reads hand-backs from `raw.githubusercontent.com`.
  That stops working for a private repo unless it gets a token, so hand-backs would have to
  go somewhere else.

### What stays public on the live site

The same as Option A: the app bundle and the 51 prerendered pages.

### Licence wording

The same text as Option A, applied to the whole of `data/`. `LICENSE` (MIT, code) can stay
as it is. Nobody can read a private repo's code, so the MIT grant only matters for copies
already made.

### The history question

Making the repo private hides its history too, so the past versions of the bank are no
longer visible on GitHub. Clones and forks already made keep them. No rewrite is needed.

## Recommendation

**Option A, without a history rewrite.**

- It keeps what makes this product trustworthy in public: the code, the CI quote checks
  against the pinned texts, the list of unverified questions and the decision trail.
  `SIGNATURE.md` counts that trail as the moat ("unsourced questions are listed, not
  hidden"). Option B hides all of it to protect a bank the live site publishes anyway.
- It keeps GitHub Pages, the deploy tags, the flywheel hand-back path and the free Actions
  minutes as they are. Pavol's work is one repo, one token and one secret.
- A rewrite would break links and tags for no real gain, since every question is on the
  live site. Leave the history and let the licence note mark the line.

If what Pavol mainly wants is to stop people seeing the bank's history and notes, with no
token to renew each year, Option B does that with fewer moving parts, at the cost of the
public trail.
