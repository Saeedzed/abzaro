/**
 * Copy the single-threaded ffmpeg.wasm core into public/ffmpeg.
 *
 * The files are NOT committed (the .wasm alone is 31 MB and would blow up the
 * repo), so this script runs automatically before every build (`prebuild`) and
 * can be run by hand with `npm run prepare:ffmpeg`.
 *
 * Netlify installs dev+prod dependencies before building, so the npm packages
 * are always present at build time.
 */
import { copyFileSync, existsSync, mkdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = dirname(dirname(fileURLToPath(import.meta.url)));
const target = join(root, "public", "ffmpeg");
mkdirSync(target, { recursive: true });

const files = [
  ["node_modules/@ffmpeg/core/dist/umd/ffmpeg-core.js", "ffmpeg-core.js"],
  ["node_modules/@ffmpeg/core/dist/umd/ffmpeg-core.wasm", "ffmpeg-core.wasm"],
  ["node_modules/@ffmpeg/ffmpeg/dist/umd/ffmpeg.js", "ffmpeg.js"],
  ["node_modules/@ffmpeg/ffmpeg/dist/umd/814.ffmpeg.js", "814.ffmpeg.js"],
];

let copied = 0;
for (const [from, to] of files) {
  const source = join(root, from);
  if (!existsSync(source)) {
    console.warn(`⚠ skipped ${from} (not installed)`);
    continue;
  }
  copyFileSync(source, join(target, to));
  copied += 1;
}

console.log(`ffmpeg assets ready (${copied}/${files.length} files in public/ffmpeg)`);
