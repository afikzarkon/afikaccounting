# AfikAccounting — Product & Audience Context

> The single source of truth for every non-code agent and skill in this repo
> (the `afik-*` agents and skills, and the installed marketing skills such as
> `copywriting`, `cro`, `onboarding`, `paywalls`, `pricing`, `referrals`,
> `marketing-psychology`, which all look for this file first).
> Update it when the product changes — do not restate these facts elsewhere.
> When a fact here disagrees with the code, **the code wins**: check the file named
> next to each fact and fix this document.

## 1. What the product is

An interactive Hebrew (RTL) web platform that teaches accounting standards and
bookkeeping through lessons you *do*, not lessons you watch. There's no equivalent
in the Israeli market: other options are static summaries, recorded lectures and
private tutors.

| Asset | What the student actually experiences | Where in code |
|---|---|---|
| Free course "חשבונאות מאפס" | 8 full lessons from debit/credit to statements, adjustments and credit losses | `src/lib/catalog.ts` (`basics`), `src/lib/learn/basics*.ts` |
| Advanced courses | IAS 2 Inventory, IAS 16 PP&E, IAS 19 Employee benefits — first lesson free in each (lesson counts: read them from the code, they change) | `src/lib/catalog.ts` (`preview`), `src/lib/study/*` |
| Practice with instant feedback | Exercises (tracked: done / ok / tries) and **traps** (מלכודות) — deliberately tempting wrong answers that get flagged and explained | `src/lib/study/score.ts` |
| Spaced review | A weak answer (wrong, right on the second try, or a trap fallen into) goes into box 0. It comes back after 1, then 3, then 7 days, and is mastered after 3 right in a row | `src/lib/study/review.ts`, `/review` |
| Exam-level questions | Booklet-level questions at the end of lessons; full solutions in tables | `src/lib/learn/*-exams.ts` |
| Exams archive | Past-exam style papers with full solutions; samples are open to all | `src/lib/exams`, `canOpenExam` in `src/lib/access.ts` |
| Calculators ("Solution Engine") | IFRS 16, IAS 16, IAS 37, IAS 12, IAS 19 — show the whole path: journal entries, schedules, disclosure note | `src/lib/engine`, `ENGINE_TOOLS` in catalog |
| Spreadsheet panel | Excel-like sheet next to practice questions | `src/components/sheet` |
| Gamification today | In-lesson XP (screen 5, right first try 10, right on the second try 5, trap avoided 10), an in-lesson **answer streak** (best run kept), and a summary card with an XP ring. **No daily/return streak, no cross-course mastery view, no social layer yet** | `XP` in `src/lib/study/score.ts`, `src/components/study-mode/lesson-stats.tsx`, `summary-card.tsx` |

## 1b. Scope & launch (owner decisions, 2026-11-08)

- **Not launched yet.** The site goes public only when every semester-A topic of both years is ready.
- **Year 1, semester A:** basics from zero · IAS 16 PP&E · IAS 2 inventory · preparing financial statements.
  **Year 2, semester A:** IAS 19 employee benefits · financial instruments · non-profits (מלכ״רים).
  Built today: most of year 1 (basics, IAS 2, IAS 16); in year 2 only IAS 19. Not built: preparing financial statements, financial instruments, non-profits.
- **Multi-institution.** Several colleges/universities, each teaching the topics in a different order; more topics may be added.
  So the unit of access is the **topic (module)**; an institution's course is a navigation mapping onto modules, not a product.
- **Course contents are not final.** Lessons, their order, screens, exercises and traps inside each course are still changing.
  Never hard-code a lesson slug, a trap id or a lesson count in product code, copy or plans: derive them from `src/lib/catalog.ts`
  and `src/lib/study/*` (as `src/lib/check.ts` does), write copy without counts or with counts read from code, and write tests
  that check rules ("five traps, one per lesson, from a free lesson") rather than particular content.
- **Each topic** = interactive lessons + full videos; exams with full video solutions are sold as an add-on.
- Proposed pricing model (not yet approved): `docs/strategy/decisions/2026-11-08-pricing.md` — year bundles + single modules + exam add-ons, one-time payments, no auto-renew.

## 2. Plans in code today (placeholder prices — superseded by the proposal above once approved)

Source: `src/lib/pricing.ts` (`PRICES_ARE_FINAL = false`).

| Tier | Name | Gives | Price |
|---|---|---|---|
| `free` | חינם | Full basics course, practice + traps, exam-level questions, first lesson of every advanced course | ₪0, no card |
| `courses` | קורסים (featured) | All advanced courses + IAS 19 calculator | ₪49/mo · ₪390/yr *(placeholder)* |
| `exams` | קורסים + מבחנים | + full from-scratch exam solutions, exams archive, first access to new exams | ₪89/mo · ₪690/yr *(placeholder)* |

The access rules are in `src/lib/access.ts`. A cancellation keeps the plan until the end of
the period that was paid for. Payments are provider-agnostic (`src/lib/billing`).

## 3. The funnel we already measure

Source: `src/lib/analytics/events.ts`. Events are anonymous per tab unless signed in.

```
landing_view → lesson_start → signup → course_complete → paywall_view → pricing_view
→ plan_click → checkout_start → payment_success   (+ subscription_cancel)
```

Other events: `page_view`, `calc_run`, `calc_invalid`, `download`, `video_play`, `preset_load`.
**Not measured yet** (candidates; proposing one means editing `EVENT_KINDS`):
`lesson_complete`, `exercise_answer`, `trap_hit`, `review_session`, `share_click`,
`referral_signup`, `streak_day`.

## 4. Who the student is

**Primary:** Israeli undergraduates in accounting / economics-and-accounting at universities and colleges,
years 1–3, studying in Hebrew. **Secondary:** candidates for the Israeli CPA board exams;
business-administration students forced through a financial-accounting course.

| Segment | Trigger moment | Job to be done | Typical alternative |
|---|---|---|---|
| "First-year shock" | Week 3–5 of Intro to Financial Accounting; first quiz went badly | "Make debit/credit finally click before I fall behind" | Lecturer slides, a friend's notebook, YouTube |
| "Exam-panic" (largest) | 2–4 weeks before מועד א׳/ב׳ | "Get me to pass this standard's exam questions" | WhatsApp group summaries, Drive folders of past exams without solutions, private tutor (₪150–250/hr — verify before quoting) |
| "Retaker" | After failing מועד א׳ | "Don't fail again; find exactly where I lose points" | The same summaries that failed them, a tutor |
| "Ambitious / CPA-track" | Ongoing | "Real mastery, top grade, CPA exams" | Prep courses (expensive, lecture-based) |

**Calendar reality:** demand is seasonal and spiky — semester start (Oct/Nov, Mar), and above
all the exam periods (roughly Jan–Feb, Jun–Jul, plus מועד ב׳ / summer). Plan everything
around the academic calendar, not the calendar month.

**Channels where students actually are:** course WhatsApp groups (the #1 distribution channel
and the #1 competitor), Instagram & TikTok, student-union (אגודת הסטודנטים) channels,
Telegram/Drive folders of summaries, teaching assistants (מתרגלים), Google search for
"פתרון מבחן" / standard names.

## 5. Core objections (detail in `afik-objection-copy`)

1. "There are free summaries in the WhatsApp group."
2. "I'll just do past exams the night before."
3. "A subscription? I'm a student." / "I'll forget to cancel."
4. "Does it match *my* lecturer / my institution?"
5. "I'm just bad at accounting." (identity fear — the deepest one)
6. "A friend will share their login."

## 6. Positioning

- **Category we create:** "סימולטור חשבונאות" — practice that tells you *where* you'd lose points, before the exam does.
- **One-liner (working):** סיכום אומר לך מה כתוב בתקן. אצלנו אתה פותר — ורואה בדיוק איפה היית נופל.
- **Proof points we can honestly claim:** full free course with no card; traps that are explained;
  spaced review of *your* mistakes; full exam-level solutions in tables; calculators that show every journal entry.
- **Never claim** grades, pass rates, "endorsed by", institution names or numbers we haven't measured.
  If a claim needs data, write `[NEEDS DATA: …]`.

## 7. Voice

Hebrew, second person, direct, a little warm, a little cheeky — a sharp senior student who already
passed, not a lecturer and not a hype marketer. Concrete over clever ("14 שיעורים, כל אחד נגמר בשאלת מבחן")
rather than abstract ("למידה חכמה ומהפכנית"). Accounting terms in Hebrew with the standard number
(IAS 16) as the anchor. Gendered Hebrew: alternate forms or use plural/neutral phrasing
(״פותרים״, ״אפשר״) instead of defaulting to masculine. No AI tells (see `stop-slop`).

## 8. Non-negotiables

- **No dark patterns.** Cancellation is as easy as signing up (and this is required by Israeli consumer law for
  online subscriptions — confirm specifics with counsel). No fake scarcity, no fake timers, no confirm-shaming.
  Run `marketing-psychology:dark-pattern-check` on any paywall or pricing change.
- **Accuracy first.** An accounting error in a marketing asset destroys trust with this audience faster than anything.
  Accounting content in copy must match the lessons.
- **Hebrew-first, RTL-first, mobile-first.** Most first visits come from a phone, via a WhatsApp link.
