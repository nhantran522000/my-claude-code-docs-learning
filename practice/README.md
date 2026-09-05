# practice

Scratch space for learning Claude Code by building things from the mirrored docs.

One folder per experiment, named for what it teaches — e.g. `hooks-pre-commit/`,
`mcp-weather-server/`, `agent-sdk-first-agent/`. Each folder is self-contained: its own
deps, its own README noting which page under `../docs/` it came from.

Nothing here is imported by `../src/`, and nothing here is ever touched by the sync script.

## Current

- **[cadence/](cadence/)** — the lab for the 12-week
  [Claude Code Mastery Track](cadence/ROADMAP.md). A subscription and renewal tracker,
  chosen for its hard constraints (money, timezones, idempotent jobs) rather than its
  features. Start at [`cadence/docs/domain-spec.md`](cadence/docs/domain-spec.md).
