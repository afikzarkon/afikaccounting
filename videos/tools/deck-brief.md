# Brief: one video deck per lesson of the "חשבונאות מאפס" (basics) course

The course owner turns each site lesson into a video: a slide deck whose elements appear one by one while the owner narrates, in their own recorded voice, a script we write into each slide's speaker notes. A renderer later times each element to the spoken word. Your job: build ONE lesson's deck as local files. Do not publish anything, do not touch the git working tree, do not commit.

## Where things are

- Repo: C:\Users\afik1\Desktop\AfikAccounting. The current lesson content is on `origin/main` (the local branch is behind). Read it with `git show origin/main:<path>`, never from the working tree.
  - Lesson data: `src/lib/study/basics/<lesson>.ts` (screens list, questions, numbers), plus `shared.ts`, `drills.ts`, `exam-worked.ts` where referenced.
  - Screen components: `src/components/basics/*.tsx` (the lesson's .tsx and the widgets it imports). The explanations, stories and numbers live here. Read every screen of your lesson fully.
- Reference deck (lesson 1, finished and approved): `C:\Users\afik1\AppData\Local\Temp\claude\6ae09ff363016878\70580d38-a23d-45e5-bfb4-eb48958d9233\scratchpad\basics1\project\` — `deck.json` and `slides/*.html`. Read deck.json and at least goals.html, translate.html, itai-pl.html, itai-bs.html, types.html, debit-not-debt.html, summary.html before writing anything. Copy their structure, styles, colors, fonts, footer and notes style exactly.
- Your output folder: `...\scratchpad\basicsN\project\` (N given in your task), with `deck.json` and `slides/<id>.html`.

## Content rules

- The deck mirrors the site lesson screen by screen, in the site's order, with the site's stories, names and numbers. Teach ALL the concept material of the lesson. Do not invent new examples and do not change numbers. Verify every number you show against the source (recompute totals).
- No quiz or "try it yourself" slides. Practice items, worked examples and booklet/exam-level questions that the screen solves are walked through WITH their answers (state the question, then show the solution step by step across builds).
- Skip pure interactive tools with no fixed content (endless drills "תרגול בלי סוף", games, calculators). If a game screen has a fixed teaching example, you may use it.
- Start with a cover slide and a "בסוף השיעור תדעו" goals slide (from the lesson's outcomes), end with a summary slide that also names the next lesson. Add `sections` in deck.json at natural topic breaks.
- Size: as many slides as the material needs, usually 18–40. One idea per slide; split dense screens.

## Visual rules

- Copy lesson 1's HTML conventions exactly: one `<section id="..." data-transition="fade" style="...">` per file, all styles inline, 1920×1080 canvas, bg #f2f5f0, dark #0f3d2e, accent #1d6b47, card #fbfcf9, border #d3ded6, strip #dcebe1, muted #3f5248/#6b7d73, red #b42318, debit blue #1f5fa8, credit amber #b45309. Fonts Frank Ruhl Libre (headings) and IBM Plex Sans Hebrew (body) — same `faces` block in deck.json as lesson 1.
- Footer on every slide except the cover: `חשבונאות מאפס · שיעור N: <lesson title>` positioned like lesson 1.
- Hebrew/RTL: the engine has no RTL. Start every Hebrew text element with `&#8235;`, right-align text, build rows with `flex-direction:row-reverse`. Number-only cells get no `&#8235;` (so minus signs render right).
- Only plain HTML + inline CSS. Do NOT use `<x-icon>`, `<x-shape>`, `<x-connector>`, `<x-embed>` or any custom element (the video renderer can't draw them). A small inline `<svg>` is acceptable only if truly needed.
- Accounting layouts as an accountant writes them:
  - Journal entries: a table with חשבון / חובה / זכות columns (debit lines first, credit lines indented or labelled "ל-" as on the site).
  - T-accounts: a T-card with debit on the right, credit on the left, balance line on the smaller side.
  - Trial balance: a table with חשבון / חובה / זכות columns and totals.
  - Worksheet (גיליון רב-טורי): debit/credit pairs per column group, as the site shows it.
  - Statements (P&L, balance sheet): vertical column with totals, like lesson 1's itai-pl/itai-bs.
  - Do not explain sign conventions on slides.
- Animation: elements that should appear with the narration get `data-build-in="rise K"` (or `fade K` / `pop K`), K = 1,2,3… in build order. Several elements may share a K. Static titles get none. Typically 2–6 builds per slide. Make sure the slide still fits 1920×1080 when everything is shown (no overflow: keep text ≥ 28px but don't overcrowd; tables ≤ ~9 rows per slide).

## Narration script (the most important part)

- One `<aside>…</aside>` per slide, just before `</section>`, holding what the owner will say for that slide.
- Insert silent cue markers `[1]`, `[2]`… exactly where each build K should appear — the marker sits right before the words that introduce that element. Every K used in the slide must have exactly one marker, in increasing order, and no marker without an element.
- Tone: light, warm and conversational, like a good tutor talking to students in a relaxed way. Spoken Hebrew, plural "אתם". Short sentences, natural rhythm, small asides ("נשמע מסובך? זה פשוט", "תכלס", "יאללה" — sparingly), concrete examples. Read lesson 1's scripts (they were just rewritten in this voice) and match them.
- Avoid chatbot tells: no "בואו נצלול", no "לא X, אלא Y" reveals as a style, no slogan-with-colon headlines, no tidy triads everywhere, no rhetorical over-setup.
- Say numbers as they'd be spoken naturally in full Hebrew words where it matters ("שלושים ושישה אלף שקל"); keep course terms exactly as the site writes them. Account names as on the site.
- The script must teach: explain why, not just read the slide. But keep each slide's script to roughly 20–90 seconds of speech.

## When done

- Check: every slide id in `order` has a file; every file has exactly one `<aside>`; for each slide the set of build numbers equals the set of cue markers; no `x-` elements; all numbers verified.
- Report back briefly (in English): slide count, the list of slide ids with one-line topics, which site screens you skipped and why, and any content doubts (a number or rule in the source that looked wrong). Do not paste slide HTML in the report.
