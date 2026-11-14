import { test } from "node:test";
import assert from "node:assert/strict";
import { PDFDocument, StandardFonts } from "pdf-lib";
import { describeMerge, mergePdfs, resavePdf } from "./pdf-edit";

/** Build an in-memory PDF with `pages` pages and some text. */
async function makePdf(pages: number, label = "page"): Promise<Uint8Array> {
  const doc = await PDFDocument.create();
  const font = await doc.embedFont(StandardFonts.Helvetica);
  for (let i = 0; i < pages; i += 1) {
    const page = doc.addPage([300, 400]);
    page.drawText(`${label} ${i + 1}`, { x: 20, y: 300, size: 18, font });
  }
  return doc.save();
}

test("mergePdfs: page count is the sum of the inputs", async () => {
  const a = await makePdf(2, "a");
  const b = await makePdf(3, "b");
  const result = await mergePdfs([
    { name: "a.pdf", bytes: a },
    { name: "b.pdf", bytes: b },
  ]);
  assert.equal(result.error, null);
  assert.equal(result.pageCount, 5);
  assert.deepEqual(result.sources, [
    { name: "a.pdf", pages: 2 },
    { name: "b.pdf", pages: 3 },
  ]);

  const merged = await PDFDocument.load(result.bytes);
  assert.equal(merged.getPageCount(), 5);
  assert.deepEqual(merged.getPage(0).getSize(), { width: 300, height: 400 });
});

test("mergePdfs: single input still works", async () => {
  const a = await makePdf(1);
  const result = await mergePdfs([{ name: "one.pdf", bytes: a }]);
  assert.equal(result.pageCount, 1);
  assert.equal(result.error, null);
});

test("mergePdfs: preserves the given order", async () => {
  const first = await makePdf(1, "first");
  const second = await makePdf(1, "second");
  const result = await mergePdfs([
    { name: "2.pdf", bytes: second },
    { name: "1.pdf", bytes: first },
  ]);
  assert.deepEqual(
    result.sources.map((source) => source.name),
    ["2.pdf", "1.pdf"],
  );
});

test("mergePdfs: rejects an empty list and corrupt input", async () => {
  const empty = await mergePdfs([]);
  assert.notEqual(empty.error, null);
  assert.equal(empty.pageCount, 0);

  const corrupt = await mergePdfs([
    { name: "bad.pdf", bytes: new Uint8Array([1, 2, 3, 4, 5]) },
  ]);
  assert.notEqual(corrupt.error, null);
  assert.match(corrupt.error ?? "", /[\u0600-\u06FF]/);
});

test("resavePdf: strips metadata and keeps every page", async () => {
  const doc = await PDFDocument.create();
  doc.setTitle("Secret Title");
  doc.setAuthor("Someone");
  for (let i = 0; i < 3; i += 1) doc.addPage([200, 200]);
  const original = await doc.save();

  const result = await resavePdf(original);
  assert.equal(result.error, null);
  assert.equal(result.pageCount, 3);

  const reloaded = await PDFDocument.load(result.bytes);
  assert.equal(reloaded.getPageCount(), 3);
  assert.notEqual(reloaded.getTitle(), "Secret Title");
});

test("resavePdf: reports a Persian error for junk input", async () => {
  const result = await resavePdf(new Uint8Array([37, 80, 68, 70])); // "%PDF" with nothing after
  assert.notEqual(result.error, null);
  assert.match(result.error ?? "", /[\u0600-\u06FF]/);
});

test("describeMerge summarises the selection", () => {
  assert.equal(describeMerge([]), "");
  assert.equal(
    describeMerge([
      { name: "a", pages: 2 },
      { name: "b", pages: 4 },
    ]),
    "2 فایل · 6 صفحه",
  );
});
