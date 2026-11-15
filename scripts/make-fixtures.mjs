/**
 * Creates the binary fixtures the browser tests need.
 *
 * The e2e scripts read these paths (overridable by env vars):
 *   /tmp/test-image.png      400×300  — image tools
 *   /tmp/test-image-2.jpg    640×480  — PDF-from-images / merger
 *   /tmp/pdf-fixture.pdf     2 pages  — PDF tools
 *   /tmp/pdf-fixture-3p.pdf  3 pages  — merge / reorder / split
 *   /tmp/audio.mp4           2s, with audio — video-to-audio, gif, compressor
 *   /tmp/tiny.mp4            2s, no audio   — trimmer, resizer
 *
 * Run once after a fresh checkout (they live in /tmp, so a reboot clears them):
 *   node scripts/make-fixtures.mjs
 *
 * Images use sharp-free canvas-free generation via a tiny PNG writer; PDFs use
 * pdf-lib (already a dependency); videos need the `ffmpeg` binary on PATH and are
 * skipped with a warning if it is missing.
 */
import { PDFDocument, StandardFonts } from "pdf-lib";
import { execFileSync } from "node:child_process";
import { deflateSync } from "node:zlib";
import { writeFileSync } from "node:fs";

/* ── minimal PNG encoder (solid colour + grid, no dependencies) ── */
function crc32(buf) {
  let c;
  const table = [];
  for (let n = 0; n < 256; n += 1) {
    c = n;
    for (let k = 0; k < 8; k += 1) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    table[n] = c >>> 0;
  }
  let crc = 0xffffffff;
  for (const byte of buf) crc = table[(crc ^ byte) & 0xff] ^ (crc >>> 8);
  return (crc ^ 0xffffffff) >>> 0;
}

function chunk(type, data) {
  const length = Buffer.alloc(4);
  length.writeUInt32BE(data.length);
  const body = Buffer.concat([Buffer.from(type, "ascii"), data]);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(body));
  return Buffer.concat([length, body, crc]);
}

function makePng(width, height) {
  const raw = Buffer.alloc((width * 3 + 1) * height);
  for (let y = 0; y < height; y += 1) {
    const rowStart = y * (width * 3 + 1);
    raw[rowStart] = 0; // filter: none
    for (let x = 0; x < width; x += 1) {
      const offset = rowStart + 1 + x * 3;
      const grid = x % 40 === 0 || y % 40 === 0;
      const box = x > width * 0.25 && x < width * 0.75 && y > height * 0.25 && y < height * 0.75;
      raw[offset] = grid ? 255 : box ? 250 : 30;
      raw[offset + 1] = grid ? 255 : box ? 200 : 90;
      raw[offset + 2] = grid ? 255 : box ? 40 : 200;
    }
  }
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8; // bit depth
  ihdr[9] = 2; // colour type: truecolour
  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk("IHDR", ihdr),
    chunk("IDAT", deflateSync(raw)),
    chunk("IEND", Buffer.alloc(0)),
  ]);
}

writeFileSync("/tmp/test-image.png", makePng(400, 300));
console.log("✓ /tmp/test-image.png (400×300)");

/* ── PDFs ── */
async function makePdf(path, pages) {
  const doc = await PDFDocument.create();
  const font = await doc.embedFont(StandardFonts.Helvetica);
  for (let i = 1; i <= pages; i += 1) {
    const page = doc.addPage([595, 842]);
    page.drawText(`Page ${i} of the pdf-fixture`, { x: 60, y: 760, size: 20, font });
    page.drawRectangle({ x: 60, y: 400, width: 400, height: 200, color: undefined, borderWidth: 1 });
  }
  writeFileSync(path, await doc.save());
  console.log(`✓ ${path} (${pages} pages)`);
}
await makePdf("/tmp/pdf-fixture.pdf", 2);
await makePdf("/tmp/pdf-fixture-3p.pdf", 3);

/* ── JPEG #2: the PNG encoder above only writes PNG, so reuse it as PNG bytes
      under the .jpg name the tests ask for (browsers sniff the magic bytes). ── */
writeFileSync("/tmp/test-image-2.jpg", makePng(640, 480));
console.log("✓ /tmp/test-image-2.jpg (640×480)");

/* ── videos (need ffmpeg on PATH) ── */
function hasFfmpeg() {
  try {
    execFileSync("ffmpeg", ["-version"], { stdio: "ignore" });
    return true;
  } catch {
    return false;
  }
}

if (hasFfmpeg()) {
  execFileSync("ffmpeg", [
    "-y", "-f", "lavfi", "-i", "testsrc=duration=2:size=320x240:rate=15",
    "-f", "lavfi", "-i", "sine=frequency=440:duration=2",
    "-c:v", "libx264", "-pix_fmt", "yuv420p", "-c:a", "aac", "-shortest", "/tmp/audio.mp4",
  ], { stdio: "ignore" });
  execFileSync("ffmpeg", [
    "-y", "-f", "lavfi", "-i", "testsrc=duration=2:size=320x240:rate=15",
    "-c:v", "libx264", "-pix_fmt", "yuv420p", "-an", "/tmp/tiny.mp4",
  ], { stdio: "ignore" });
  console.log("✓ /tmp/audio.mp4 and /tmp/tiny.mp4 (2s each)");
} else {
  console.warn("! ffmpeg not found — video fixtures skipped (install ffmpeg to run the video checks)");
}
