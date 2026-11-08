---
name: afik-freemium-onboarding
description: Freemium & onboarding architect for AfikAccounting. Use when deciding what is free vs paid, which module or standard is the free hook, where and how to place a paywall or subscription gate, designing first-session onboarding, defining the activation / "aha" metric, choosing trial or semester-pass mechanics, or reviewing the free→paid conversion path (catalog preview, pricing page, paywall, checkout).
---

# Freemium & Onboarding Architect

Design the path from "a link in a WhatsApp group" to "a student who pays because they already felt it work".
Ground everything in `.claude/product-marketing.md` and in the real gating code:
`src/lib/catalog.ts` (`tier`, `preview`), `src/lib/access.ts` (`canAccessWith`, `canOpenExam`), `src/lib/pricing.ts`.

## 1. The aha moment — define it before designing anything

For AfikAccounting the aha is **not** "this explains IAS 16 nicely" (a summary does that). It is:

> **"I just solved a question I was sure I couldn't — and I saw exactly where I would have lost points."**

It has three ingredients, and the first session must deliver all three:
1. **Doing**, not reading: an exercise, entry or trap within 60–90 seconds of landing.
2. **A trap caught** — the student meets the mistake they would have made, explained (`traps` in `TopicProgress`).
3. **A finished thing**: a question at exam level, solved to the end, with the full solution table.

**Activation metric (proposed, measurable):** a visitor is *activated* when, within 7 days of their first visit, they
(a) answer ≥ 5 practice items, including ≥ 1 trap, **and** (b) come back on a second day (a review session or a new lesson).
Today we can approximate it with `lesson_start` + `course_complete`. To measure it properly, propose adding
`exercise_answer` / `trap_hit` / `review_session` to `EVENT_KINDS` in `src/lib/analytics/events.ts`.
Validate the definition once data exists: the right activation metric is the one that best predicts `payment_success` within a semester.

## 2. Two front doors, one hook each

Students arrive in two very different states (segments in product-marketing §4). Give each a door that matches:

| Door | Who | Landing | The free hook | Why it works |
|---|---|---|---|---|
| **A. "מאפס"** | First-year shock, business students | `/basics` | The full free course *חשבונאות מאפס* (already free) — lead with lesson 1's hands-on "עסק שלם, פקודה אחר פקודה" lab | Removes identity fear with an early guaranteed win; builds the habit before exam season |
| **B. "לפני המבחן"** | Exam-panic, retakers (the money segment) | A standard's exam page, e.g. IAS 16 | **One real exam-level question per paid standard, fully solvable without signup**, plus the free first lesson (`preview`) and the calculator that shows every entry | Meets the panic where it is; proves "this gets me points" in minutes. Basics is too easy for this student and won't convert them |

**Recommended flagship hook for door B: IAS 16 revaluation/impairment** (or IAS 19 actuarial gains/losses).
These are the notorious exam killers: high fear, a high trap density, and a visual "aha" (the carrying-amount timeline). The free first lesson
alone (`ias16-intro`) is an *introduction*, and introductions don't scare anyone into paying. Offer the hard part as a free, single, complete question,
and keep the *course* (the rest of its lessons, the drills, the review of those mistakes, the exams archive) behind the gate.

## 3. Gate placement rules

**Gate depth, not taste.** The student must be able to *experience* each paid thing before being asked to pay for it.

1. **Never gate mid-question or mid-flow.** The paywall appears at a *natural seam*, right after a win:
   end of a lesson summary card, "next lesson" on the course path, opening a locked exam solution.
2. **Gate on earned desire.** Best moments to show `paywall_view`, in order of intent:
   - Finished the free first lesson of a paid course → "next lesson" click (desire for continuation).
   - Solved the free exam question and asks for "another like it" (desire for more of the same).
   - Opens a full exam solution from the archive (`canOpenExam` → exams tier).
   - Review queue shows mistakes from the free lesson, and the next lesson's drills are locked.
3. **Show what's behind the gate.** Locked lessons are listed with titles, length and "ends with an exam question" — not hidden.
   A blurred-but-real solution table beats a padlock icon.
4. **Keep the habit engine free.** Spaced review of mistakes *from free content* stays free forever: it's the retention engine
   that brings students back on day 2, 3 and 7, which is when they convert. Paid content feeds more items into the same review.
5. **One gate copy, segment-aware.** The paywall reads `?from=` (the locked lesson); use it to name what they're unlocking
   ("להמשיך ל־IAS 16, שיעור 2: עלות הנכס") instead of a generic upsell.
6. **Signup ≠ payment.** Ask for signup when there is something to save ("שמרו את ההתקדמות ואת 3 הטעויות שלכם לחזרה מחר"),
   long before asking for money. Guests can do the whole first lesson.

## 4. Pricing-mechanics options (owner decides; prices are placeholders)

Present these as options with trade-offs. Never set prices yourself.

| Mechanic | Fit for this audience | Risk |
|---|---|---|
| **Semester pass** (pay once, ~5 months, no auto-renew) | Matches how students budget and think; kills "I'll forget to cancel" | Lower LTV per student; needs re-buy campaign each semester |
| **Exam-period pass** (e.g. 6 weeks up to מועד ב׳) | Matches the panic segment exactly; a high-intent impulse buy | Trains students to only buy before exams |
| Monthly auto-renew (current) | Simple; recurring | Highest subscription aversion; churn after exams is guaranteed |
| Yearly (current) | Good for CPA-track | Hard sell to a student before they trust us |
| 7-day full trial, no card | Lowers risk perception | Trial during exam week = binge then leave; requires strong day-5 conversion moment |

Default recommendation to test first: **keep monthly + add a no-auto-renew semester pass**, framed per-semester; A/B the pricing page (`ab-testing` skill).
Run `marketing-psychology:price-framing` and `marketing-psychology:dark-pattern-check` on any pricing change.

## 5. First-session onboarding script (door B, mobile, ≤ 3 minutes)

| t | Screen | Goal | Copy direction (Hebrew) |
|---|---|---|---|
| 0s | Landing on the question (from a shared link) | No friction: the question *is* the page | ״שאלת שערוך מתוך מבחן. רוב הסטודנטים נופלים בסעיף ב׳. בוא נראה.״ |
| 10s | Optional 1-tap context: "Which exam? when?" (standard + date) | Personalisation + commitment; powers the countdown | ״מתי המבחן?״ — chips: השבוע / החודש / עוד לא יודע |
| 20s–2m | Solve, with the trap | Doing + trap caught | Trap explanation leads with *why it's tempting*, then the rule |
| 2m | Full solution table + "you'd have lost X points here" | Finished thing; the aha | ״ככה זה נראה בפתרון מלא — ואת זה בודקים במבחן.״ |
| 2.5m | Save prompt (signup) | Endowment: they now have something to lose | ״שמרו את הטעות הזאת — היא תחזור אליכם מחר לחזרה של 2 דקות.״ |
| next day | Review prompt (email/push) | Day-2 return = activation | ״הטעות מאתמול מחכה. 2 דקות, ואז היא שלכם.״ |

Door A (basics) is the same pattern with lesson 1's lab as the first screen and no exam-date question
(use "what are you studying?" instead).

## 6. Deliverable format

When asked to design or review freemium/onboarding, return:
1. **Aha & activation** — the definition in this context and how it's measured (events, existing or proposed).
2. **Gate map** — table: `Surface (route/component) | Free / Locked | Gate trigger | What is previewed | Copy | Event fired`.
3. **Onboarding flow** — step table as in §5, for the segment in question.
4. **Changes to code-level config** — e.g. "add the slug of the chosen hook (look it up in `src/lib/study/ias16`) to `preview` of `ias16` in `src/lib/catalog.ts`" — as a spec for the main session, not as edits.
5. **Experiment** — hypothesis, metric (activation rate or `paywall_view → payment_success`), comparison, expected direction, guardrail (e.g. D7 retention must not drop).

See `references/gate-audit-checklist.md` for the review checklist.
Related installed skills: `onboarding`, `signup`, `paywalls`, `pricing`, `cro`, `ab-testing`.
