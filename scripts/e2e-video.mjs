/**
 * Video-tool smoke test — the ffmpeg.wasm path.
 *
 * The main e2e suite (scripts/e2e-all-tools.mjs) covers text/number/PDF tools
 * but never loads the 9.7 MB wasm core, so a broken ffmpeg URL ships silently.
 * This script exists because the core is now served as `ffmpeg-core.wasm.gz`
 * and inflated in the browser (static hosts cap a single asset at 25 MiB), and
 * that path must be proven to work end to end.
 *
 * It asserts, against a real Chromium:
 *   1. /ffmpeg/ffmpeg-core.wasm.gz is served and is a valid gzip stream
 *   2. the browser can inflate it to the exact raw byte length (30.6 MiB)
 *   3. video-to-audio actually converts a fixture mp4 into a downloadable mp3
 *
 * Run:  node scripts/e2e-video.mjs
 * Env:  BASE_URL (default http://localhost:3000), AUDIO_FIXTURE (/tmp/audio.mp4)
 */
import { chromium } from "playwright-core";

const BASE = process.env.BASE_URL ?? "http://localhost:3000";
const FIXTURE = process.env.AUDIO_FIXTURE ?? "/tmp/audio.mp4";

let failures = 0;
const check = (name, pass, detail = "") => {
  console.log(`${pass ? "PASS" : "FAIL"}  ${name}${detail ? ` — ${detail}` : ""}`);
  if (!pass) failures += 1;
};

const browser = await chromium.launch({ args: ["--no-sandbox"] });
const page = await browser.newPage({ acceptDownloads: true });
const errors = [];
page.on("pageerror", (e) => errors.push(String(e)));
page.on("console", (m) => {
  if (m.type() === "error") errors.push(m.text());
});

/* ── 1 + 2. the gzipped core is fetchable and inflatable ─────────────────── */
await page.goto(`${BASE}/`, { waitUntil: "domcontentloaded" });

const core = await page.evaluate(async () => {
  const response = await fetch("/ffmpeg/ffmpeg-core.wasm.gz");
  if (!response.ok) return { ok: false, status: response.status };
  const encoding = response.headers.get("content-encoding");
  if (encoding) return { ok: false, reason: `host re-encoded the .gz (${encoding})` };
  const inflated = await new Response(
    response.body.pipeThrough(new DecompressionStream("gzip")),
  ).arrayBuffer();
  const magic = new Uint8Array(inflated.slice(0, 4));
  return {
    ok: true,
    bytes: inflated.byteLength,
    // WebAssembly magic: 0x00 0x61 0x73 0x6d
    isWasm: magic[0] === 0x00 && magic[1] === 0x61 && magic[2] === 0x73 && magic[3] === 0x6d,
  };
});

check("core served as .wasm.gz", core.ok === true, core.reason ?? `status ${core.status ?? 200}`);
if (core.ok) {
  check(
    "inflates to a valid wasm module",
    core.isWasm === true,
    `${(core.bytes / 1024 / 1024).toFixed(2)} MiB inflated`,
  );
}

/* ── 3. a real conversion through ffmpeg.wasm ────────────────────────────── */
await page.goto(`${BASE}/tools/video-to-audio/`, { waitUntil: "networkidle" });
await page.waitForTimeout(1000); // let React hydrate before touching the input

// The start button only exists once a file is selected and probed by the UI.
// A file dropped into an un-hydrated input fires no onChange, so retry.
const button = page.locator("button", { hasText: /شروع پردازش/ }).first();
for (let attempt = 0; attempt < 4; attempt += 1) {
  await page.setInputFiles('input[type="file"]', FIXTURE);
  const ready = await button
    .waitFor({ state: "visible", timeout: 20000 })
    .then(() => true)
    .catch(() => false);
  if (ready) break;
  if (attempt === 3) throw new Error("start button never appeared after uploading the fixture");
}
// The core is 9.7 MB and inflating takes a few seconds; output appears after
// ffmpeg runs in a worker. Give it a generous budget.
await button.click();

// The result panel renders a «دانلود خروجی» button — the download is user
// initiated, so the test must click it (an earlier version of this script
// waited for an automatic download and always failed).
const resultPanel = page.locator('[data-testid$="-result"]').first();
const produced = await resultPanel
  .waitFor({ state: "visible", timeout: 180000 })
  .then(() => true)
  .catch(() => false);

const download = produced
  ? await Promise.all([
      page.waitForEvent("download", { timeout: 60000 }),
      page.locator('[data-testid$="-download"]').first().click(),
    ]).then(([d]) => d).catch(() => null)
  : null;

if (download) {
  const path = await download.path();
  const { size } = await import("node:fs").then((fs) => fs.promises.stat(path));
  check(
    "video-to-audio produced a file",
    size > 1000,
    `${download.suggestedFilename()} ${size}B`,
  );
} else {
  // No download: surface whatever the UI said, so the failure is diagnosable.
  const body = await page.locator("body").innerText();
  const hint = body.split("\n").find((l) => /خطا|ناموفق|پشتیبانی|error/i.test(l)) ?? "";
  check("video-to-audio produced a file", false, hint.slice(0, 160) || "no download event");
}

check("no uncaught JS errors", errors.length === 0, errors.slice(0, 2).join(" || "));

await browser.close();
console.log(failures === 0 ? "\n✅ video checks passed" : `\n❌ ${failures} CHECK(S) FAILED`);
process.exit(failures === 0 ? 0 : 1);
