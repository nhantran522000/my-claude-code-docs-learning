# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

A personal workspace for learning Claude Code from its own documentation. Three directories, three distinct jobs — keep them separate:

| Directory | Role | Rule |
|---|---|---|
| `src/` | The sync tool (`sync-claude-docs.ts`) and its design notes (`DESIGN.md`) | The only hand-written source in the repo |
| `docs/` | Local mirror of https://code.claude.com, ~190 markdown pages | **Generated — never edit by hand.** Read-only reference material |
| `practice/` | Learning projects built while working through the docs | Free-form; one self-contained folder per experiment |

`docs/` is fully owned by the sync script: it deletes pages that vanish from the sitemap and overwrites pages that change upstream, so any manual edit there is silently lost on the next run. Notes about a doc page belong in `practice/`, not next to the page.

`practice/` is never read or written by the sync script and is not imported by `src/`. Practice projects may have their own `package.json` and dependencies — that is expected and does not apply to the root.

## Commands

```bash
node src/sync-claude-docs.ts            # Node 22.18+ strips TS types natively (local: v22.22.3)
npx tsx src/sync-claude-docs.ts         # older Node
DOCS_FORCE=1 node src/sync-claude-docs.ts   # ignore the manifest, re-fetch everything
```

Output resolves to `<repo>/docs` from the script's own location, so the command works from any cwd.

| Var | Default | Effect |
|---|---|---|
| `DOCS_LANG` | `en` | Which `/docs/<lang>/` sitemap subtree to mirror |
| `DOCS_OUT` | `<repo>/docs` | Output directory (manifest lives inside it) |
| `DOCS_CONCURRENCY` | `8` | Parallel fetches |
| `DOCS_FORCE` | unset | `1` bypasses the manifest and re-fetches every page |

Exits `1` if any page failed to fetch; the summary line and a `FAILED` list go to stdout.

`src/` has no `package.json`, no dependencies, no tests, and no linter — the script's value is that it runs anywhere with a modern Node and nothing installed. Don't add a build step or a dependency to it without being asked.

## Sync architecture

The whole pipeline is `main()` in `src/sync-claude-docs.ts`:

1. **Sitemap, not scraping.** `https://code.claude.com/sitemap.xml` lists ~900 URLs each with a `<lastmod>`. Pages are filtered to `PATH_PREFIX` (`/docs/<lang>/`). The sitemap is machine-generated and flat, so `parseSitemap` uses regex deliberately — do not pull in an XML parser.
2. **Raw markdown, not HTML.** Mintlify serves the markdown source of any page at `<url>.md`. That is the only content fetch; there is no HTML parsing anywhere.
3. **Mirrored tree.** `localPath` maps `.../docs/en/agent-sdk/quickstart` → `docs/agent-sdk/quickstart.md`.
4. **Manifest.** `docs/.sync-manifest.json` stores `{ lastmod, hash, file }` per source URL. It is the incremental-sync state; deleting it is equivalent to `DOCS_FORCE=1`.

Two details that are easy to break when editing:

- **`lastmod` is a fast path, not the source of truth.** Mintlify bumps `lastmod` on rebuilds without real content changes, so a page whose `lastmod` moved is still re-fetched *and* content-hashed; it only counts as `updated` when the sha differs. That is why `unchanged` is reported separately. The `lastmod` check also re-verifies the local file's hash, so a locally deleted or edited file is re-fetched.
- **Fetch failures preserve the previous entry** (`if (prev) next[loc] = prev`). Dropping that would make a transient network error look like a deletion, and the removal pass below would delete the local file.

`get()` retries with exponential backoff on 429/5xx and gives up immediately on other non-OK responses (marked `fatal`).

## Why this design (from src/DESIGN.md)

`llms-full.txt` is one concatenated blob — good for a context window, useless for tracking what changed. `llms.txt` is a usable index but has no timestamps, so every re-run would re-fetch all pages. Sitemap + per-page `.md` is the only option giving per-page change detection and a diffable file tree.

That diffability is the point: git-track the repo and commit after each sync, so `git log -p -- docs/` shows the prose that actually changed upstream.

```bash
node src/sync-claude-docs.ts && git add -A docs && git commit -m "sync $(date -I)" || echo "no changes"
```

Weekly is the right cadence; daily mostly produces empty commits.

## Automated sync

`.github/workflows/sync-docs.yml` runs the sync every **Sunday at 23:59 UTC** and pushes the result as a `github-actions[bot]` commit. `workflow_dispatch` triggers it manually, with a `force` input mapping to `DOCS_FORCE=1`.

Three behaviours worth preserving when editing it:

- **It commits on partial failure, then fails the job.** Losing 189 good pages because 2 timed out is worse than a slightly stale mirror, so the commit step is `if: always()` and a later step re-raises the script's exit code.
- **The change guard uses `git status`, not `git diff`.** `git diff` does not see untracked files, so a brand-new doc page would be silently skipped.
- **A manifest-only change does not produce a commit.** `docs/.sync-manifest.json` rewrites its `syncedAt` on every run, so the guard excludes it via `':(exclude)docs/.sync-manifest.json'` — otherwise every week commits regardless of whether the docs moved.

Cron in GitHub Actions is always UTC and cannot be given a timezone, so during BST the run lands at 00:59 Monday UK time. Scheduled runs are also queued rather than exact, and GitHub disables schedules on a repo after 60 days without activity.

Note that the script counts a *restored* page (deleted locally, re-fetched with identical content) as `unchanged`, so a commit can carry a `0 added · 0 updated · 0 removed` body while still changing files.
