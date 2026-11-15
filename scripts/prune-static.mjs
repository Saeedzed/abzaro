/**
 * Make `out/` deployable on hosts with a hard per-file cap (Cloudflare Pages,
 * Cloudflare Workers static assets: 25 MiB per file, every plan).
 *
 * The only asset that ever gets close is `ffmpeg/ffmpeg-core.wasm` (30.6 MiB).
 * The browser actually loads `ffmpeg-core.wasm.gz` (9.7 MiB) and inflates it
 * locally, so the raw copy is dead weight on a capped host — this script deletes
 * it, and fails the build loudly if anything ELSE is still oversized (better a
 * red build than a broken video tool in production).
 *
 * Usage:
 *   node scripts/prune-static.mjs            # prune out/, 25 MiB cap (Cloudflare)
 *   MAX_FILE_MIB=100 node scripts/prune-static.mjs
 *   node scripts/prune-static.mjs --check    # report only, delete nothing
 */
import { readdirSync, rmSync, statSync } from "node:fs";
import { join, relative } from "node:path";

const root = process.cwd();
const dir = join(root, "out");
const checkOnly = process.argv.includes("--check");
const limit = (Number(process.env.MAX_FILE_MIB) || 25) * 1024 * 1024;

/** Files that are safe to delete because a gzipped sibling is served instead. */
const REDUNDANT = new Set(["ffmpeg/ffmpeg-core.wasm"]);

if (!statSync(dir, { throwIfNoEntry: false })?.isDirectory()) {
  console.error("prune-static: out/ not found — run the static build first");
  process.exit(1);
}

const walk = (current) =>
  readdirSync(current, { withFileTypes: true }).flatMap((entry) => {
    const full = join(current, entry.name);
    return entry.isDirectory() ? walk(full) : [full];
  });

let removed = 0;
let freed = 0;
const fatal = [];

for (const file of walk(dir)) {
  const { size } = statSync(file);
  const rel = relative(dir, file).split("\\").join("/");
  if (size <= limit) continue;

  const mib = (size / 1024 / 1024).toFixed(2);
  if (REDUNDANT.has(rel)) {
    if (!checkOnly) rmSync(file);
    removed += 1;
    freed += size;
    console.log(`prune-static: ${checkOnly ? "would remove" : "removed"} ${rel} (${mib} MiB)`);
  } else {
    fatal.push(`${rel} (${mib} MiB)`);
  }
}

if (fatal.length > 0) {
  console.error(
    `prune-static: these files exceed the ${limit / 1024 / 1024} MiB host limit ` +
      `and have no smaller replacement:\n  ${fatal.join("\n  ")}`,
  );
  process.exit(1);
}

console.log(
  removed === 0
    ? `prune-static: nothing above ${limit / 1024 / 1024} MiB — deployable as is`
    : `prune-static: ${removed} file(s), ${(freed / 1024 / 1024).toFixed(1)} MiB ` +
        `${checkOnly ? "would be" : ""} freed — largest remaining asset fits the cap`,
);
