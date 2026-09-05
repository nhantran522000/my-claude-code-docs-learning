# Cadence — the mastery-track lab

A self-hosted subscription and renewal tracker, built as the single greenfield repo for
the 12-week [Claude Code Mastery Track](ROADMAP.md).

Cadence is not the point. It exists to generate constraints hard enough to be worth
enforcing mechanically — money arithmetic, timezone-correct renewal dates, jobs that must
never double-fire, multi-user data. A to-do app produces no rules worth writing a hook for.

## Layout

```
ROADMAP.md            the 12-week track — start here, tick boxes as you go
docs/domain-spec.md   the six invariants, renewal rules, non-goals  ← write this FIRST
docs/adr/             architecture decision records
notes/measurements.md /context all readings over time — the whole track is measured
```

Application code (`apps/`, `packages/`) does not exist yet. Phase 00 build task 2 creates
it, and task 1 comes first for a reason: **you design the domain, not the model.**

## Before you start

Read the ROADMAP's *"Start here, not at the beginning"* section, then fill in
[`docs/domain-spec.md`](docs/domain-spec.md) by hand. The six invariants are already
listed there — the renewal rules and the non-goals are yours to decide, and every hook,
lint rule and subagent in Phases 2–5 is downstream of them.

## Worth deciding early

The track assumes Cadence is its own git repo — Phase 03 runs three git worktrees at once,
and Phase 04's onboarding test wants a clean clone. Right now this is a subdirectory of
the docs-learning repo, which makes both awkward. Either split it into its own repo before
Phase 03, or accept that those two exercises run against the parent repo.
