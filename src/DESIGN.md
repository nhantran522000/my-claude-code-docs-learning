Don't crawl the HTML — the site publishes machine-readable endpoints, so this is a fetch job, not a scrape job. I verified all three exist:

| Endpoint | What it gives you |
|---|---|
| `https://code.claude.com/sitemap.xml` | ~900 URLs (en/de/es) each with a `<lastmod>` timestamp — the incremental-sync key |
| `https://code.claude.com/docs/llms.txt` | Curated index: every page as a `.md` link plus a one-line description |
| `<any page URL>.md` | Raw markdown source of that page (e.g. `/docs/en/overview.md`) |
| `https://code.claude.com/docs/llms-full.txt` | Everything concatenated into one file |

**My recommendation: sitemap + per-page `.md`.** It's the only option that gives you per-page change detection and a file tree you can diff. `llms-full.txt` is a single blob — fine for stuffing into a context window, useless for tracking what changed. `llms.txt` is a good fallback index but has no timestamps, so re-runs would mean re-fetching all 400 pages and hashing.

The script does exactly that: parse sitemap → filter to `/docs/en/` → fetch `{url}.md` → write to a mirrored directory tree → store a manifest of `lastmod` + content hash. On re-run it skips any page whose `lastmod` is unchanged and prints `added / updated / removed`.

```bash
node src/sync-claude-docs.ts       # Node 22.18+, zero deps
npx tsx src/sync-claude-docs.ts    # anything else
```

Two things worth adding on your side:

**Git as the diff engine.** Track the repo in git and commit after each sync. Then `git log -p -- docs/` shows you the exact prose that changed between runs — far more useful than a list of changed filenames.

```bash
git add -A docs && git commit -m "sync $(date -I)" || echo "no changes"
```

**Schedule it.** A cron entry or GitHub Action on a weekly cadence. The docs move fast enough that weekly is about right — daily mostly produces empty commits.

One caveat on `lastmod`: Mintlify sometimes bumps it on rebuilds without real content changes, which is why the script also hashes the body and reports `unchanged` separately from `updated`. Set `DOCS_FORCE=1` if you ever want to bypass the manifest entirely and re-pull everything.