import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { PDFDocument, StandardFonts } from "@cantoo/pdf-lib";
import fontkit from "@pdf-lib/fontkit";
import { readFileSync } from "node:fs";

import { extractPdfText, reorderLine } from "@/lib/pdf-text";

const VAZIR = readFileSync("node_modules/vazirmatn/fonts/ttf/Vazirmatn-Regular.ttf");

async function makePdf(
  lines: string[],
  options: { persian?: boolean } = {},
): Promise<Uint8Array> {
  const doc = await PDFDocument.create();
  let font;
  if (options.persian) {
    doc.registerFontkit(fontkit as never);
    font = await doc.embedFont(VAZIR, { subset: false });
  } else {
    font = await doc.embedFont(StandardFonts.Helvetica);
  }
  const page = doc.addPage([595, 842]);
  lines.forEach((line, index) => {
    page.drawText(line, { x: 60, y: 760 - index * 30, size: 16, font });
  });
  return doc.save();
}

describe("pdf-text: reorderLine", () => {
  it("leaves a pure Latin line untouched", () => {
    assert.equal(reorderLine(["H", "e", "l", "l", "o"]), "Hello");
  });

  it("reverses a pure RTL glyph run", () => {
    // visual order for «سلام» is م ا ل س
    assert.equal(reorderLine(["م", "ا", "ل", "س"]), "سلام");
  });

  it("restores a number inside an RTL line", () => {
    // stored mirrored: the digits are mirrored too, so one reversal fixes both
    const visual = ["ل", "ا", "ی", "ر", " ", "۰", "۵", "۲", " ", "غ", "ل", "ب", "م"];
    assert.equal(reorderLine(visual), "مبلغ ۲۵۰ ریال");
  });

  it("never splits a ligature token in the middle", () => {
    // lam-alef arrives as ONE token that already expands to two letters; the
    // glyph must stay whole even when the run around it is reversed.
    assert.equal(reorderLine(["لا"]), "لا");
    const out = reorderLine(["م", "لا"]);
    assert.ok(out.includes("لا"), out);
    assert.equal([...out].length, 3);
  });

  it("returns an empty string for no tokens", () => {
    assert.equal(reorderLine([]), "");
  });
});

describe("pdf-text: extraction from generated PDFs", () => {
  it("reads a one-line Latin PDF", async () => {
    const result = await extractPdfText(await makePdf(["Hello world"]));
    assert.equal(result.pages.length, 1);
    assert.equal(result.pages[0]!.text, "Hello world");
    assert.equal(result.lossy, false);
  });

  it("keeps multiple lines separate", async () => {
    const result = await extractPdfText(await makePdf(["First line", "Second line", "Third"]));
    const lines = result.pages[0]!.text.split("\n").filter(Boolean);
    assert.deepEqual(lines, ["First line", "Second line", "Third"]);
  });

  it("reads a Persian PDF (visual order) back to reading order", async () => {
    const result = await extractPdfText(
      await makePdf(["سلام دنیا"], { persian: true }),
    );
    assert.equal(result.pages[0]!.text, "سلام دنیا");
    assert.equal(result.pages[0]!.method, "tounicode");
  });

  it("handles Persian with digits", async () => {
    const result = await extractPdfText(
      await makePdf(["مبلغ ۲۵۰ ریال"], { persian: true }),
    );
    assert.equal(result.pages[0]!.text, "مبلغ ۲۵۰ ریال");
  });

  it("reports the method used per page", async () => {
    const latin = await extractPdfText(await makePdf(["abc"]));
    assert.ok(["winansi", "tounicode", "font-cmap"].includes(latin.pages[0]!.method));
  });

  it("does not reverse Latin when fixRtl is on", async () => {
    const result = await extractPdfText(await makePdf(["Report 1405"]), { fixRtl: true });
    assert.equal(result.pages[0]!.text, "Report 1405");
  });

  it("returns a warning when a page has no text at all", async () => {
    const doc = await PDFDocument.create();
    doc.addPage([595, 842]);
    const result = await extractPdfText(await doc.save());
    assert.equal(result.pages[0]!.text, "");
    assert.ok(result.warnings.some((w) => w.includes("هیچ متنی پیدا نشد")));
  });

  it("never throws on a PDF with an empty page inside a multi-page doc", async () => {
    const doc = await PDFDocument.create();
    const font = await doc.embedFont(StandardFonts.Helvetica);
    doc.addPage([595, 842]).drawText("Page one", { x: 60, y: 700, size: 14, font });
    doc.addPage([595, 842]);
    doc.addPage([595, 842]).drawText("Page three", { x: 60, y: 700, size: 14, font });
    const result = await extractPdfText(await doc.save());
    assert.equal(result.pages.length, 3);
    assert.equal(result.pages[0]!.text, "Page one");
    assert.equal(result.pages[1]!.text, "");
    assert.equal(result.pages[2]!.text, "Page three");
  });
});
