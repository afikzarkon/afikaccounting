# Brief: one video deck per lesson of the "הטבות עובד" (IAS 19) course

The course owner turns each site lesson into a video: a slide deck whose elements appear one by one while the owner narrates, in their own recorded voice, a script we write into each slide's speaker notes. A renderer later times each element to the spoken word. Your job: build ONE video's deck as local files. Do not publish anything, do not commit, and change no file outside your output folder.

## The videos (site lesson → video)

The site has 8 lessons; lessons 4–6 are each split into two videos at the site's own "חלק ב׳" seam.

| Video | Folder | Site lesson | Lesson data (src/lib/study/ias19/lessons/) |
|---|---|---|---|
| 1 | ias19-1 | 1 יסודות: ארבעת סוגי ההטבות, וכלי המימון | map.ts + toolkit.ts |
| 2 | ias19-2 | 2 הטבות לזמן קצר | short.ts |
| 3 | ias19-3 | 3 הפקדה מוגדרת | dc.ts |
| 4a | ias19-4a | 4 חלק א׳: מדידה בנקודת זמן | measure.ts |
| 4b | ias19-4b | 4 חלק ב׳: לאיזו שנה שייך כל חלק | attribute.ts |
| 5a | ias19-5a | 5 חלק א׳: תנועה בהתחייבות | rollforward.ts |
| 5b | ias19-5b | 5 חלק ב׳: שינוי תנאים באמצע השנה | amend.ts |
| 6a | ias19-6a | 6 חלק א׳: נכסי תכנית ותקרת נכס | assets.ts |
| 6b | ias19-6b | 6 חלק ב׳: הצגה בדוחות | present.ts |
| 7 | ias19-7 | 7 הטבות אחרות לזמן ארוך ופיטורין | other.ts |
| 8 | ias19-8 | 8 מבחנים מסכמים | exams.ts |

## Where things are

- Repo: C:\Users\afik1\Desktop\AfikAccounting. The working tree (`main`) is current; read from it.
  - Course assembly, titles, outcomes, screen order: `src/lib/study/ias19/index.ts` and `shared.ts`.
  - Lesson data: the files in the table (screens list, questions, numbers), plus `worked.ts`, `tools-worked.ts`, `formulas.ts`, `primer.ts` where referenced.
  - Screen components: `src/components/basics/ias19-course*.tsx` and the widgets they import (`ias19-visuals.tsx`, `ias19-interactive.tsx`, `ias19-ui.tsx`, `ias19-absence-client.tsx`…). Find each screen by its id (`emp-…`). The explanations, stories and numbers live here. Read every screen of your lesson fully.
- Reference deck (approved, own-voice format): `videos/basics2/deck/` — `deck.json` and `slides/*.html`. Read deck.json and at least cover.html, goals.html, equation.html, credit-sale.html, loan-run.html, summary.html before writing anything. Copy their structure, styles, colors, fonts, footer position, build attributes and notes style exactly.
- Your output folder: `videos/<folder>/deck/` with `deck.json` and `slides/<id>.html`.

## Content rules

- The deck mirrors the site lesson screen by screen, in the site's order, with the site's stories, names and numbers. Never invent an example or a number, and never change one. Verify every number you show against the source (recompute totals, present values and interest yourself).
- Focus over completeness: ONE explanation and ONE worked example per idea. No second case of the same kind.
- Skip: "בדיקת שליטה" screens, question generators/drills ("מחולל שאלות", "תרגול … במספרים חדשים"), labs, booklet-level closing questions (`emp-bk-*`) and summary exams (`emp-mx-*`, `emp-short-exam-*`). A "פותרים יחד" screen is skipped when it is another case of the solved example; if it carries an idea taught nowhere else, use it as that idea's one example.
- No quiz or "try it yourself" slides. Anything the screen asks is shown WITH its answer (state the question, then the solution across builds).
- Start with a cover slide and a "בסוף השיעור תדעו" goals slide (from the lesson's outcomes that belong to this video), end with a summary slide that also names what comes next. Add `sections` in deck.json at natural topic breaks.
- Size: one idea per slide; split dense screens. Target counts: video 1 ≈ 26, 2 ≈ 28, 3 ≈ 16, 4a–6b ≈ 16–19 each, 7 ≈ 26, 8 ≈ 16.
- Cover line: `הטבות עובד · שיעור N` (for split lessons `שיעור N · חלק א׳/ב׳`). deck.json title: `הטבות עובד — שיעור N: <title>`.

## Visual rules

- Copy the reference deck's HTML conventions exactly: one `<section id="..." data-transition="fade" style="...">` per file, all styles inline, 1920×1080 canvas, bg #f2f5f0, dark #0f3d2e, accent #1d6b47, card #fbfcf9, border #d3ded6, strip #dcebe1, muted #3f5248/#6b7d73, red #b42318, debit blue #1f5fa8, credit amber #b45309. Fonts Frank Ruhl Libre (headings) and IBM Plex Sans Hebrew (body) — same `faces` block in deck.json.
- Footer on every slide except the cover: `הטבות עובד · שיעור N: <short lesson title>`, positioned like the reference.
- Hebrew/RTL: the engine has no RTL. Start every Hebrew text element with `&#8235;`, right-align text, build rows with `flex-direction:row-reverse`, timelines flow right→left. Number-only cells get no `&#8235;`. Formulas read left to right as the site shows them.
- Only plain HTML + inline CSS. No `<x-icon>`, `<x-shape>`, `<x-connector>`, `<x-embed>` or any custom element. A small inline `<svg>` only if truly needed.
- Accounting layouts as the site shows them:
  - Roll-forward ("המעגל") and schedules: one vertical column, opening at the top, movements, closing at the bottom; credit negative, debit positive, exactly the site's signs.
  - Journal entries: a table with חשבון / חובה / זכות columns.
  - T-accounts and trial balances: T-cards or חובה/זכות tables, never a running column.
  - Worked results: formula first, then the numbers, then the Excel way if the site gives it.
- Animation: elements that appear with the narration are pinned (`position:absolute`) and get `data-build-in="rise K"` (or `fade K` / `pop K`), K = 1,2,3… in build order. Several elements may share a K. Static titles get none. Typically 2–6 builds per slide. Everything must fit 1920×1080 when fully shown: text ≥ 24px (body ≥ 28px), tables ≤ ~9 rows, nothing below y 920 except the footer.

## Narration script (the most important part)

- One `<aside>…</aside>` per slide, just before `</section>`, plain text.
- Silent cue markers `[1]`, `[2]`… exactly where each build K should appear — right before the words that introduce that element. Every K used in the slide has exactly one marker, in increasing order; no marker without an element.
- Tone: light, warm, conversational spoken Hebrew, plural "אתם". Short sentences, natural rhythm, a small aside now and then ("נשמע מסובך? זה פשוט", "תכלס" — sparingly). Read the reference deck's notes and match them.
- No chatbot tells: no "בואו נצלול", no "לא X, אלא Y" reveals as a style, no slogan-with-colon lines, no tidy triads everywhere.
- No English words in the narration: "התקן", never "IAS 19". If the site uses a Latin term with no Hebrew form you can say (LIFO, FIFO, OCI, PV…), write it the way it is said aloud in Hebrew and list it in your report.
- Numbers as digits, as they appear on the slide: "120,000", "6%", "ב-31 בדצמבר". Course terms exactly as the site writes them ("לאחר סיום העסקה").
- Breath lines: split the notes with a real newline into lines; each line is a few sentences said together in one go. No blank lines.
- The script teaches: it explains why, it does not read the slide. Roughly 20–90 seconds of speech per slide.

## When done

- Run `node videos/tools/check_deck.mjs videos/<folder>/deck <scratch shots dir>` (from the repo root; `node_modules` is installed in videos/tools) and fix until it prints "no problems". Look at a few of the screenshots, especially tables and RTL rows.
- Report back briefly (in English): slide count and estimated minutes, the slide ids with one-line topics, which site screens you skipped and why, Latin terms you had to voice, and any content doubt (a number or rule in the source that looked wrong). No slide HTML in the report.
