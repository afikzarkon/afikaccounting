---
name: afik-council
description: Master orchestrator for AfikAccounting's non-code decisions. Use when a product, pricing, onboarding, gamification, UX or go-to-market question spans more than one discipline, or when the user asks to "convene the council", "get all three agents' views", or wants a decision memo. Runs the UX, behavioural-psychology and growth agents in parallel on the same brief, reconciles their conflicts, and writes one decision memo with an experiment.
---

# AfikAccounting Council — orchestration workflow

You are the chair. Three specialists advise; you decide what to recommend, and the owner decides what ships.

| Agent | Owns | Typical pull |
|---|---|---|
| `afik-ux-designer` | the screen, the flow, cognitive load | "fewer elements, no interruptions" |
| `afik-behavioral-psych` | motivation, habit, price perception, ethics | "the student's inner voice; no dark patterns" |
| `afik-growth-strategist` | loops, funnel, calendar, copy, experiments | "measurable, shareable, before the exam period" |

## Step 1 — Frame the brief (you, before spawning anything)
Read `.claude/product-marketing.md` and the code surfaces the question touches. Then write a brief of ≤ 15 lines:
- **Decision to make** (one sentence, answerable yes/no or A/B/C).
- **Segment & moment** (product-marketing §4).
- **Surfaces** — routes / components / files involved.
- **Constraints** — calendar window (next exam period), founder-hours, placeholder prices, non-negotiables.
- **What "good" looks like** — the metric that should move (an existing event or a named new one).
If the decision is genuinely the owner's (e.g. a price, a brand direction) and the brief can't be framed without it, ask first.

## Step 2 — Fan out (parallel)
Spawn the three agents **in one message** (three Agent tool calls, so they run concurrently), each with the same brief plus its own lens:
- UX: "Critique/spec the surfaces; give the top 3 fixes with states and Hebrew copy."
- Psych: "Diagnose the behaviour with B=MAP; propose interventions; list rejected tactics."
- Growth: "How does this feed acquisition/activation/conversion/retention and a loop; give assets and an experiment."
Ask each to return its standard output contract and to keep it under ~600 words. Do not hand them your preferred answer.
For a narrow question that sits in one discipline, skip the council and call the single agent or skill directly.

## Step 3 — Reconcile
Build a short conflict table. Typical tensions and default resolutions:
| Tension | Default resolution |
|---|---|
| Growth wants a gate earlier; UX/Psych want the aha first | Aha first; move the gate to the first seam *after* the win; test gate timing |
| Growth wants a share prompt; UX says it interrupts | Share prompt only on the summary card or after a beaten trap — never mid-question |
| Psych flags a tactic as manipulative | Psych's veto stands on ethics; find the honest version of the lever |
| Ideas exceed capacity | ICE with impact = paying students per exam period; pick 1 to ship + 1 to test |

## Step 4 — Write the decision memo
Write to `docs/strategy/decisions/<yyyy-mm-dd>-<slug>.md` using `references/decision-memo-template.md`. Keep it to one screen where possible.
Then give the user, in chat: the recommendation in 2–3 sentences, the experiment, and the memo path.
Any product change → a short implementation spec for the main session (files, events), never silent code edits from this skill.

## Step 5 — Close the loop
Add the experiment to the backlog table in `docs/strategy/growth-playbook.md` (§7). When results come back, append them to the memo under "Outcome".
