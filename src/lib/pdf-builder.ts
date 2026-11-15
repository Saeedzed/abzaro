/**
 * Persian-capable PDF document builder.
 *
 * Two hard problems, both solved here:
 *
 * 1. **Encoding.** pdf-lib's built-in fonts are WinAnsi-only and throw on «س».
 *    We embed Vazirmatn (SIL OFL) with fontkit, so every Persian character is
 *    available in the output file.
 * 2. **Shape.** PDF has no bidi support: the text has to arrive in *visual* order
 *    already shaped. Rather than re-implement the Arabic joining algorithm, we
 *    let the browser do it — each line is measured with a canvas and the shaped
 *    glyphs are replayed as positioned text runs. That is why this runs in the
 *    browser and not in a server route.
 */

import {
  beginText,
  endText,
  PDFDocument,
  PDFHexString,
  PDFName,
  pushGraphicsState,
  popGraphicsState,
  rgb,
  setFillingRgbColor,
  setFontAndSize,
  setTextMatrix,
  showText,
  type PDFFont,
  type PDFPage,
} from "@cantoo/pdf-lib";
import * as fontkitNs from "fontkit";

import { prepareVisualText } from "@/lib/arabic-shape";

// fontkit 2 ships no type declarations; the surface we use is tiny.
const fontkit = (fontkitNs as { default?: unknown }).default ?? fontkitNs;

interface GlyphLike {
  id: number;
  codePoints: number[];
  advanceWidth: number;
}

interface FontkitFont {
  layout: (text: string) => { glyphs: GlyphLike[] };
  glyphForCodePoint: (codePoint: number) => { id: number; advanceWidth: number } | null;
  unitsPerEm?: number;
}

interface FontkitLike {
  create: (bytes: Uint8Array) => FontkitFont;
}

/**
 * fontkit's Arabic shaper is unusable for Persian output: it substitutes vertical
 * presentation forms (e.g. `uniFBFE.long4` for a final ی) which both breaks the
 * joins and leaves visible gaps. By the time a string reaches the PDF it has
 * already been shaped by `arabic-shape.ts`, so the embedder must map characters to
 * glyphs one-to-one and keep its hands off. This wrapper does exactly that.
 */
function unshapedFontkit(): unknown {
  const base = fontkit as FontkitLike;
  return {
    create(bytes: Uint8Array): FontkitFont {
      const font = base.create(bytes);
      font.layout = (text: string) => ({
        glyphs: [...text].map((char) => {
          const codePoint = char.codePointAt(0) ?? 0;
          const glyph = font.glyphForCodePoint(codePoint);
          return {
            id: glyph?.id ?? 0,
            codePoints: [codePoint],
            advanceWidth: glyph?.advanceWidth ?? 0,
          };
        }),
      });
      return font;
    },
  };
}

export interface DocLine {
  text: string;
  /** 0.6 = small print, 1 = normal, 1.6 = title. */
  scale?: number;
  bold?: boolean;
  /** Extra vertical space before this line, in multiples of the font size. */
  spaceBefore?: number;
  color?: { r: number; g: number; b: number };
}

export interface DocSection {
  heading?: string;
  lines: DocLine[];
}

export interface DocTable {
  headers: string[];
  rows: string[][];
  /** Column widths in relative units (normalised automatically). */
  widths?: number[];
}

export interface DocSpec {
  title: string;
  subtitle?: string;
  sections: DocSection[];
  tables?: DocTable[];
  footer?: string;
  /** A4 by default. */
  pageSize?: [number, number];
}

const A4: [number, number] = [595.28, 841.89];
const MARGIN = 48;

let fontRegistry: Promise<{ regular: Uint8Array; bold: Uint8Array }> | null = null;

/** Load the Vazirmatn TTFs once; they are bundled with the app, not fetched. */
async function loadFonts(): Promise<{ regular: Uint8Array; bold: Uint8Array }> {
  if (!fontRegistry) {
    fontRegistry = (async () => {
      const [regular, bold] = await Promise.all([
        fetch("/fonts/Vazirmatn-Regular.ttf").then((r) => {
          if (!r.ok) throw new Error("فونت فارسی پیدا نشد.");
          return r.arrayBuffer();
        }),
        fetch("/fonts/Vazirmatn-Bold.ttf").then((r) => r.arrayBuffer()),
      ]);
      return { regular: new Uint8Array(regular), bold: new Uint8Array(bold) };
    })();
  }
  return fontRegistry;
}

/**
 * Break a paragraph into lines that fit `maxWidth`.
 *
 * Measurement uses the *same* embedded font that will draw the PDF, so widths are
 * exact. No bidi work is needed: the embedded-font embedder shapes each string
 * with fontkit's Arabic shaper, so text must stay in logical order — reversing it
 * destroys the letter joins (a real bug in the first version of this file: every
 * word came out as disconnected letters).
 */
function breakLines(text: string, fontSize: number, maxWidth: number, font: PDFFont): string[] {
  const lines: string[] = [];
  const width = (value: string) => font.widthOfTextAtSize(prepareVisualText(value), fontSize);
  for (const paragraph of text.split("\n")) {
    if (paragraph.trim() === "") {
      lines.push("");
      continue;
    }
    let current = "";
    for (const word of paragraph.split(/\s+/)) {
      const candidate = current === "" ? word : `${current} ${word}`;
      if (current === "" || width(candidate) <= maxWidth) current = candidate;
      else {
        lines.push(current);
        current = word;
      }
    }
    if (current !== "") lines.push(current);
  }
  return lines;
}

/**
 * Draw one line by writing the text operators directly.
 *
 * `page.drawText` cannot be used: the library reverses the glyph order of any
 * right-to-left run before it emits `Tj`, which flips text that has already been
 * put into visual order (numbers came out as "42/80/5041"). Writing the operators
 * ourselves keeps the glyph order exactly as `arabic-shape.ts` produced it.
 */
function drawLine(
  page: PDFPage,
  font: PDFFont,
  text: string,
  rightEdge: number,
  y: number,
  size: number,
  color = rgb(0.1, 0.1, 0.12),
) {
  if (text === "") return;
  const shaped = prepareVisualText(text);
  if (shaped === "") return;

  const width = font.widthOfTextAtSize(shaped, size);
  const x = rightEdge - width;

  const fontKey: PDFName = page.node.newFontDictionary(font.name, font.ref);
  // Map each character to its glyph id through the embedded font (the embedder
  // does a one-to-one mapping, see `unshapedFontkit`).
  const codes = font
    .encodeText(shaped)
    .toString()
    .replace(/^<|>$/g, "");

  page.pushOperators(
    pushGraphicsState(),
    setFillingRgbColor(color.red, color.green, color.blue),
    beginText(),
    setFontAndSize(fontKey, size),
    setTextMatrix(1, 0, 0, 1, x, y),
    showText(PDFHexString.of(codes)),
    endText(),
    popGraphicsState(),
  );
}

/** Build the PDF and return its bytes. */
export async function buildPdf(spec: DocSpec): Promise<Uint8Array> {
  const doc = await PDFDocument.create();
  doc.registerFontkit(unshapedFontkit() as never);
  const { regular, bold } = await loadFonts();
  // subset: false keeps the whole face so Persian shaping never hits a missing glyph
  const fontRegular = await doc.embedFont(regular, { subset: false });
  const fontBold = await doc.embedFont(bold, { subset: false });

  const [pageWidth, pageHeight] = spec.pageSize ?? A4;
  const contentWidth = pageWidth - MARGIN * 2;

  let page = doc.addPage([pageWidth, pageHeight]);
  let y = pageHeight - MARGIN;

  const newPageIfNeeded = (need: number) => {
    if (y - need < MARGIN + 20) {
      page = doc.addPage([pageWidth, pageHeight]);
      y = pageHeight - MARGIN;
    }
  };

  // ── title block ──
  const titleSize = 20;
  const rightEdge = pageWidth - MARGIN;
  const titleLines = breakLines(spec.title, titleSize, contentWidth, fontBold);
  for (const line of titleLines) {
    newPageIfNeeded(titleSize * 1.6);
    drawLine(page, fontBold, line, rightEdge, y - titleSize, titleSize);
    y -= titleSize * 1.6;
  }
  if (spec.subtitle) {
    const subSize = 11;
    drawLine(page, fontRegular, spec.subtitle, rightEdge, y - subSize, subSize, rgb(0.4, 0.4, 0.45));
    y -= subSize * 2;
  }
  y -= 8;
  page.drawLine({
    start: { x: MARGIN, y },
    end: { x: pageWidth - MARGIN, y },
    thickness: 1,
    color: rgb(0.8, 0.8, 0.82),
  });
  y -= 18;

  // ── sections ──
  for (const section of spec.sections) {
    if (section.heading) {
      const headingSize = 13;
      newPageIfNeeded(headingSize * 3);
      drawLine(page, fontBold, section.heading, rightEdge, y - headingSize, headingSize, rgb(0.05, 0.35, 0.3));
      y -= headingSize * 2.2;
    }
    for (const line of section.lines) {
      const size = 11 * (line.scale ?? 1);
      const bold = line.bold ?? false;
      const font = bold ? fontBold : fontRegular;
      const paragraphs = breakLines(line.text, size, contentWidth, font);
      for (const shaped of paragraphs) {
        const lineHeight = size * 1.75;
        newPageIfNeeded(lineHeight);
        drawLine(
          page,
          font,
          shaped,
          rightEdge,
          y - size,
          size,
          line.color ? rgb(line.color.r, line.color.g, line.color.b) : rgb(0.12, 0.12, 0.15),
        );
        y -= lineHeight;
      }
      if (line.spaceBefore) y -= size * line.spaceBefore;
    }
    y -= 10;
  }

  // ── tables ──
  for (const table of spec.tables ?? []) {
    const fontSize = 10.5;
    const total = (table.widths ?? table.headers.map(() => 1)).reduce((a, b) => a + b, 0);
    const widths = (table.widths ?? table.headers.map(() => 1)).map(
      (w) => (w / total) * contentWidth,
    );
    const rowHeight = fontSize * 2;

    const drawRow = (cells: string[], isHeader: boolean) => {
      newPageIfNeeded(rowHeight);
      let x = pageWidth - MARGIN;
      cells.forEach((cell, index) => {
        const width = widths[index] ?? contentWidth / cells.length;
        x -= width;
        const font = isHeader ? fontBold : fontRegular;
        const fitted = breakLines(cell, fontSize, width - 8, isHeader ? fontBold : fontRegular)[0] ?? "";
        drawLine(page, font, fitted, x + width - 4, y - fontSize * 1.3, fontSize);
      });
      if (isHeader) {
        page.drawLine({
          start: { x: MARGIN, y: y - rowHeight + fontSize * 0.4 },
          end: { x: pageWidth - MARGIN, y: y - rowHeight + fontSize * 0.4 },
          thickness: 0.8,
          color: rgb(0.75, 0.75, 0.78),
        });
      }
      y -= rowHeight;
    };

    drawRow(table.headers, true);
    for (const row of table.rows) drawRow(row, false);
    y -= 12;
  }

  // ── footer ──
  if (spec.footer) {
    const size = 8.5;
    for (const p of doc.getPages()) {
      drawLine(
        p,
        fontRegular,
        spec.footer,
        rightEdge,
        30,
        size,
        rgb(0.55, 0.55, 0.6),
      );
    }
  }

  doc.setTitle(spec.title);
  doc.setProducer("ابزارو — ابزار آنلاین");
  return doc.save({ useObjectStreams: false });
}

/** Trigger a browser download for generated bytes. */
export function downloadPdf(bytes: Uint8Array, filename: string) {
  const blob = new Blob([new Uint8Array(bytes)], { type: "application/pdf" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename.endsWith(".pdf") ? filename : `${filename}.pdf`;
  link.click();
  URL.revokeObjectURL(url);
}
