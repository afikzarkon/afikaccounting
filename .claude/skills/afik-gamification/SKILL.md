---
name: afik-gamification
description: Gamification engine designer for AfikAccounting. Use when designing or reviewing progression, XP, streaks, mastery and readiness views, spaced-review rewards, trap collections, boss/exam questions, leaderboards, study-group challenges, badges, celebrations and instant-feedback loops — anything meant to make mastering accounting standards engaging and habit-forming without trivialising it.
---

# Gamification Engine Designer

Turn "mastering IAS 16" into something students *want* to come back to, by making **competence visible**.
Read `.claude/product-marketing.md` and the mechanics that already exist before proposing anything:

| Exists today | Where |
|---|---|
| In-lesson XP: screen read 5, right first try 10, right on second try 5, trap avoided 10 | `XP` in `src/lib/study/score.ts` |
| In-lesson answer streak + best run | `bump()` in `score.ts`, `LessonStats` in `src/components/study-mode/lesson-stats.tsx` |
| Lesson summary: XP ring, score by step, best streak, tips, next | `src/components/study-mode/summary-card.tsx` |
| Spaced review: box 0 → (1 day) → 3 days → 7 days → mastered after 3 right in a row | `src/lib/study/review.ts`, `/review` |
| Lesson status: not started / under way / done | `score.ts` |

**Design principle:** extend these. Don't bolt on a parallel points economy.

## 1. The theory you must respect

- **Self-Determination Theory.** Lasting motivation = *competence* (I'm getting better), *autonomy* (I choose), *relatedness* (others are with me).
  Every mechanic must feed at least one, and must not starve another.
- **Overjustification effect.** Rewards for the *activity* (time on site, clicks) crowd out intrinsic interest. Reward **evidence of learning**:
  right first try, a trap beaten, a mistake mastered in review, an exam question finished.
- **Desirable difficulty & retrieval practice.** The review queue is the most powerful learning feature we have. Gamification should make
  *doing review* rewarding, never let students farm XP on easy re-reads.
- **Goal-gradient effect.** Motivation rises near a goal → show distance to the next mastery milestone, not a lifetime total.
- **Loss aversion, used honestly.** Students may feel the loss of *real progress* (a mistake about to slip back to box 0, a readiness score decaying
  as material goes unreviewed). Never manufacture artificial losses.
- **Anxiety.** Our users are already stressed. Mechanics must *reduce* exam anxiety (control, visible readiness), never add social shame.

## 2. The core loop (per question, seconds)

```
Attempt → instant feedback (<100 ms, the wrong account named) → why (trap: why it's tempting, then the rule)
  → reward proportional to learning (XP: first-try > second-try; trap avoided) → weak answer scheduled for review
```
Feedback rules: celebrate *correct-after-struggle* as much as easy correct; say what was right in a wrong answer
(e.g. "the debit side is right, the credit account is wrong"); keep celebrations short (≤ 600 ms, reduced-motion aware).

## 3. The mechanics catalogue — recommended build order

Ranked by learning value × retention impact ÷ build effort. Details and specs: `references/mechanics-catalog.md`.

| # | Mechanic | Feeds | Builds on | Why for this product |
|---|---|---|---|---|
| 1 | **Exam readiness meter per standard** (״מוכנות למבחן״) | Competence, autonomy | review boxes + lesson status + exam questions | Converts vague anxiety into a number they can raise; the core reason to return |
| 2 | **Daily review streak** (a day counts only with ≥ 1 review item or ≥ 1 new exercise) with **freezes** and an **exam-day pause** | Competence (habit) | `/review`, `dayOf()` in review.ts | Spaced review only works with daily returns; streak = return habit |
| 3 | **Trap collection** (״אוסף המלכודות״) — every trap you fell into, then beat in review | Competence, endowment | `traps` + `review` | Reframes failure as collection; an identity-safe way to show progress |
| 4 | **Boss questions** — the booklet/exam-level question that closes each lesson, with a distinct "boss" frame and a 3-star rating | Competence | existing end-of-lesson exam questions | Gives each lesson a climax; stars = right first try / no hints / under time |
| 5 | **Exam countdown plan** — enter the exam date → a day-by-day plan of lessons + review, that recomputes | Autonomy, competence | catalog + review | Turns panic into a plan; powers re-engagement |
| 6 | **Study-group room** — a group of friends for one exam: shared countdown, each member's readiness (opt-in), weekly challenge | Relatedness | needs accounts + groups table | Brings the WhatsApp group *into* the product; viral loop |
| 7 | **Weekly league** (opt-in, small cohorts, resets weekly, ranks *learning XP* only) | Relatedness | XP | Only after 1–6; risky for anxious students; must be optional |

**Do not build:** lifetime-XP global leaderboards, badges for logging in, loot boxes / random rewards, punishing streak-loss
screens, "you're behind your classmates" messages, gems/coins currencies.

## 4. Readiness meter — reference formula (to tune with data)

Per standard `s`, a 0–100 score from evidence, decaying with neglect:
```
coverage_s   = lessons done / lessons in s                        (from lesson status)
accuracy_s   = first-try-right items / items answered in s          (from exercises + traps)
retention_s  = 1 − (items in box 0–1 due or overdue / items scheduled in s)   (from review)
exam_s       = boss/exam questions solved fully / total in s
readiness_s  = round(100 × (0.25·coverage + 0.25·accuracy + 0.30·retention + 0.20·exam))
```
Show it as a meter with the *next action that raises it the most* ("עוד 4 חזרות → 72%"). Never show it as a pass prediction or a grade
("ready" is not a promise). Keep it a pure function next to `score.ts`/`review.ts` so it is unit-tested like them.

## 5. Streak rules (ethical defaults)

- A streak day = one meaningful action (≥ 1 review item answered, or ≥ 3 new practice items). Not a page visit.
- 2 freezes, earned (one per 7-day streak), held max 2. Auto-applied, with a friendly note.
- Shabbat/holiday-friendly: a weekly "rest day" option (the streak counts study days per week, e.g. 5 of 7) — fits the audience and lowers guilt.
- Exam-day pause: on the date they entered, the streak pauses automatically.
- On loss: "הרצף התאפס, הידע לא. {k} שאלות כבר במצב 'שולט'." Never a sad/guilt screen.

## 6. Deliverable format

1. **Behaviour goal** — what the mechanic must change (e.g. D7 return rate, review sessions per active user per week).
2. **Mechanic spec** — rules, states (zero / in progress / milestone / lost / paused), edge cases, the data it reads (existing fields first), and where it lives in the UI.
3. **Learning-integrity check** — can it be farmed without learning? does it reward evidence of learning? does it add anxiety?
4. **SDT check** — which need it feeds, which it might starve.
5. **Instrumentation** — events (existing or proposed for `EVENT_KINDS`) and the success / guardrail metrics.
6. **Experiment** — hypothesis, metric, comparison, expected direction, guardrail (e.g. accuracy must not drop while XP rises).

Related installed skills: `education-agent-skills:retrieval-practice-generator`, `spaced-practice-scheduler`, `flow-state-condition-designer`,
`self-efficacy-builder-sequence`, `formative-assessment-loop-designer`, `animate` / `emil-design-eng` (for celebration motion).
