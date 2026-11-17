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
  photo?: Uint8Array;
  sidebar?: DocSection[];
  letterInfo?: { from: string; to: string; number: string; date: string; attachment: string; signer: string };
  sections: DocSection[];
  tables?: DocTable[];
  footer?: string;
  /** Content below the item table, e.g. invoice totals and notes. */
  afterTables?: DocSection[];
  signatures?: string[];
  variant?: "invoice" | "resume" | "lease" | "experience" | "letter";
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
      if (width(candidate) <= maxWidth) { current = candidate; continue; }
      if (current) { lines.push(current); current = ""; }
      // Split exceptionally long unbroken URLs / descriptions instead of clipping.
      for (const char of Array.from(word)) {
        if (current && width(current + char) > maxWidth) { lines.push(current); current = char; }
        else current += char;
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

  const navy = rgb(0.10, 0.16, 0.25);
  const muted = rgb(0.32, 0.38, 0.46);
  const blue = rgb(0.15, 0.34, 0.60);
  const pale = rgb(0.94, 0.96, 0.98);
  const border = rgb(0.83, 0.87, 0.91);
  const rightEdge = pageWidth - MARGIN;
  let page = doc.addPage([pageWidth, pageHeight]);
  let y = pageHeight - MARGIN;

  const newPageIfNeeded = (need: number): boolean => {
    if (y - need >= MARGIN + 25) return false;
    page = doc.addPage([pageWidth, pageHeight]);
    y = pageHeight - MARGIN;
    return true;
  };
  const rule = (at: number, color = border, thickness = 0.6) => page.drawLine({
    start: { x: MARGIN, y: at }, end: { x: rightEdge, y: at }, thickness, color,
  });

  if (spec.variant === "resume") {
    const sidebarWidth = 180;
    const mainRight = rightEdge;
    const mainWidth = contentWidth - sidebarWidth - 24;
    const sideRight = MARGIN + sidebarWidth - 14;
    const pages: PDFPage[] = [page];
    const getPage = (index: number) => {
      while (pages.length <= index) pages.push(doc.addPage([pageWidth, pageHeight]));
      return pages[index]!;
    };
    // Each column paginates independently; continuation pages keep the same grid.
    const renderColumn = (sections: DocSection[], right: number, width: number, startY: number) => {
      let index = 0, cursor = startY;
      const ensure = (height: number) => { if (cursor - height < MARGIN + 25) { index++; cursor = pageHeight - MARGIN; } };
      for (const section of sections) {
        if (section.heading) {
          const headingLines = breakLines(section.heading, 12, width, fontBold);
          for (const line of headingLines) { ensure(40); drawLine(getPage(index), fontBold, line, right, cursor - 12, 12, blue); cursor -= 22; }
          getPage(index).drawLine({ start: { x: right - width, y: cursor + 3 }, end: { x: right, y: cursor + 3 }, thickness: 0.5, color: border });
          cursor -= 7;
        }
        for (const item of section.lines) {
          const size = 10.5 * (item.scale ?? 1), font = item.bold ? fontBold : fontRegular;
          for (const line of breakLines(item.text, size, width, font)) {
            ensure(19); drawLine(getPage(index), font, line, right, cursor - size, size, navy); cursor -= 19;
          }
        }
        cursor -= 15;
      }
    };
    let headerY = pageHeight - 58;
    const photo = spec.photo ? await doc.embedPng(spec.photo) : null;
    if (photo) page.drawImage(photo, { x: MARGIN + 36, y: pageHeight - 150, width: 100, height: 100 });
    for (const line of breakLines(spec.title, 22, mainWidth, fontBold)) { if (headerY < pageHeight - 145) break; drawLine(page, fontBold, line, mainRight, headerY - 22, 22, navy); headerY -= 32; }
    for (const line of breakLines(spec.subtitle ?? "", 11, mainWidth, fontRegular)) { if (headerY < pageHeight - 145) break; drawLine(page, fontRegular, line, mainRight, headerY - 11, 11, muted); headerY -= 20; }
    // Extremely long names and titles are rendered in full in the main column.
    const titleLines = breakLines(spec.title, 22, mainWidth, fontBold);
    const subtitleLines = breakLines(spec.subtitle ?? "", 11, mainWidth, fontRegular);
    const overflow: DocSection[] = [];
    if (titleLines.length > 3 || subtitleLines.length > Math.max(0, Math.floor((87 - titleLines.length * 32) / 20) + 1)) overflow.push({ heading: "مشخصات", lines: [{ text: spec.title }, ...(spec.subtitle ? [{ text: spec.subtitle }] : [])] });
    const start = pageHeight - 180;
    renderColumn(spec.sidebar ?? [], sideRight, sidebarWidth - 28, start);
    renderColumn([...overflow, ...spec.sections], mainRight, mainWidth, start);
    for (const p of pages) {
      p.drawLine({ start: { x: MARGIN + sidebarWidth, y: MARGIN }, end: { x: MARGIN + sidebarWidth, y: pageHeight - 170 }, thickness: 0.7, color: border });
      if (spec.footer) for (const [i, line] of breakLines(spec.footer, 8, contentWidth, fontRegular).slice(0, 2).entries()) drawLine(p, fontRegular, line, rightEdge, 25 - i * 10, 8, muted);
    }
    doc.setTitle(spec.title); doc.setProducer("ابزارو — ابزار آنلاین");
    return doc.save({ useObjectStreams: false });
  }

  if (spec.variant === "letter" && spec.letterInfo) {
    const info = spec.letterInfo;
    const decorate = (p: PDFPage) => {
      p.drawRectangle({ x: MARGIN - 15, y: MARGIN, width: 3, height: pageHeight - MARGIN * 2, color: blue });
    };
    decorate(page);
    const write = (text: string, right: number, width: number, size = 11, bold = false) => {
      const font = bold ? fontBold : fontRegular;
      for (const line of breakLines(text, size, width, font)) {
        if (y - 22 < MARGIN + 25) { page = doc.addPage([pageWidth, pageHeight]); decorate(page); y = pageHeight - 170; }
        drawLine(page, font, line, right, y - size, size, navy); y -= 21;
      }
    };
    // Header columns have independent text wrapping, without truncating long values.
    y = pageHeight - 55;
    write(info.from, rightEdge, contentWidth * 0.52, 15, true);
    for (const text of [`شماره: ${info.number || "—"}`, `تاریخ: ${info.date || "—"}`, `پیوست: ${info.attachment || "—"}`]) write(text, MARGIN + contentWidth * 0.43, contentWidth * 0.43, 10);
    page.drawLine({ start: { x: MARGIN, y: y - 5 }, end: { x: rightEdge, y: y - 5 }, thickness: 1, color: blue });
    y -= 30;
    write(`گیرنده: ${info.to}`, rightEdge, contentWidth, 11, true);
    write(`موضوع: ${spec.title}`, rightEdge, contentWidth, 11, true);
    y -= 16;
    for (const section of spec.sections) for (const item of section.lines) write(item.text, rightEdge, contentWidth);
    y -= 24;
    write("با احترام", rightEdge - contentWidth * 0.55, contentWidth * 0.45, 11, true);
    if (info.signer) write(info.signer, rightEdge - contentWidth * 0.55, contentWidth * 0.45, 11, true);
    write("محل امضا", rightEdge - contentWidth * 0.55, contentWidth * 0.45, 10);
    doc.setTitle(spec.title); doc.setProducer("ابزارو — ابزار آنلاین");
    return doc.save({ useObjectStreams: false });
  }

  // An understated ink-saving identity: one accent bar, clear typography and
  // plenty of white space. No stock logos, fake signatures or certificates.
  page.drawRectangle({ x: MARGIN, y: pageHeight - 29, width: contentWidth, height: 3, color: blue });
  const titleSize = 20;
  for (const line of breakLines(spec.title, titleSize, contentWidth, fontBold)) {
    newPageIfNeeded(titleSize * 1.5);
    drawLine(page, fontBold, line, rightEdge, y - titleSize, titleSize, navy);
    y -= titleSize * 1.55;
  }
  if (spec.subtitle) {
    for (const line of breakLines(spec.subtitle, 10, contentWidth, fontRegular)) {
      newPageIfNeeded(18);
      drawLine(page, fontRegular, line, rightEdge, y - 10, 10, muted);
      y -= 18;
    }
  }
  y -= 5; rule(y); y -= 18;

  const renderSections = (sections: DocSection[]) => {
    for (const section of sections) {
      if (section.heading) {
        newPageIfNeeded(56);
        const headingSize = 12;
        drawLine(page, fontBold, section.heading, rightEdge, y - headingSize, headingSize, blue);
        y -= 21;
        rule(y + 2, border, 0.45);
        y -= 7;
      }
      for (const line of section.lines) {
        const size = 11 * (line.scale ?? 1);
        const font = line.bold ? fontBold : fontRegular;
        if (line.spaceBefore) y -= size * line.spaceBefore;
        for (const text of breakLines(line.text, size, contentWidth, font)) {
          const lineHeight = size * 1.8;
          newPageIfNeeded(lineHeight);
          drawLine(page, font, text, rightEdge, y - size, size,
            line.color ? rgb(line.color.r, line.color.g, line.color.b) : navy);
          y -= lineHeight;
        }
      }
      y -= 12;
    }
  };
  renderSections(spec.sections);

  // Table cells wrap and split across pages rather than silently losing text.
  for (const table of spec.tables ?? []) {
    const fontSize = 10;
    const units = table.widths ?? table.headers.map(() => 1);
    const total = units.reduce((a, b) => a + b, 0);
    const widths = units.map((w) => (w / total) * contentWidth);
    const lineHeight = 16;
    const drawSegment = (cells: string[][], start: number, count: number, header: boolean, alternate: boolean) => {
      const height = count * lineHeight + 12;
      if (header || alternate) page.drawRectangle({ x: MARGIN, y: y - height, width: contentWidth, height, color: header ? blue : pale });
      let right = rightEdge;
      widths.forEach((width, index) => {
        const lines = cells[index] ?? [];
        for (let i = 0; i < count; i++) drawLine(page, header ? fontBold : fontRegular,
          lines[start + i] ?? "", right - 6, y - 7 - fontSize - i * lineHeight, fontSize,
          header ? rgb(1, 1, 1) : navy);
        right -= width;
      });
      y -= height; rule(y, border, 0.45);
    };
    const cellsFor = (row: string[], header: boolean) => widths.map((width, index) =>
      breakLines(row[index] ?? "", fontSize, Math.max(20, width - 12), header ? fontBold : fontRegular));
    const headerCells = cellsFor(table.headers, true);
    const headerCount = Math.max(1, ...headerCells.map(c => c.length));
    const renderHeader = () => drawSegment(headerCells, 0, headerCount, true, false);
    newPageIfNeeded(headerCount * lineHeight + 70); renderHeader();
    table.rows.forEach((row, rowIndex) => {
      const cells = cellsFor(row, false);
      const count = Math.max(1, ...cells.map(c => c.length));
      let done = 0;
      while (done < count) {
        if (y - (lineHeight + 12) < MARGIN + 25) {
          newPageIfNeeded(lineHeight + 12); renderHeader();
        }
        const capacity = Math.max(1, Math.floor((y - (MARGIN + 25) - 12) / lineHeight));
        const take = Math.min(count - done, capacity);
        drawSegment(cells, done, take, false, rowIndex % 2 === 0);
        done += take;
      }
    });
    y -= 20;
  }
  renderSections(spec.afterTables ?? []);

  if (spec.signatures?.length) {
    newPageIfNeeded(80);
    y -= 8;
    const columns = spec.signatures.length;
    spec.signatures.forEach((label, index) => {
      const width = contentWidth / columns;
      const right = rightEdge - index * width - 12;
      drawLine(page, fontBold, label, right, y - 10, 10, muted);
      page.drawLine({ start: { x: right - width + 30, y: y - 46 }, end: { x: right, y: y - 46 }, thickness: 0.6, color: border });
    });
    y -= 66;
  }

  // A small, understated footer is drawn on each page. Long text wraps.
  if (spec.footer) {
    for (const p of doc.getPages()) {
      const footerLines = breakLines(spec.footer, 8, contentWidth - 28, fontRegular).slice(0, 2);
      footerLines.forEach((line, i) => drawLine(p, fontRegular, line, rightEdge, 27 - i * 10, 8, muted));
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
