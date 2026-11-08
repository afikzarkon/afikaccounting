# {Decision title}

- **Date:** {yyyy-mm-dd} · **Status:** proposed / approved / shipped / reverted · **Owner decision needed:** yes/no
- **Segment & moment:** {e.g. exam-panic, first visit from a WhatsApp link, 3 weeks before מועד א׳}
- **Surfaces:** {routes, components, files}

## Decision
{One sentence: what we will do.}

## Why
- {2–4 bullets: the evidence — data, the student's inner voice, a funnel leak}

## What each specialist said
| | Recommendation | Key risk raised |
|---|---|---|
| UX | | |
| Psychology | | |
| Growth | | |

**Conflicts & how they were resolved:** {…}

## Rejected options
- {option} — {why}

## Experiment
- **Hypothesis:** If we {change}, then {metric} will {direction} for {segment}, because {mechanism}.
- **Metric:** {event-based, e.g. paywall_view → payment_success within 7 days}
- **Comparison:** {control vs variant; split; or before/after with the exam-period caveat}
- **Guardrails:** {e.g. D7 return, subscription_cancel, accuracy}
- **Sample / duration:** {estimate} · **Kill criterion:** {…}

## Implementation spec (for the main session)
- {file → change}
- {events to add to `src/lib/analytics/events.ts`}

## Outcome
{Filled in after the test: numbers, decision, what we learned.}
