/**
 * PDF page operations that need pdf-lib: reordering pages and stamping page
 * numbers / a text watermark. Both build a NEW document from the source pages
 * (pdf-lib cannot mutate a page order in place).
 */

import { loadPdfLib } from "./pdf-edit";

export interface ArrangeResult {
  bytes: Uint8Array;
  pageCount: number;
}

/** Build a new PDF with pages in `order` (0-based indices). */
export async function reorderPdfPages(
  bytes: Uint8Array,
  order: number[],
): Promise<ArrangeResult> {
  const { PDFDocument } = await loadPdfLib();
  const source = await PDFDocument.load(bytes, { ignoreEncryption: true });
  const target = await PDFDocument.create();
  const valid = order.filter((index) => index >= 0 && index < source.getPageCount());
  const copied = await target.copyPages(source, valid);
  for (const page of copied) target.addPage(page);
  const out = await target.save();
  return { bytes: out, pageCount: target.getPageCount() };
}

export type StampPosition = "bottom-center" | "bottom-right" | "bottom-left" | "top-center";

export interface StampOptions {
  /** Page numbers ("۱ / ۱۰"). */
  pageNumbers?: boolean;
  /** Watermark text; empty = none. */
  watermark?: string;
  position?: StampPosition;
  fontSize?: number;
  /** 0..1 opacity for the watermark. */
  opacity?: number;
  color?: { r: number; g: number; b: number };
}

/**
 * Stamp page numbers and/or a diagonal watermark onto every page.
 * Everything is drawn with the standard Helvetica font, so only text WinAnsi
 * can encode will render — Persian text would need an embedded font (~500 KB
 * extra in the bundle), which we deliberately avoid. The UI says so: the
 * watermark text and the page numbers are Latin/digits only.
 */
export async function stampPdf(
  bytes: Uint8Array,
  options: StampOptions,
): Promise<ArrangeResult> {
  const { PDFDocument, StandardFonts, rgb, degrees } = await loadPdfLib();
  const doc = await PDFDocument.load(bytes, { ignoreEncryption: true });
  const font = await doc.embedFont(StandardFonts.Helvetica);
  const color = options.color ?? { r: 0.45, g: 0.45, b: 0.45 };
  const inkColor = rgb(color.r, color.g, color.b);
  const total = doc.getPageCount();

  if (options.pageNumbers) {
    const size = options.fontSize ?? 10;
    doc.getPages().forEach((page, index) => {
      const { width, height } = page.getSize();
      // Standard Helvetica only encodes WinAnsi, so the label must be Latin
      // digits ("1 / 10"). Persian digits would throw inside pdf-lib.
      const label = `${index + 1} / ${total}`;
      const textWidth = font.widthOfTextAtSize(label, size);
      const position = options.position ?? "bottom-center";
      const margin = 24;
      const x =
        position === "bottom-right"
          ? width - textWidth - margin
          : position === "bottom-left"
            ? margin
            : (width - textWidth) / 2;
      const y = position === "top-center" ? height - margin - size : margin;
      page.drawText(label, { x, y, size, font, color: inkColor, opacity: 0.9 });
    });
  }

  const watermark = (options.watermark ?? "").trim();
  if (watermark) {
    const size = options.fontSize ? options.fontSize * 4 : 56;
    doc.getPages().forEach((page) => {
      const { width, height } = page.getSize();
      const textWidth = font.widthOfTextAtSize(watermark, size);
      // Rotate around the page centre.
      page.drawText(watermark, {
        x: (width - textWidth * 0.75) / 2,
        y: height / 2 - size / 2,
        size,
        font,
        color: inkColor,
        opacity: options.opacity ?? 0.18,
        rotate: degrees(45),
      });
    });
  }

  const out = await doc.save();
  return { bytes: out, pageCount: total };
}

const PERSIAN_DIGITS = "۰۱۲۳۴۵۶۷۸۹";

/** Parse a page order string like "3,1,2" or "3-1-2" into 0-based indices. */
export function parseOrderInput(input: string, pageCount: number): number[] | null {
  const cleaned = input.replace(/[,،\s.-]+/g, " ").trim();
  if (cleaned === "") return null;
  const numbers = cleaned
    .split(" ")
    .map((part) => Number(part.replace(/[۰-۹]/g, (d) => String(PERSIAN_DIGITS.indexOf(d)))))
    .filter((value) => Number.isInteger(value) && value >= 1 && value <= pageCount);
  if (numbers.length === 0) return null;
  return numbers.map((value) => value - 1);
}
