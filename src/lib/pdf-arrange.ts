/**
 * Page-level PDF operations built on pdf-lib: rotate, delete and extract.
 *
 * These are deliberately non-rasterising — pages are copied as-is, so text
 * stays selectable and quality is untouched. The heavy work happens in the
 * visitor's browser; nothing is uploaded.
 */

import { loadPdfLib } from "@/lib/pdf-edit";

export interface PdfInfo {
  pageCount: number;
  name: string;
  bytes: number;
}

export interface PdfOpError {
  error: string;
}

export function isPdfOpError(value: unknown): value is PdfOpError {
  return typeof value === "object" && value !== null && "error" in value;
}

const LOAD_ERROR = "خواندن این PDF ممکن نشد. مطمئن شوید فایل سالم و بدون رمز است.";

/** Read a PDF and report its size. */
export async function inspectPdf(file: File): Promise<PdfInfo | PdfOpError> {
  const { PDFDocument } = await loadPdfLib();
  try {
    const bytes = new Uint8Array(await file.arrayBuffer());
    const doc = await PDFDocument.load(bytes, { ignoreEncryption: true });
    return { pageCount: doc.getPageCount(), name: file.name, bytes: file.size };
  } catch {
    return { error: LOAD_ERROR };
  }
}

/**
 * Rotate pages by 90/180/270 degrees.
 * `pages` is 1-based; an empty list means every page.
 */
export async function rotatePdf(
  file: File,
  angle: 90 | 180 | 270,
  pages: number[] = [],
): Promise<{ blob: Blob; pageCount: number } | PdfOpError> {
  const { PDFDocument, degrees } = await loadPdfLib();
  try {
    const doc = await PDFDocument.load(new Uint8Array(await file.arrayBuffer()), {
      ignoreEncryption: true,
    });
    const targets = pages.length > 0 ? pages : doc.getPageIndices().map((index) => index + 1);

    for (const pageNumber of targets) {
      const page = doc.getPage(pageNumber - 1);
      const current = page.getRotation().angle;
      page.setRotation(degrees((current + angle) % 360));
    }

    const out = await doc.save({ useObjectStreams: true });
    return {
      blob: new Blob([new Uint8Array(out)], { type: "application/pdf" }),
      pageCount: doc.getPageCount(),
    };
  } catch {
    return { error: LOAD_ERROR };
  }
}

/** Remove the given 1-based pages and return the remaining document. */
export async function deletePdfPages(
  file: File,
  pages: number[],
): Promise<{ blob: Blob; pageCount: number } | PdfOpError> {
  const { PDFDocument } = await loadPdfLib();
  try {
    const doc = await PDFDocument.load(new Uint8Array(await file.arrayBuffer()), {
      ignoreEncryption: true,
    });
    const total = doc.getPageCount();
    const keep = doc
      .getPageIndices()
      .map((index) => index + 1)
      .filter((pageNumber) => !pages.includes(pageNumber));

    if (keep.length === 0) {
      return { error: "همهٔ صفحه‌ها انتخاب شده‌اند؛ حداقل یک صفحه باید بماند." };
    }
    if (keep.length === total) {
      return { error: "هیچ صفحه‌ای برای حذف انتخاب نشده است." };
    }

    // Copy the kept pages into a fresh document (pdf-lib cannot delete pages).
    const out = await PDFDocument.create();
    const copied = await out.copyPages(doc, keep.map((pageNumber) => pageNumber - 1));
    copied.forEach((page) => out.addPage(page));

    const bytes = await out.save({ useObjectStreams: true });
    return {
      blob: new Blob([new Uint8Array(bytes)], { type: "application/pdf" }),
      pageCount: out.getPageCount(),
    };
  } catch {
    return { error: LOAD_ERROR };
  }
}

/** Keep only the given 1-based pages (used by the split tool). */
export async function extractPdfPages(
  file: File,
  pages: number[],
): Promise<{ blob: Blob; pageCount: number } | PdfOpError> {
  const { PDFDocument } = await loadPdfLib();
  try {
    const doc = await PDFDocument.load(new Uint8Array(await file.arrayBuffer()), {
      ignoreEncryption: true,
    });
    const total = doc.getPageCount();
    const wanted = pages.filter((pageNumber) => pageNumber >= 1 && pageNumber <= total);
    if (wanted.length === 0) {
      return { error: "بازهٔ صفحهٔ معتبری انتخاب نشده است." };
    }

    const out = await PDFDocument.create();
    const copied = await out.copyPages(doc, wanted.map((pageNumber) => pageNumber - 1));
    copied.forEach((page) => out.addPage(page));

    const bytes = await out.save({ useObjectStreams: true });
    return {
      blob: new Blob([new Uint8Array(bytes)], { type: "application/pdf" }),
      pageCount: out.getPageCount(),
    };
  } catch {
    return { error: LOAD_ERROR };
  }
}
