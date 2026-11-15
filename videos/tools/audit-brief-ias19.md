# Audit brief: does every slide match the site lesson?

The course owner's rule: every slide must match the site's course. No invented numbers, no invented data (stories, names, dates, rates, headcounts, conditions), and no data taken from somewhere else — another lesson, another screen's example, the exam lesson, a generator, or general knowledge.

Repo: C:\Users\afik1\Desktop\AfikAccounting. Decks: `videos/ias19-<n>/deck/slides/*.html` (slide text + narration in `<aside>`). Course source: `src/lib/study/ias19/index.ts`, `shared.ts`, `lessons/*.ts`, `src/lib/learn/ias19*.ts`, and the screen components `src/components/basics/ias19-*.tsx` (find each screen by its `emp-…` id).

Video → site lesson → data file: 1 → lesson 1 (map.ts + toolkit.ts); 2 → short.ts; 3 → dc.ts; 4a → measure.ts; 4b → attribute.ts; 5a → rollforward.ts; 5b → amend.ts; 6a → assets.ts; 6b → present.ts; 7 → other.ts; 8 → exams.ts.

## What to do for each slide of your deck(s)

1. Find the site screen(s) the slide comes from. Write down the screen id.
2. For every given (an input: amount, rate, date, years, headcount, name, condition), confirm it appears in THAT lesson's screens or that lesson's own data (its quizzes, traps and exercises count as the lesson's). If it comes from a different lesson, the exam lesson, another deck's lesson, or nowhere: it is a violation.
3. For every result (a computed figure), recompute it from the givens using the site's own formulas or functions (you may run the site's functions with `npx tsx`). It must equal what the site shows, or what the site's code computes. Mismatch = violation.
4. Plain arithmetic lines between site givens and site results (e.g. 70,000 × 6/12 = 35,000) are allowed, but list them.
5. Narration: same checks — no facts, numbers or claims the site does not support.

A scan already listed numbers on each slide that do not appear literally in the source (most are computed results): `C:\Users\afik1\AppData\Local\Temp\claude\77dc8613ad0299b5\0d654087-daef-4c59-8654-7620dbb3e24a\scratchpad\numscan.json`. Every one of those must be either recomputed and confirmed, or fixed. But do not stop there: borrowed data usually DOES appear in the source (from the wrong place), so check provenance of every given yourself.

## Fixing

- Wrong result → the site's figure.
- Borrowed or invented given → replace it with the matching figure from this lesson's own screen if the screen has one; otherwise remove the element (and its build/cue) or reword so no number is claimed. Never substitute a new number of your own.
- Edit slide HTML directly; keep cue markers [K] matching `data-build-in` K (one each, in order); keep RTL marks. Do not rerun any generator script.
- Run `node videos/tools/check_deck.mjs videos/ias19-<n>/deck <scratchpad>\audit-<n>` from the repo root until "no problems"; look at screenshots of any slide you changed.
- Touch only your deck folder(s). No publishing, no commits.

## Report (English, short)

Per deck: slides checked; every violation found (slide id, what, where it came from, how fixed); arithmetic lines kept; anything you could not verify. If a slide is clean, don't list it.
