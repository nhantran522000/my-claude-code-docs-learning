#!/usr/bin/env node
/**
 * Incremental mirror of the Claude Code documentation.
 *
 *   node src/sync-claude-docs.ts        # Node 22.18+ strips TS types natively
 *   npx tsx src/sync-claude-docs.ts     # older Node
 *
 * How it works:
 *   1. Reads https://code.claude.com/sitemap.xml (every page + a <lastmod> stamp).
 *   2. Keeps only the pages for the chosen language.
 *   3. Downloads the RAW MARKDOWN source of each page by appending ".md" to the URL
 *      (Mintlify serves it) — no HTML parsing, no scraping, no rate-limit games.
 *   4. Writes a manifest so subsequent runs only re-fetch pages whose lastmod moved,
 *      and reports added / updated / deleted pages.
 *
 * Output defaults to <repo>/docs, resolved from this file's location so the script
 * behaves the same no matter which directory you run it from.
 *
 * Env overrides: DOCS_LANG, DOCS_OUT, DOCS_CONCURRENCY, DOCS_FORCE=1
 */

import { createHash } from "node:crypto";
import { mkdir, readFile, rm, writeFile } from "node:fs/promises";
import { dirname, join, relative, resolve } from "node:path";

const SITEMAP_URL = "https://code.claude.com/sitemap.xml";
const LANG = process.env.DOCS_LANG ?? "en";
const REPO_ROOT = join(import.meta.dirname, "..");
const OUT_DIR = process.env.DOCS_OUT
  ? resolve(process.env.DOCS_OUT)
  : join(REPO_ROOT, "docs");
const CONCURRENCY = Number(process.env.DOCS_CONCURRENCY ?? 8);
const FORCE = process.env.DOCS_FORCE === "1";
const MANIFEST = join(OUT_DIR, ".sync-manifest.json");
const PATH_PREFIX = `/docs/${LANG}/`;

type Entry = { lastmod: string; hash: string; file: string };
type Manifest = { syncedAt: string; lang: string; entries: Record<string, Entry> };

const sha = (s: string) => createHash("sha256").update(s).digest("hex").slice(0, 16);

async function get(url: string, attempt = 1): Promise<string> {
  try {
    const res = await fetch(url, {
      headers: { "user-agent": "claude-docs-sync/1.0 (personal docs mirror)" },
    });
    if (res.status === 429 || res.status >= 500) throw new Error(`HTTP ${res.status}`);
    if (!res.ok) throw Object.assign(new Error(`HTTP ${res.status}`), { fatal: true });
    return await res.text();
  } catch (err) {
    if ((err as { fatal?: boolean }).fatal || attempt >= 4) throw err;
    await new Promise((r) => setTimeout(r, 2 ** attempt * 400));
    return get(url, attempt + 1);
  }
}

/** Minimal sitemap parse — the file is machine-generated and flat, so regex is fine. */
function parseSitemap(xml: string) {
  const out: { loc: string; lastmod: string }[] = [];
  for (const block of xml.matchAll(/<url>([\s\S]*?)<\/url>/g)) {
    const loc = /<loc>(.*?)<\/loc>/.exec(block[1])?.[1]?.trim();
    const lastmod = /<lastmod>(.*?)<\/lastmod>/.exec(block[1])?.[1]?.trim() ?? "";
    if (loc) out.push({ loc, lastmod });
  }
  return out;
}

/** https://code.claude.com/docs/en/agent-sdk/quickstart -> <out>/agent-sdk/quickstart.md */
function localPath(loc: string) {
  const slug = new URL(loc).pathname.slice(PATH_PREFIX.length) || "index";
  return join(OUT_DIR, `${slug}.md`);
}

async function pool<T>(items: T[], limit: number, worker: (item: T) => Promise<void>) {
  let i = 0;
  await Promise.all(
    Array.from({ length: Math.min(limit, items.length) }, async () => {
      while (i < items.length) await worker(items[i++]);
    }),
  );
}

async function main() {
  const previous: Manifest = await readFile(MANIFEST, "utf8")
    .then(JSON.parse)
    .catch(() => ({ syncedAt: "", lang: LANG, entries: {} }));

  const pages = parseSitemap(await get(SITEMAP_URL)).filter((p) =>
    new URL(p.loc).pathname.startsWith(PATH_PREFIX),
  );
  if (!pages.length) throw new Error(`No pages found for lang "${LANG}" — check DOCS_LANG.`);
  console.log(`sitemap: ${pages.length} pages for "${LANG}"`);

  const next: Manifest["entries"] = {};
  const added: string[] = [];
  const updated: string[] = [];
  const failed: string[] = [];
  let unchanged = 0;

  await pool(pages, CONCURRENCY, async ({ loc, lastmod }) => {
    const prev = previous.entries[loc];
    const file = localPath(loc);

    // Fast path: sitemap says nothing changed and we already have the file.
    if (!FORCE && prev && prev.lastmod === lastmod) {
      const stillThere = await readFile(file, "utf8").then(
        (t) => sha(t) === prev.hash,
        () => false,
      );
      if (stillThere) {
        next[loc] = prev;
        unchanged++;
        return;
      }
    }

    try {
      const body = await get(`${loc}.md`);
      const hash = sha(body);
      await mkdir(dirname(file), { recursive: true });
      await writeFile(file, body, "utf8");
      next[loc] = { lastmod, hash, file: relative(OUT_DIR, file) };
      if (!prev) added.push(loc);
      else if (prev.hash !== hash) updated.push(loc);
      else unchanged++;
    } catch (err) {
      failed.push(`${loc} (${(err as Error).message})`);
      if (prev) next[loc] = prev; // keep the old copy rather than losing it
    }
  });

  // Pages that vanished from the sitemap.
  const removed = Object.keys(previous.entries).filter((loc) => !(loc in next));
  for (const loc of removed) await rm(localPath(loc), { force: true });

  await mkdir(OUT_DIR, { recursive: true });
  await writeFile(
    MANIFEST,
    JSON.stringify({ syncedAt: new Date().toISOString(), lang: LANG, entries: next }, null, 2),
  );

  const list = (label: string, xs: string[]) =>
    xs.length && console.log(`\n${label} (${xs.length}):\n  ${xs.join("\n  ")}`);

  console.log(
    `\n${added.length} added · ${updated.length} updated · ${removed.length} removed · ${unchanged} unchanged`,
  );
  list("added", added);
  list("updated", updated);
  list("removed", removed);
  list("FAILED", failed);
  console.log(`\n-> ${OUT_DIR}`);
  if (failed.length) process.exitCode = 1;
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
