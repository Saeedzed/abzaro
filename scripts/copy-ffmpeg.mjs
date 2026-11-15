/**
 * Copy the single-threaded ffmpeg.wasm core into public/ffmpeg.
 *
 * The files are NOT committed (the .wasm alone is 31 MB and would blow up the
 * repo), so this script runs automatically before every build (`prebuild`) and
 * can be run by hand with `npm run prepare:ffmpeg`.
 *
 * Netlify/Cloudflare install dev+prod dependencies before building, so the npm
 * packages are always present at build time.
 *
 * ── Why the .wasm is stored gzipped ─────────────────────────────────────────
 * Static hosts cap the size of a single file: Cloudflare Pages/Workers reject
 * any asset over 25 MiB, and the raw core is 30.6 MiB. So we ship
 * `ffmpeg-core.wasm.gz` (9.7 MiB, gzip -9) and the browser inflates it locally:
 *
 *   * ~3× less to download for the user (a real win on mobile);
 *   * no host-specific `Content-Encoding` trickery — the file is fetched as
 *     plain bytes and expanded with `DecompressionStream("gzip")`, so any
 *     static host works, with or without brotli/gzip content negotiation;
 *   * still 100% local processing — the inflate happens in the browser.
 *
 * src/lib/video.ts checks `/ffmpeg/ffmpeg-core.wasm.gz` first and only falls
 * back to the raw `.wasm` (hosts that have no 25 MiB limit, e.g. `next dev`).
 */
import { copyFileSync, existsSync, mkdirSync, readFileSync, statSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { gzipSync } from "node:zlib";

const root = dirname(dirname(fileURLToPath(import.meta.url)));
const target = join(root, "public", "ffmpeg");
mkdirSync(target, { recursive: true });

const files = [
  ["node_modules/@ffmpeg/core/dist/umd/ffmpeg-core.js", "ffmpeg-core.js"],
  ["node_modules/@ffmpeg/core/dist/umd/ffmpeg-core.wasm", "ffmpeg-core.wasm"],
  ["node_modules/@ffmpeg/ffmpeg/dist/umd/ffmpeg.js", "ffmpeg.js"],
  ["node_modules/@ffmpeg/ffmpeg/dist/umd/814.ffmpeg.js", "814.ffmpeg.js"],
];

/** Cloudflare (Pages and Workers, every plan) refuses assets above 25 MiB. */
const HOST_FILE_LIMIT = 25 * 1024 * 1024;

const mib = (bytes) => `${(bytes / 1024 / 1024).toFixed(2)} MiB`;

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

/* ── gzip the wasm so the deploy stays under every host's per-file limit ── */
const wasmPath = join(target, "ffmpeg-core.wasm");
if (existsSync(wasmPath)) {
  const raw = readFileSync(wasmPath);
  // level 9 is worth the extra build second: 30.6 MiB → ~9.7 MiB
  const gz = gzipSync(raw, { level: 9 });
  const gzPath = join(target, "ffmpeg-core.wasm.gz");
  writeFileSync(gzPath, gz);

  const gzSize = statSync(gzPath).size;
  console.log(
    `ffmpeg core: ${mib(raw.length)} raw → ${mib(gzSize)} gzipped ` +
      `(${Math.round((1 - gzSize / raw.length) * 100)}% smaller)`,
  );

  if (gzSize > HOST_FILE_LIMIT) {
    throw new Error(
      `ffmpeg-core.wasm.gz is ${mib(gzSize)}, still above the 25 MiB per-file ` +
        `limit that Cloudflare enforces. Refusing to build a deployable site.`,
    );
  }
  // Kept for `next dev` and for hosts without a file-size limit. Cloudflare
  // deploys exclude it via scripts/prune-static.mjs.
  console.log("ffmpeg assets ready — .wasm.gz is the file the browser fetches");
}

console.log(`ffmpeg assets ready (${copied}/${files.length} files in public/ffmpeg)`);
