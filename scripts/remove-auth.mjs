/**
 * Removes the local-profile / dashboard feature and verifies the tree is clean.
 *
 * Why this exists: a static export compiles EVERY file under src/app. If the
 * old auth routes are still on disk, `next build` fails with
 *   "Export useSavedTools doesn't exist in target module"
 * even though nothing links to them any more — Next.js still type-checks and
 * bundles src/app/dashboard/page.tsx. Deleting the files is not optional.
 *
 * Usage (from the repo root):
 *   node scripts/remove-auth.mjs            # delete, then verify
 *   node scripts/remove-auth.mjs --dry-run  # report only
 *   node scripts/remove-auth.mjs --git      # use `git rm` so the deletion is staged
 *
 * Exit code is non-zero if any reference to the removed modules survives, so a
 * CI build cannot silently ship a half-removed tree.
 */
import { existsSync, readdirSync, readFileSync, rmSync, statSync } from "node:fs";
import { execFileSync } from "node:child_process";
import { join, relative } from "node:path";

const root = process.cwd();
const dryRun = process.argv.includes("--dry-run");
const useGit = process.argv.includes("--git");

/** Every path the auth feature added (deleted in commit db293a0). */
const REMOVED = [
  "src/app/dashboard",
  "src/app/login",
  "src/components/auth",
  "src/lib/local-auth.ts",
  "src/lib/local-auth.test.ts",
  "src/lib/use-session.ts",
];

/** Modules that must no longer be imported anywhere. */
const DEAD_IMPORTS = [
  "@/lib/local-auth",
  "@/lib/use-session",
  "@/components/auth/",
  "useSavedTools",
  "useSession",
  "savedTools",
  "saveAccount",
  "loadAccount",
  "deleteAccount",
  "profileId",
];

if (!existsSync(join(root, "package.json"))) {
  console.error("remove-auth: run this from the repository root (no package.json here)");
  process.exit(1);
}

/* ── 1. delete the files ──────────────────────────────────────────────────── */
let gone = 0;
for (const path of REMOVED) {
  const full = join(root, path);
  if (!existsSync(full)) {
    console.log(`  · already absent  ${path}`);
    continue;
  }
  if (dryRun) {
    console.log(`  → would remove   ${path}`);
    gone += 1;
    continue;
  }
  if (useGit) {
    try {
      execFileSync("git", ["rm", "-r", "-q", "-f", path], { cwd: root, stdio: "pipe" });
    } catch {
      rmSync(full, { recursive: true, force: true });
    }
  } else {
    rmSync(full, { recursive: true, force: true });
  }
  console.log(`  ✓ removed        ${path}`);
  gone += 1;
}

/* ── 2. look for leftovers (imports, type references, copy) ───────────────── */
const walk = (dir) =>
  readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const full = join(dir, entry.name);
    return entry.isDirectory() ? walk(full) : [full];
  });

const hits = [];
for (const file of walk(join(root, "src"))) {
  if (!/\.(ts|tsx|js|mjs|json)$/.test(file)) continue;
  const text = readFileSync(file, "utf8");
  for (const needle of DEAD_IMPORTS) {
    if (text.includes(needle)) {
      hits.push(`${relative(root, file).split("\\").join("/")}  →  ${needle}`);
    }
  }
}

console.log(
  `\nremove-auth: ${gone} path(s) ${dryRun ? "to delete" : "deleted"} in this run`,
);

if (hits.length > 0) {
  console.error(
    `\n✗ ${hits.length} reference(s) to the removed feature are left in src/.\n` +
      `  These files still need the post-removal version (from abzaro-update.zip):\n`,
  );
  for (const hit of hits) console.error(`    ${hit}`);
  console.error(
    "\n  Typical fix: copy the current version of these files over yours —\n" +
      "    src/components/layout/Header.tsx\n" +
      "    src/components/tools/RecentTools.tsx\n" +
      "    src/lib/use-recent-tools.ts\n" +
      "    next.config.ts\n",
  );
  process.exit(1);
}

console.log("✓ no references to the local-profile feature remain — tree is consistent");
if (dryRun) process.exit(0);
console.log(
  "\nNext:  npx tsc --noEmit  &&  ABZARO_EXPORT=1 npm run build  &&  git push",
);
