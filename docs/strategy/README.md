# Strategy layer — agents, skills and modes

This repo has a **non-code layer**: Claude Code agents, skills and modes that govern design, UX, student psychology and growth
for AfikAccounting. They load automatically in Claude Code from `.claude/`. Nothing needs installing.

## Map

```
.claude/
├── product-marketing.md            ← single source of truth: product, plans, segments, calendar, voice, ethics
│                                      (also read by the installed marketing skills: copywriting, cro, paywalls, pricing…)
├── agents/                          ← specialists (run as subagents, in their own context)
│   ├── afik-ux-designer.md           UX/UI & product design: workflows, cognitive load, dense financial data, RTL/mobile
│   ├── afik-behavioral-psych.md      Consumer psychology & behavioural economics: motivation, habit, price, ethics veto
│   └── afik-growth-strategist.md     Growth & marketing: campus loops, funnel, exam calendar, copy, experiments
├── skills/                          ← reusable workflows (any agent or the main session can use them)
│   ├── afik-freemium-onboarding/     the aha moment, the free hook per door, gate placement, activation metric
│   ├── afik-objection-copy/          objection bank (O1–O8) + Hebrew copy templates per surface
│   ├── afik-gamification/            readiness meter, streaks, trap collection, boss questions, study groups
│   └── afik-council/                 orchestrator: runs all three agents in parallel → one decision memo
└── output-styles/                   ← modes (change how the main session answers)
    ├── afik-student-lens.md          every answer opens with a stressed-student walkthrough + friction score
    └── afik-growth-room.md           every answer is a decision memo with an experiment
docs/strategy/
├── README.md                        ← this file
├── growth-playbook.md               ← living plan: metric tree, loops, calendar rhythm, 90-day plan, experiment backlog
└── decisions/                       ← memos written by afik-council
```

The `afik-` prefix keeps these apart from the third-party skills tracked in `skills-lock.json`. Updating those skills never touches these files.

## How to use them

| You want… | Do this in Claude Code |
|---|---|
| A design critique of a screen | ״Use the afik-ux-designer agent to critique `/study/ias16-intro` on mobile.״ |
| To understand why students drop off | ״Ask afik-behavioral-psych why students who finish basics lesson 1 don't come back on day 2.״ |
| A campaign for the exam run-up | ״afik-growth-strategist: plan the 4 weeks before מועד א׳ for IAS 16.״ |
| Copy for a surface | ״/afik-objection-copy paywall after the first IAS 19 lesson״ |
| To decide what's free | ״/afik-freemium-onboarding review the gate map for IAS 16״ |
| To design progression | ״/afik-gamification spec the readiness meter״ |
| A cross-discipline decision | ״/afik-council should we launch a semester pass before מועד א׳?״ → memo in `docs/strategy/decisions/` |
| To switch how Claude answers | `/output-style` → *AfikAccounting · Student Lens* or *AfikAccounting · Growth Room* (back to *Default* the same way) |
| To see the agents | `/agents` |

Agents start with a fresh context, so they always re-read `.claude/product-marketing.md` and the relevant code. That's why
**keeping that one file accurate is the most important maintenance task.** When the product changes (a new course, new prices,
new events), update it in the same PR.

## Ground rules shared by every agent and skill

1. **Code is the truth.** Lesson counts, plans, prices and events are read from `src/lib/catalog.ts`, `src/lib/pricing.ts` and
   `src/lib/analytics/events.ts`, never re-typed from memory.
2. **No invented numbers or claims.** Missing data is written `[NEEDS DATA: …]`, along with the event that would supply it.
3. **No dark patterns.** The psychology agent holds a veto on ethics; `marketing-psychology:dark-pattern-check` runs on every paywall/pricing change.
4. **Prices are the owner's call** (`PRICES_ARE_FINAL = false`). Agents present options.
5. **Strategy agents don't edit `src/**`.** They write specs and memos; implementation happens in the main session, with tests.
6. **Hebrew-first, RTL-first, mobile-first, exam-calendar-first.**

## Extending the system

- A new specialist (e.g. a content/pedagogy reviewer): copy an agent file, keep the "Read first" and "Output contract" sections, and add it to the table in `afik-council`.
- A new workflow: create `.claude/skills/afik-<name>/SKILL.md` with a trigger-rich `description`, and keep long material in `references/`.
- Add a new mode under `.claude/output-styles/`.
