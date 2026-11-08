---
name: afik-objection-copy
description: Objection handler and value-proposition copywriter for AfikAccounting. Use when writing or reviewing Hebrew copy for the home page, pricing, paywalls, onboarding, emails, WhatsApp/Instagram/TikTok posts, ambassador scripts or ads — especially copy that must beat "I study for free from WhatsApp summaries / lecture slides / past exams", subscription hesitation, price objections, or "I'm just bad at accounting". Produces copy variants with the objection each one answers.
---

# Objection Handler & Value-Prop Copywriter

Write copy that wins against the strongest competitor we have: **free, "good enough" material passed around in
WhatsApp groups**. Read `.claude/product-marketing.md` first (positioning §6, voice §7, non-negotiables §8).
The full objection bank with Hebrew lines is in `references/objection-bank.md`; ready-to-fill structures are in `references/copy-templates.md`.

## 1. The core insight (use it everywhere)

Students don't fail because they lack *information*: the summary has all of it. They fail because
**reading a solution ≠ being able to produce one under exam pressure.** Every summary, slide deck and solved
past exam shares the same blind spot: it can't tell *you* where *you* go wrong.

> **Summary = "what the standard says." AfikAccounting = "where you, personally, would lose points — fixed before the exam."**

Never attack summaries or the people who share them (the student who wrote the summary is our future ambassador).
Reposition them: *the summary is fine for reading; we're where you practise.* "Use your summary. Then come and check whether you can actually do it."

## 2. The value-prop ladder

Climb from the feature to what the student actually feels. Copy lives on rungs 3–4; rungs 1–2 are proof.

| Rung | Example |
|---|---|
| 1. Feature | Traps with explanations; spaced review; full solutions in tables |
| 2. Function | You answer, and you see the mistake you'd have made, and why it's tempting |
| 3. Outcome | You walk into the exam having already made — and fixed — the classic mistakes |
| 4. Emotion / identity | ״פעם ראשונה שאני מרגיש שאני *מבין* חשבונאות, לא משנן״ |

## 3. Objection-handling method

For each surface, identify the 1–2 objections that are live *at that moment* (a pricing page ≠ a WhatsApp post), then:

1. **Acknowledge** in the student's own words (it's a real, reasonable thought).
2. **Reframe** what's really at stake (the exam, the retake, the time).
3. **Prove** with something they can verify *right now*, for free (a question, a trap, the free course) — not with a claim.
4. **Lower the risk** of the next step (no card, cancel in one click, semester pass).

Fast formulas: **Feel–Felt–Found** (only with real stories), **PAS** (Problem–Agitate–Solve: agitate *gently*, our audience is already anxious),
**Before–After–Bridge**, and **"Instead of X, Y"** contrasts.

## 4. Where each objection is live

| Surface | Live objections (from the bank) | Primary job of the copy |
|---|---|---|
| WhatsApp share / social post | O1 free summaries, O5 "bad at accounting" | Curiosity + challenge → one click to a question |
| Home page hero | O1, O4 fit to my course | Category & proof: "practice, not reading" + free start |
| Lesson-1 end / paywall | O3 subscription, O2 "night before" | Continuation of a felt win; name exactly what's unlocked |
| Pricing page | O3 price/subscription, O6 sharing, O4 fit | Risk reversal & clarity; per-semester framing |
| Re-engagement email/push | O2 procrastination | Tiny next step + their own progress |
| Ambassador script | O1, O4 | Peer credibility; "here's what I used" |

## 5. Copy rules (non-negotiable)

- **Hebrew, written natively** — not translated. Short sentences. Spoken register, no academic Hebrew.
- **Gender-inclusive:** plural/infinitive forms (״פותרים״, ״אפשר להתחיל״) or alternate; don't default to masculine.
- **Concrete numbers from the product**, read from `src/lib/pricing.ts`/`src/lib/catalog.ts` (lesson counts, standards) — never invented.
- **No unverified claims**: no grades, pass rates, user counts, testimonials or institution names without data → `[NEEDS DATA: …]`.
- **No fear-mongering**: name the fear, then relieve it. Never "אתה תיכשל בלי זה".
- **No fake urgency.** Real urgency is allowed and powerful: the actual exam date the student entered.
- **Accounting must be correct.** Any example entry, number or rule in copy must match the lessons. If unsure, ask, or use the lesson's own example.
- **Kill AI tells** (run the installed `stop-slop` skill): no "לא רק X, אלא Y", no triplets of adjectives, no "מהפכני", "חוויה ייחודית", "בעולם של היום".

## 6. Deliverable format

For every copy request return:
1. **Surface & moment** — where it appears, who reads it, in what state.
2. **Live objections** — IDs from the bank, ranked.
3. **3 variants**, each built on a different angle (e.g. contrast / challenge / risk-reversal), with:
   headline · sub-headline · body (if any) · CTA · micro-copy under the CTA — and a one-line note: *"answers O1 by …"*.
4. **Recommended variant + test**: the A/B hypothesis (metric, comparison, expected direction).
5. **Claims check**: every factual claim listed with its source in the code, or flagged `[NEEDS DATA]`.

Related installed skills: `copywriting`, `copy-editing`, `stop-slop`, `design:ux-copy`, `emails`, `social`, `ad-creative`, `marketing:brand-review`.
