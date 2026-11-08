# AfikAccounting Growth Playbook

> The living go-to-market plan. Owned by the `afik-growth-strategist` agent; updated by the `afik-council` skill.
> Product facts come from `.claude/product-marketing.md`. Numbers we don't have yet are `[NEEDS DATA]` — fill them in from `/admin` analytics.
> Last structural update: 2026-11-08 (semester A 2026/27 under way; next peak = מועד א׳, roughly late Jan–Feb 2027 — confirm the dates per institution).

---

## 1. North star & metric tree

**North star:** *weekly learners who answered ≥ 10 practice items* (WAL-10). It captures real learning, predicts conversion, and
can't be gamed by traffic alone. Revenue follows it, with a lag of one exam period.

```
Paying students per exam period
├── Acquisition   new visitors per week by source (landing_view, page_view + UTM)
├── Activation    % of new visitors activated in 7 days (see afik-freemium-onboarding §1)
│                   proxy today: lesson_start → signup → course_complete
├── Conversion    activated → paywall_view → pricing_view → plan_click → checkout_start → payment_success
├── Retention     D1 / D7 / D30 return; review sessions per active learner per week
└── Referral      share_click → visits from shares → signups from shares (k-factor)  [NEW events]
```

**Events to add** (one PR, in `src/lib/analytics/events.ts` + call sites): `lesson_complete`, `exercise_answer`, `trap_hit`,
`review_session`, `share_click`, `referral_signup`, `streak_day`, `exam_goal_set`. Without them, activation and the loops below can't be measured.

## 2. Funnel targets (fill after 2 weeks of data)

| Step | Event | Baseline | Target by מועד א׳ | Main lever |
|---|---|---|---|---|
| Visit → start lesson | landing_view → lesson_start | [NEEDS DATA] | [set] | Land on the question itself (door B), not the home page |
| Start → signup | lesson_start → signup | [NEEDS DATA] | [set] | "Save your mistakes for tomorrow" prompt after the first trap |
| Signup → activated | signup → (≥5 items + day-2 return) | [NEEDS DATA] | [set] | Day-2 review message; exam countdown |
| Activated → paywall | → paywall_view | [NEEDS DATA] | [set] | Free first lesson ends on a strong "next lesson" seam |
| Paywall → pay | paywall_view → payment_success | [NEEDS DATA] | [set] | Name what's unlocked; risk reversal; semester pass test |
| Paid → retained to exam | subscription_cancel before exam date | [NEEDS DATA] | [set] | Readiness meter + countdown plan |

## 3. The four growth loops

### Loop 1 — Trap-share (viral, the cheapest engine)
```
Student falls into a trap → sees "רוב הסטודנטים נופלים כאן" + "בואו נראה את החברים" → share card to the course WhatsApp group
→ friend opens ONE question, answers WITHOUT signup → sees the trap explained → "save + continue" → signs up → falls into a trap → shares
```
- **Build:** per-question public URL with a Hebrew OG image + description (Next.js `opengraph-image` per route — check `node_modules/next/dist/docs/` first);
  a share button on the trap-feedback and summary cards; UTM `utm_source=whatsapp&utm_medium=share&utm_campaign=trap`.
- **Measure:** `share_click` → landings with that UTM → `signup`. k = shares per user × signups per share. k ≥ 0.3 is a strong supplement for a niche edtech.
- **Copy:** `afik-objection-copy` → templates §2.

### Loop 2 — Study group (relatedness + viral)
```
One student sets an exam date → "study it with your group?" → group room link to WhatsApp → friends join → shared countdown and weekly co-op challenge
→ group members convert together (group offer) → next course, same group
```
- Build after loop 1 (needs `study_groups` tables, see `afik-gamification` mechanics §6).

### Loop 3 — Teaching assistants & ambassadors (credibility)
```
Recruit מתרגלים and top students per institution → free exams-tier access + personal link + a monthly content pack (one trap, one exam question)
→ they share in their section's group and in office hours → their credibility carries the click → signups attributed to their link → reward
```
- **Target:** 1–2 ambassadors per accounting program at the main universities and colleges. Start with the 3–5 largest programs [NEEDS DATA: enrolment per program].
- **Rules:** disclose the relationship; ambassadors never post fake reviews; give them real content, not scripts to paste.
- **Reward:** free access while active + a revenue share or a per-paying-referral bonus (owner decides).

### Loop 4 — SEO content (compounding)
```
Every exam question / standard topic / calculator → an indexable Hebrew page ("פתרון שאלת שערוך IAS 16", "מחשבון חכירות IFRS 16")
→ Google & AI answers → land on the question → lesson 1 → signup
```
- Use `programmatic-seo`, `schema` (Quiz / LearningResource / FAQPage), `ai-seo`. Free calculators (`/engine`) are natural lead magnets (`free-tools`).
- Keep the full solutions of exams-tier content gated; index the question, the trap explanation and the first step.

## 4. The academic-calendar operating rhythm

| Window (approx.; confirm per institution) | Student state | Our focus | Assets |
|---|---|---|---|
| Semester start (late Oct–Nov; Mar) | Hopeful, low urgency | Door A, habit, ambassador recruitment | Basics course pushes; "5 minutes a day" challenge; TA outreach |
| Mid-semester (Dec; Apr–May) | Falling behind quietly | SEO + content assets; study groups | Trap-of-the-week posts; exam-countdown feature launch |
| **Exam run-up (−4 to −1 weeks before מועד א׳: ~Jan; ~Jun)** | **Panic, peak intent** | **Door B, conversion, all loops on** | Exam-question shares; semester/exam pass; ambassador packs; retargeting |
| Results / between מועדים (Feb–Mar; Jul–Aug) | Relief or "I failed" | Retakers, fresh start | "Find exactly where you lost points" campaign; מועד ב׳ pass |
| Summer | Low; CPA-track active | CPA-track, SEO, product building | Advanced content; exam archive growth |

## 5. Channel playbooks

**WhatsApp (where the competition lives).** Never spam groups as a brand. Win through (1) share cards that students themselves want to post,
(2) ambassadors, (3) a WhatsApp-native experience: fast mobile landing, Hebrew OG previews, no signup wall before the first answer.

**Instagram / TikTok.** Format: "the trap in 20 seconds" — the tempting wrong answer, why it's tempting, the right one, link to the question.
Post 3×/week in the run-up, 1×/week otherwise. Batch-record in quiet weeks. Hooks: `afik-objection-copy` templates §7; production: `video`, `social`.

**Student unions & faculty channels.** Offer a free "exam workshop" (a live 45-minute trap session on a standard) — a value event, not an ad. Use `events`.

**Email / push.** Day-2 review, day-6 progress, exam-date countdown (only for students who entered a date), post-results retaker message.
Respect commercial-messaging consent and one-click unsubscribe. Use `emails`.

**Paid ads (later, small).** Only retargeting of activated non-payers in the exam run-up, and search on high-intent Hebrew queries. Use `ads`. Don't buy cold traffic before activation ≥ target.

## 6. 90-day plan (2026-11-08 → 2027-02-05, ending in the מועד א׳ peak)

| Weeks | Theme | Ship | Measure |
|---|---|---|---|
| 1–2 (Nov 8–21) | **Instrument** | The events listed in §1; activation definition; a funnel view in `/admin` | Baselines for every row in §2 |
| 3–4 (Nov 22–Dec 5) | **Aha for door B** | One free exam-level question per paid standard (IAS 16 first), public URL + OG image; the "save your mistakes" signup prompt | landing → lesson_start, start → signup |
| 5–6 (Dec 6–19) | **Loop 1** | Share card on trap feedback & summary; UTMs; first 5 ambassadors recruited | share_click, k-factor |
| 7–8 (Dec 20–Jan 2) | **Habit** | Exam-date chip + countdown plan; day-2 / day-6 messages; readiness meter v1 | D1/D7 return, review sessions |
| 9–10 (Jan 3–16) | **Convert** | Paywall copy test (continuation vs price-first); semester/exam-pass test if the owner approves; pricing FAQ | paywall → payment_success |
| 11–13 (Jan 17–Feb 5) | **Peak** | Ambassador packs per standard; trap-of-the-day posts; free live trap workshop per big standard; retargeting of activated non-payers | Paying students this exam period |

Every two weeks: review the numbers, kill or scale, and update §7.

## 7. Experiment backlog

ICE = Impact (paying students per exam period) × Confidence × Ease, each 1–10. Add rows via the `afik-council` skill.

| # | Experiment | Hypothesis (short) | Metric | I | C | E | ICE | Status |
|---|---|---|---|---|---|---|---|---|
| 1 | Free IAS 16 exam question, no signup | A complete hard question converts panic visitors better than an intro lesson | landing → signup | 8 | 7 | 7 | 392 | proposed |
| 2 | "Save your mistakes for tomorrow" signup prompt | Endowment after the first trap lifts signup | lesson_start → signup | 7 | 7 | 8 | 392 | proposed |
| 3 | Trap share card | Students share traps they fell into; friends answer without signup | share_click, k | 8 | 5 | 6 | 240 | proposed |
| 4 | Paywall: continuation-first vs price-first copy | Naming the next lesson beats leading with price | paywall → payment_success | 6 | 6 | 9 | 324 | proposed |
| 5 | No-renew semester pass beside monthly | Removing renewal fear raises conversion more than it lowers LTV | payment_success, revenue/visitor | 8 | 5 | 5 | 200 | needs owner |
| 6 | Exam-date chip + countdown | Setting a date raises D7 return | D7 return | 7 | 6 | 5 | 210 | proposed |
| 7 | Daily study streak with rest days | A forgiving streak raises review sessions without lowering accuracy | review sessions/user/week | 6 | 5 | 5 | 150 | proposed |
| 8 | Ambassador links at 3 programs | TA credibility beats brand posts | signups per ambassador | 7 | 6 | 6 | 252 | proposed |
| 9 | Home hero V1 (contrast) vs current, question above the fold | Door-B visitors start practising more when the hero speaks to exams | landing → practice start | 8 | 6 | 9 | 432 | built, test after launch |
| 10 | "Save your review" prompt on the summary card for guests | Endowment + chosen reminder time lifts day-2 return | review_session on day 1–2 | 8 | 6 | 7 | 336 | built (without reminders), test after launch |
| 11 | "בדקו את הסיכום שלכם" /check/ias16 | A 5-trap self-check proves value vs free summaries and gets shared | check→signup, shares per completer | 9 | 6 | 5 | 270 | built: /check/[course] |

## 8. Weekly growth ritual (30 minutes)

1. Numbers: WAL-10, the funnel table (§2), k-factor, paying students — vs last week and vs target.
2. One leak: the biggest drop-off this week, and the student's inner voice that explains it.
3. Decide: kill / keep / scale each running experiment.
4. Next: pick at most one new experiment from §7 (ask `afik-council` if it crosses disciplines).
5. Calendar check: how many weeks until the next מועד? Is the work aimed at it?
