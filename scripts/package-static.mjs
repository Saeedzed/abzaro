/**
 * Package the static export into a zip ready for Netlify Drop
 * (https://app.netlify.com/drop).
 *
 *   node scripts/package-static.mjs
 *
 * Reads NEXT_PUBLIC_SITE_URL (defaults to https://abzaro.netlify.app), builds
 * with ABZARO_EXPORT=1 and writes abzaro-static.zip in the project root.
 */
import { execFileSync } from "node:child_process";
import { existsSync, rmSync, statSync } from "node:fs";
import { join } from "node:path";

const root = process.cwd();
const outDir = join(root, "out");
const zipPath = join(root, "abzaro-static.zip");
const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://abzaro.netlify.app";

function run(command, args, env = {}) {
  console.log(`\n$ ${command} ${args.join(" ")}`);
  execFileSync(command, args, {
    cwd: root,
    stdio: "inherit",
    // NODE_OPTIONS in the sandbox contains a flag that breaks worker threads.
    env: { ...process.env, NODE_OPTIONS: "", ABZARO_EXPORT: "1", NEXT_PUBLIC_SITE_URL: siteUrl, ...env },
  });
}

console.log(`Static export for ${siteUrl}`);

if (existsSync(outDir)) rmSync(outDir, { recursive: true, force: true });
if (existsSync(zipPath)) rmSync(zipPath, { force: true });

run("npm", ["run", "build"]);

if (!existsSync(join(outDir, "index.html"))) {
  console.error("\n✗ Build finished but out/index.html is missing.");
  process.exit(1);
}

// Zip the *contents* of out/ (cwd = out) so the archive root is the site root.
execFileSync("zip", ["-qr", zipPath, "."], {
  cwd: outDir,
  stdio: "inherit",
  env: { ...process.env, NODE_OPTIONS: "" },
});

const size = statSync(zipPath).size;
const pretty = size > 1024 * 1024 ? `${(size / 1024 / 1024).toFixed(2)} MB` : `${Math.round(size / 1024)} KB`;

console.log(`\n✓ ${zipPath} (${pretty})`);
console.log("\nNext step: drag abzaro-static.zip onto https://app.netlify.com/drop");
