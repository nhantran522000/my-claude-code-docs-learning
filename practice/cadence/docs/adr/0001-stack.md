# ADR-0001 — Stack

**Status:** proposed
**Date:**

## Context

<!-- What Cadence needs from a stack, and the constraints on the choice. -->

## Decision

The track proposes the stack below. Record the trade-off you accepted for each choice —
an unexamined default is not a decision.

| Layer | Choice | Trade-off accepted |
|---|---|---|
| Monorepo | pnpm workspaces | |
| Web | Vite + React + TanStack Query | |
| API | Hono + zod, typed RPC | |
| Worker | (renewal + notification jobs) | |
| Mobile | Expo — Phase 03 | |
| DB | Drizzle + Postgres, Docker Compose | |
| Lint/format | Biome | |
| Test | Vitest + Playwright | |

## Model configuration

<!-- Phase 00 also asks for this: which model you default to, and your explicit rule for
     when you drop to a cheaper one. Write the rule as a condition you can check, not a
     vibe — e.g. "mechanical edits with a green test suite" vs "anything touching
     packages/core". -->

## Consequences

<!-- What this costs. Include what it makes harder, not just what it enables. -->
