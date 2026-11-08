# Mechanics Catalogue — specs

Specs for each recommended mechanic. "Data" names existing fields first; anything new is marked **NEW**.

---

## 1. Exam readiness meter (״מוכנות למבחן״)
- **Where:** course page header per standard, `/review` header, dashboard; a compact pill on the course path.
- **Data:** lesson status + `exercises`/`traps` + `review` boxes per topic (`TopicProgress`); exam-question completion.
- **States:** 0 (never started: show "start with lesson 1", not 0%) · rising · decaying (overdue reviews: amber, with "3 חזרות מחכות") · ≥ 80 ("מוכנים לשאלות מבחן מלאות" → push to exams area).
- **Copy:** ״מוכנות ל־IAS 16: 64%. הצעד הבא שמעלה הכי הרבה: 4 חזרות (2 דק׳).״
- **Integrity:** only evidence-based inputs; decays with overdue reviews so it cannot be "finished" and forgotten.
- **Events:** **NEW** `readiness_view` (meta: standard, score bucket); success = review sessions/user/week ↑.
- **Freemium tie-in:** a free user sees readiness for the free lesson; the meter visibly caps ("השיעורים 2–14 נעולים") → honest gate.

## 2. Daily study streak
- **Where:** header flame (reuse the `Flame` icon pattern from `lesson-stats.tsx`, but a distinct label: ״ימי למידה ברצף״ vs the in-lesson ״תשובות נכונות ברצף״).
- **Data:** **NEW** per-user activity days (Supabase table `study_days(user_id, day)`, RLS by `auth.uid()`; guests: localStorage, merged on signup — follow the pattern in `src/lib/study/sync.ts`). Day boundary from `dayOf()` (the student's own midnight).
- **Rules:** see SKILL.md §5 (meaningful action, earned freezes, weekly rest option, exam-day pause, kind loss copy).
- **Events:** **NEW** `streak_day` (meta: length, freeze_used); success = D7/D30 return ↑; guardrail = accuracy per session must not fall (no "streak-saving" junk sessions).

## 3. Trap collection (״אוסף המלכודות״)
- **Where:** a tab in `/review` and the profile; each card = the trap, your original choice, why it's tempting, the rule, its status (נפלתי → בחזרה → ניצחתי).
- **Data:** `traps[id].correct === false` → collected; review box ≥ MASTERED → "beaten".
- **Share hook:** each beaten trap can produce a share card (growth trap-share loop) — "ניצחתי את המלכודת הזאת. ואתם?"
- **Integrity:** collecting requires having fallen in *and* beaten it later — you can't farm it.
- **Events:** **NEW** `trap_hit` (meta: trap id, standard), `share_click` (meta: kind=trap).

## 4. Boss questions
- **Where:** the existing exam-level question that closes each lesson, framed distinctly (a "שאלת מבחן" card with standard + estimated exam points).
- **Stars:** ★ solved fully · ★★ first try on every part · ★★★ also with no peeking at the solution/spreadsheet hints (if such hints exist).
- **Data:** exercises within the exam step (lesson outline in `src/lib/study/outline.ts`); **NEW** star record per lesson.
- **Integrity:** stars reward accuracy, never speed alone (speed creates anxiety; optional timed mode only for students who choose it).

## 5. Exam countdown plan
- **Where:** first-session chip ("מתי המבחן?"), course page, dashboard.
- **Data:** **NEW** `exam_goals(user_id, standard, exam_date)`; the plan = remaining lessons spread over days left, interleaved with due reviews; recomputed daily.
- **States:** > 21 days (calm plan: 1 lesson / 2 days) · 7–21 (standard) · < 7 (triage: highest-yield lessons + exam questions + review only) · past (ask: "איך היה? יש מועד ב׳?" → retaker flow).
- **Copy:** ״עוד 12 ימים. היום: שיעור 5 (שערוך) + 6 חזרות. ~25 דק׳.״
- **Events:** **NEW** `exam_goal_set`; it powers re-engagement messages (copy templates §5).

## 6. Study-group room
- **Where:** `/groups/[id]` (**NEW**), invited via a WhatsApp link.
- **Data:** **NEW** `study_groups`, `study_group_members` (RLS: members only). Shared: exam date, standard, each member's readiness (opt-in, default *on* for presence and *off* for score).
- **Mechanics:** a weekly group challenge ("כל הקבוצה מנצחת 10 מלכודות השבוע") — a cooperative goal, not a competition.
- **Growth tie-in:** invite link = the study-group loop; a group of ≥ 3 paying → a group discount (owner decides).
- **Events:** **NEW** `group_create`, `group_join` (meta: via=whatsapp|link).

## 7. Weekly league (later, optional)
- Opt-in only; cohorts of ~20 students in the same course/standard; ranks XP earned *that week* from first-try answers and reviews; resets Sunday.
- No demotion messaging; the bottom of the table is never shown to anyone except the student themselves.
- Build only if 1–6 are live and D30 retention data says relatedness is the missing need.

---

## Anti-patterns checklist (reject the design if any is ✅)
- [ ] Points for time spent, page views or logins.
- [ ] Random/variable rewards not tied to learning.
- [ ] Public ranking of anxious students by default.
- [ ] Streak-loss guilt screens, or paying to restore a streak.
- [ ] Readiness shown as a grade or a pass promise.
- [ ] Mechanics that make skipping review cheaper than doing it.
- [ ] Celebrations longer than ~600 ms or that ignore `prefers-reduced-motion`.
