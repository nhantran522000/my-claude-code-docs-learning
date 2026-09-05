# Cadence — domain spec

> Phase 00, build task 1. **Write this by hand, before any feature code and before any
> scaffolding.** If the invariants aren't yours, none of the enforcement built on them in
> Phases 2–5 means anything.

## The six invariants

Each one names the layer that will own it. Assigning the layer is Phase 02's work —
the column below is the starting hypothesis from the track, not a settled decision.

| # | Invariant | Proposed layer | Owner decided (Phase 02) | Justification |
|---|---|---|---|---|
| 1 | Money is minor units as `bigint` plus an explicit currency. Never a float. | lint rule | | |
| 2 | No `new Date()` outside `packages/core/time.ts`. | lint rule | | |
| 3 | Every request and job payload is parsed by zod at the boundary. No casts on input. | review | | |
| 4 | `process.env` is read only in `packages/config`. | hook | | |
| 5 | An applied migration is immutable. Write a new one. | hook — block the edit | | |
| 6 | No `any` in `packages/core`. | lint rule | | |

Rule of thumb for the Phase 02 assignment: **cheapest layer that can decide, wins** —
linter, then hook, then prompt. If a rule must hold every time, prompting for it is a bug.

## Renewal rules

<!-- TODO — yours to decide. These drive packages/core and the worker, and they are where
     the genuinely hard cases live. Questions worth answering explicitly: -->

- Monthly renewal on the 31st, in a month with 30 days — what happens?
- A renewal that lands in a DST transition hour — which instant fires?
- Whose timezone decides a renewal date: the user's, the subscription's, or UTC?
- Annual subscription starting 29 Feb — when does it renew in a non-leap year?
- A subscription paused mid-cycle and resumed — does the anchor date move?
- Trial converting to paid — is that a renewal or a new cycle?

## Non-goals

<!-- TODO — what Cadence deliberately will NOT do. This section is the defence against the
     "scope creep in the lab" trap: Cadence exists to generate constraints, not to ship. -->

-
-
-

## Glossary

<!-- TODO — the words you'll use consistently across packages, CLAUDE.md and skills.
     e.g. subscription vs plan vs cycle; renewal vs charge vs invoice; anchor date. -->
