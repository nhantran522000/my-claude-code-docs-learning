# Claude Code Mastery Track

**12 weeks · ~10h/week · one greenfield repo · 6 phases · 40 builds**

A build-first program run against **one project started from an empty directory**. Each
phase ships a real slice of the app and one piece of Claude Code machinery, and every
mastery check is falsifiable on purpose.

Every "Read" link below points at the local mirror in [`../../docs/`](../../docs/), which
`src/sync-claude-docs.ts` keeps current. Tick the boxes as you go.

---

## Start here, not at the beginning

You know the surfaces already, so **skip** Quickstart, the IDE and desktop tours, and
Common Workflows. Skim the prompt library once for phrasing and never go back. What
separates you from mastery isn't feature coverage — it's **measurement and enforcement**:
knowing your token budget before you type, and turning conventions from requests into
guarantees.

Because the repo is new, Phase 0 includes building it. One warning that decides whether
this works: **you design the domain, not the model.** The invariants below are the raw
material for every hook, skill and subagent you write later — if you let Claude invent
them in week 0, you'll spend twelve weeks enforcing rules you don't believe in.

---

## The lab — Cadence, a self-hosted subscription and renewal tracker

Chosen because it is small enough to finish and nasty enough to matter: money arithmetic,
timezone-correct renewal dates, background jobs that must never double-fire, and
multi-user data. Those constraints give you rules worth enforcing mechanically — which is
exactly what Phase 2 needs and what a to-do app can never provide.

### Shape

```
cadence/
├─ apps/web        Vite + React + TanStack Query
├─ apps/api        Hono + zod, typed RPC
├─ apps/worker     renewal + notification jobs
├─ apps/mobile     Expo — added in Phase 3
├─ packages/core   money, time, renewal engine
├─ packages/db     Drizzle + Postgres migrations
└─ packages/config the only reader of process.env
```

pnpm workspaces · Biome · Vitest · Playwright · Docker Compose for Postgres.

### The six invariants

| # | Invariant | Enforcement layer |
|---|---|---|
| 1 | Money is minor units as `bigint` plus an explicit currency. Never a float. | lint rule |
| 2 | No `new Date()` outside `packages/core/time.ts`. | lint rule |
| 3 | Every request and job payload is parsed by zod at the boundary. No casts on input. | review |
| 4 | `process.env` is read only in `packages/config`. | hook |
| 5 | An applied migration is immutable. Write a new one. | hook — block the edit |
| 6 | No `any` in `packages/core`. | lint rule |

Write these in week 0, before any feature code. Deciding which of the three enforcement
layers owns each one **is** Phase 2. Record your decisions in
[`docs/domain-spec.md`](docs/domain-spec.md).

---

## Phase 00 — Scaffold and baseline

**Week 0 · ~10h**

> *You cannot optimise a setup you have never measured — so measure it while it is still empty.*

**Ships: a green monorepo, a domain spec, and your first numbers**

### Read

- [how-claude-code-works](../../docs/how-claude-code-works.md) — the loop
- [context-window](../../docs/context-window.md) — the budget
- [prompt-caching](../../docs/prompt-caching.md) — why order matters
- [claude-directory](../../docs/claude-directory.md)
- [best-practices](../../docs/best-practices.md)
- [checkpointing](../../docs/checkpointing.md)
- [model-config](../../docs/model-config.md), [fast-mode](../../docs/fast-mode.md)

### Build

- [ ] Write the domain spec by hand first: the six invariants, the renewal rules, and what Cadence deliberately will not do.
- [ ] Scaffold the workspace — six packages, Docker Compose Postgres, one passing test in each. `pnpm build && pnpm test && pnpm lint` green.
- [ ] Run `/context all` on the empty repo. Record the split: system, CLAUDE.md, MCP tools, skill descriptions. This is your control measurement. → [`notes/measurements.md`](notes/measurements.md)
- [ ] Run `/doctor`; fix every flag.
- [ ] Break something deliberately, recover with `/rewind`. Learn the failure mode before you need it.
- [ ] ADR-0001: the stack, with the trade-off you accepted for each choice. Set model config and write your rule for when you drop to a cheaper model.

**Mastery check** — You can state your session's token cost by source, in numbers, before
typing a prompt, and every invariant in the spec is one you'd defend in a design review.

---

## Phase 01 — Context engineering

**Weeks 1–2 · ~20h**

> *Almost every failure that looks like "the model is dumb" is a context failure.*

**Ships: auth + subscription CRUD + the renewal engine**

### Read

- [memory](../../docs/memory.md) — CLAUDE.md, rules, auto memory
- [memory § Path-specific rules](../../docs/memory.md#path-specific-rules) — `docs/memory.md:203`
- [skills](../../docs/skills.md)
- [features-overview](../../docs/features-overview.md) — the decision table
- [tools-reference § LSP tool behavior](../../docs/tools-reference.md#lsp-tool-behavior) — `docs/tools-reference.md:298`
- [output-styles](../../docs/output-styles.md), [sessions](../../docs/sessions.md)
- [large-codebases](../../docs/large-codebases.md) — monorepo setup

### Build

- [ ] Ship the first vertical slice end to end: sign-in, create a subscription, compute the next renewal across a DST boundary, show it in the UI.
- [ ] Root CLAUDE.md under 200 lines — build commands and the six invariants, nothing else.
- [ ] Per-package `.claude/rules/` with `paths` frontmatter: API rules load for `apps/api`, schema rules for `packages/db`. Prove they don't load elsewhere.
- [ ] Three skills: `/slice` (scaffold a vertical slice), `/adr`, and a reference skill holding the domain model. Give one `disable-model-invocation: true` and know why.
- [ ] Re-run `/context all`. Demand a measured reduction against week 0 — if there isn't one, you moved text, not cost.
- [ ] Install a TypeScript code-intelligence plugin; time a cross-package symbol hunt before and after.

**Mastery check** — A cold session adds a second slice (currencies, say) with correct
conventions in every package, and you pasted no context to get it.

---

## Phase 02 — Determinism and guardrails

**Weeks 3–4 · ~20h**

> *An instruction is a request. A lint rule and a hook are guarantees. Most people never make the switch.*

**Ships: the notification worker, plus enforcement for all six invariants**

### Read

- [hooks-guide](../../docs/hooks-guide.md) then [hooks](../../docs/hooks.md) — reference
- [permissions](../../docs/permissions.md)
- [permission-modes](../../docs/permission-modes.md)
- [sandboxing](../../docs/sandboxing.md)
- [auto-mode-config](../../docs/auto-mode-config.md)
- [commands](../../docs/commands.md) — bundled `/code-review`
- [security-guidance](../../docs/security-guidance.md)

### Build

- [ ] Ship the worker: renewal notifications that are idempotent and provably never double-fire.
- [ ] Assign each invariant to a layer and justify it in one line. Custom lint rules where a linter can decide; hooks where it can't.
- [ ] `PostToolUse`: Biome, `tsc --noEmit`, and related Vitest runs on every edit.
- [ ] `PreToolUse`: block edits to applied migrations, to `.env`, and to `process.env` outside `packages/config`.
- [ ] Build your own feedback corpus: run `/code-review` on every PR for two weeks, log every finding, cluster them. Recurring mechanical findings become enforcement; the rest become a `/review` skill.
- [ ] Configure permission mode and sandboxed Bash until you can run auto mode on a real ticket without flinching.

**Mastery check** — Three PRs in a row where `/code-review` finds nothing mechanical,
because a machine caught it first. For any convention you can say which layer owns it and why.

---

## Phase 03 — Orchestration

**Weeks 5–6 · ~20h**

> *The skill is not spawning agents. It is knowing when isolation beats context — and proving it with token math.*

**Ships: the Expo client, and shared types refactored across five packages**

### Read

- [agents](../../docs/agents.md) — the comparison
- [sub-agents](../../docs/sub-agents.md)
- [workflows](../../docs/workflows.md) — dynamic workflows
- [agent-view](../../docs/agent-view.md)
- [agent-teams](../../docs/agent-teams.md)
- [cross-session-messaging](../../docs/cross-session-messaging.md)
- [worktrees](../../docs/worktrees.md)

### Build

- [ ] Add `apps/mobile` in Expo. This is the scope jump that makes orchestration necessary rather than decorative.
- [ ] Two custom subagents with tight tool allowlists and preloaded skills: an invariant auditor and a migration reviewer. Measure what actually returns to the parent context.
- [ ] Run a codebase-wide invariant audit as a dynamic workflow with an adversarial verify pass.
- [ ] Do the same audit in a single session. Compare tokens, wall-clock and false positives, and write the verdict into an ADR.
- [ ] Three worktrees at once — mobile, API, worker — coordinated from agent view.
- [ ] Use cross-session messaging for its real purpose: one session warning another that it changed a shared type underneath it.

**Mastery check** — Given a new job, you predict before running it whether it wants a
subagent, a workflow, or a separate session, and you're right for the reason you gave.

---

## Phase 04 — Packaging and handoff

**Weeks 7–8 · ~20h**

> *A setup only you can run is worth 1×. The test of a setup is whether a stranger gets your workflow without asking you anything.*

**Ships: a `cadence-dev` plugin, a marketplace, and CI review**

### Read

- [plugins](../../docs/plugins.md)
- [plugin-marketplaces](../../docs/plugin-marketplaces.md)
- [code-review](../../docs/code-review.md)
- [github-actions](../../docs/github-actions.md)
- [claude-security](../../docs/claude-security.md) — codebase scan
- [managed-settings](../../docs/managed-settings.md), [managed-mcp](../../docs/managed-mcp.md)
- [analytics](../../docs/analytics.md), [costs](../../docs/costs.md)
- [champion-kit](../../docs/champion-kit.md)

### Build

- [ ] Package every skill, hook and subagent as a versioned, namespaced `cadence-dev` plugin.
- [ ] Stand up a marketplace and install your own plugin from it into a clean clone.
- [ ] The onboarding test: a fresh container, clone, plugin install, then produce a correct vertical slice with zero tribal knowledge. Time it; whatever it needed that wasn't in the plugin is your gap list.
- [ ] Wire automated code review and a security scan into the PR pipeline.
- [ ] Write a managed-settings baseline and MCP allowlist as if eight engineers were joining next week.
- [ ] Write the rollout doc — the artefact that makes all of this transferable to a real team later.

**Mastery check** — Someone who has never seen the repo installs the plugin and works the
way you work, without asking a single question.

---

## Phase 05 — Build on the SDK

**Weeks 9–11 · ~30h**

> *Claude Code is a product wrapped around an engine. The Agent SDK is the same engine as a library — this is where your tooling stops being personal and becomes something shippable.*

**Ships: a headless review agent, an MCP server, and a deployment you'd defend**

### Read

- [agent-sdk/overview](../../docs/agent-sdk/overview.md), [quickstart](../../docs/agent-sdk/quickstart.md)
- [agent-sdk/agent-loop](../../docs/agent-sdk/agent-loop.md)
- [agent-sdk/custom-tools](../../docs/agent-sdk/custom-tools.md), [agent-sdk/mcp](../../docs/agent-sdk/mcp.md)
- [agent-sdk/structured-outputs](../../docs/agent-sdk/structured-outputs.md)
- [agent-sdk/hooks](../../docs/agent-sdk/hooks.md), [agent-sdk/subagents](../../docs/agent-sdk/subagents.md)
- [agent-sdk/session-storage](../../docs/agent-sdk/session-storage.md)
- [agent-sdk/cost-tracking](../../docs/agent-sdk/cost-tracking.md), [agent-sdk/observability](../../docs/agent-sdk/observability.md)
- [agent-sdk/secure-deployment](../../docs/agent-sdk/secure-deployment.md), [agent-sdk/hosting](../../docs/agent-sdk/hosting.md)
- [agent-sdk/typescript](../../docs/agent-sdk/typescript.md) — reference

### Build

- [ ] Port the invariant auditor from Phase 3 into a headless TypeScript Agent SDK service that reviews PRs on the repo.
- [ ] Write an MCP server exposing Cadence's own data — schema introspection and the invariant checker — and connect the agent to it.
- [ ] Return verdicts as structured output, not prose. The consumer is CI, not a human.
- [ ] Add SDK hooks for policy enforcement, external session persistence, and OpenTelemetry traces.
- [ ] Put a hard cost cap on it and prove the cap fires.
- [ ] Threat-model the deployment: prompt injection from PR content, secret exposure, container escape, and what a compromised run could reach.
- [ ] ADR: SDK service vs plugin vs plain Claude Code — when each wins, with your own numbers.

**Mastery check** — The agent runs unattended against the repo with cost caps, an audit
trail, and a permission model you'd put in front of a client's security team.

---

## Phase 06 — Stay current

**Ongoing · ~1h/week**

> *Setups rot faster than codebases. The docs shipped 22 weekly release notes in the last six months.*

### Read

- [whats-new](../../docs/whats-new.md) — weekly
- [changelog](../../docs/changelog.md)
- [glossary](../../docs/glossary.md) — when terms shift

### Build

- [ ] Weekly: run your docs sync script, then read the git diff rather than the release notes.
- [ ] Monthly: re-run `/context all` and prune whatever crept back in. → [`notes/measurements.md`](notes/measurements.md)
- [ ] Quarterly: rebuild one skill from scratch without looking at the old one, then diff the designs.

**Mastery check** — You learn about a change from your own diff before you see it announced.

---

## Traps on this route

| Trap | Why it bites |
|---|---|
| **Letting the model design the domain** | If the invariants aren't yours, none of the enforcement you build on top of them means anything. Own the structural decisions; let the model fill in the structure you chose. |
| **Scope creep in the lab** | Cadence exists to generate hard constraints, not to be finished. Every feature past the phase's shipping line is a week you didn't spend on the actual subject. |
| **CLAUDE.md as a landfill** | Past 200 lines it stops being context and starts being noise that dilutes everything else in the window. |
| **Reaching for subagents to fix a bloated main session** | Isolation is a design choice, not a cleanup tool. Fix the context first, then decide. |
| **Writing a skill for something a lint rule should catch** | Cheapest layer that can decide, wins: linter, then hook, then prompt. If a rule must hold every time, prompting for it is a bug. |
| **Copying a workflow from a blog post** | If you didn't measure tokens before and after, you don't know whether you improved anything. |

---

## The exam

Answer these cold, without opening the docs. If you can, the twelve weeks worked.

1. What loads into context at session start, and what defers until first use?
2. When does a hook beat a skill, and when is a hook actively the wrong tool?
3. Why does a subagent's work not show up in your main context window — and what does that cost you?
4. When does a dynamic workflow beat five subagents you spawn yourself?
5. How do CLAUDE.md, rules and skills layer when the same instruction exists at three levels?
6. What breaks prompt caching, and what does that cost per session?
7. What does the Agent SDK give you that headless `claude -p` does not?
8. How would you cap and audit an agent running unattended against a private repo it does not fully trust?

---

Weekly sync, then read the diff rather than the announcement — from the repo root:

```bash
node src/sync-claude-docs.ts && git add -A docs && git commit -m "sync $(date -I)"
```
