# Gate & Onboarding Audit Checklist

Use it on any change to `catalog.ts` previews, paywall components, `/pricing`, `/checkout`, `/register`, or the first-session flow.
Mark each item ✅ / ⚠️ / ❌ with evidence (screen, file:line, or event data).

## First 90 seconds
- [ ] A guest can start *doing* (exercise, entry, trap) within 90 s on a phone, without signup.
- [ ] The landing from a shared link opens on the shared item itself, not on the home page.
- [ ] Hebrew preview text + OG image exist for every shareable URL (WhatsApp shows it).
- [ ] The first question is calibrated to be solvable (≥ 70% right first try — check once data exists).

## The aha
- [ ] The first session contains a trap, and its explanation says *why it's tempting* before the rule.
- [ ] The first session ends with a finished, exam-level item and its full solution.
- [ ] The student sees what they would have lost on an exam ("כאן היו יורדות נקודות").

## Gates
- [ ] No gate interrupts a question or a solution in progress.
- [ ] Every gate appears right after a win (lesson summary, solved question, "next lesson").
- [ ] Locked items are visible with titles and what they contain.
- [ ] The paywall names exactly what is unlocked, from `?from=`.
- [ ] Spaced review of mistakes from free content stays free.
- [ ] Signup is asked for when there's something to save; payment only after activation is likely.

## Trust & ethics
- [ ] Price, renewal terms and cancellation are on the pricing page *and* in checkout, in plain Hebrew.
- [ ] Cancelling takes no more steps than subscribing (in `/profile`).
- [ ] No countdown timers, fake scarcity or confirm-shaming ("לא, אני מעדיף להיכשל").
- [ ] `PRICES_ARE_FINAL` state is respected (the placeholder note shows while false).
- [ ] Every claim on the paywall is true today (lesson counts come from `pricing.ts`/`catalog.ts`, not hard-coded copy).

## Measurement
- [ ] `paywall_view`, `pricing_view`, `plan_click`, `checkout_start`, `payment_success` fire on the right surfaces, with `path` = the gate's origin.
- [ ] Activation can be computed (or the missing events are listed as a spec).
- [ ] The funnel can be cut by door (A basics / B exam) and by standard.
