/**
 * Browser-side PDF rasteriser built on Mozilla's pdf.js.
 *
 * The library and its worker are loaded lazily from the app's own origin, so
 * nothing is fetched from a CDN and the PDF never leaves the visitor's device.
 *
 * SSR note: this module is only ever called from event handlers, but the
 * top-level `import()` is still what keeps pdf.js out of the server bundle.
 */

import type {
  PDFDocumentProxy,
  PDFPageProxy,
  RenderTask,
} from "pdfjs-dist";

/**
 * No hard file-size limit: pdf.js only reads what it renders, so big files that
 * the device can hold in memory are fine. This threshold only triggers a
 * friendly warning (see `PDF_LARGE_BYTES` users), never a rejection.
 */
export const PDF_LARGE_BYTES = 100 * 1024 * 1024; // 100 MB
export const MAX_PAGES = 60;

let pdfjsPromise: Promise<typeof import("pdfjs-dist")> | null = null;

async function getPdfjs() {
  if (!pdfjsPromise) {
    pdfjsPromise = (async () => {
      const pdfjs = await import("pdfjs-dist");
      pdfjs.GlobalWorkerOptions.workerSrc = new URL(
        "pdfjs-dist/build/pdf.worker.min.mjs",
        import.meta.url,
      ).toString();
      return pdfjs;
    })();
  }
  return pdfjsPromise;
}

export interface PdfMeta {
  pageCount: number;
  fileName: string;
  size: number;
  /** e.g. "A4" when every page agrees, otherwise "متغیر". */
  pageSizeHint: string;
}

export interface PdfError {
  message: string;
}

export function isPdfError(value: OpenedPdf | PdfError): value is PdfError {
  return "message" in value;
}

/** Lazily opened document wrapper so the caller controls cleanup. */
export interface OpenedPdf {
  doc: PDFDocumentProxy;
  meta: PdfMeta;
}

function describePageSize(width: number, height: number): string {
  const a4 = { w: 595.28, h: 841.89 };
  const letter = { w: 612, h: 792 };
  const near = (a: number, b: number) => Math.abs(a - b) < 6;
  const isA4 =
    (near(width, a4.w) && near(height, a4.h)) ||
    (near(width, a4.h) && near(height, a4.w));
  const isLetter =
    (near(width, letter.w) && near(height, letter.h)) ||
    (near(width, letter.h) && near(height, letter.w));
  if (isA4) return "A4";
  if (isLetter) return "Letter";
  return "سفارشی";
}

/** Open a PDF file and read its metadata. */
export async function openPdf(file: File): Promise<OpenedPdf | PdfError> {
  if (file.type !== "application/pdf" && !/\.pdf$/i.test(file.name)) {
    return { message: "فقط فایل PDF پذیرفته می‌شود." };
  }
  if (file.size === 0) {
    return { message: "این فایل خالی است." };
  }

  try {
    const pdfjs = await getPdfjs();
    const data = new Uint8Array(await file.arrayBuffer());
    const doc = await pdfjs.getDocument({
      data,
      // Render into a canvas the caller controls — offscreen support keeps
      // pdf.js from needing a DOM canvas internally.
      isOffscreenCanvasSupported: true,
    }).promise;

    const firstPage = await doc.getPage(1);
    const viewport = firstPage.getViewport({ scale: 1 });
    const sizeHint = describePageSize(viewport.width, viewport.height);

    return {
      doc,
      meta: {
        pageCount: doc.numPages,
        fileName: file.name,
        size: file.size,
        pageSizeHint: sizeHint,
      },
    };
  } catch (error) {
    const name = (error as { name?: string })?.name;
    if (name === "PasswordException") {
      return { message: "این PDF رمز عبور دارد. ابتدا رمز را بردارید." };
    }
    if (name === "InvalidPDFException") {
      return { message: "فایل PDF خراب یا ناقص است." };
    }
    return { message: "خواندن این PDF ممکن نشد. فایل دیگری را امتحان کنید." };
  }
}

export interface RasterOptions {
  /** 1 = 72dpi, 2 = 144dpi, 3 = 216dpi. */
  scale: number;
  format: "image/jpeg" | "image/png";
  /** 0–1, only used for JPEG. */
  quality?: number;
  onProgress?: (done: number, total: number) => void;
  /** Abort between pages. */
  shouldStop?: () => boolean;
}

export interface RasterPage {
  pageNumber: number;
  blob: Blob;
  width: number;
  height: number;
}

/**
 * Render the given 1-based pages to JPEG/PNG blobs, in order.
 * Pages are rendered one at a time so memory stays flat on long documents.
 */
export async function rasterisePdf(
  doc: PDFDocumentProxy,
  pages: number[],
  options: RasterOptions,
): Promise<RasterPage[]> {
  const { scale, format, quality = 0.92, onProgress, shouldStop } = options;
  const results: RasterPage[] = [];

  for (const [index, pageNumber] of pages.entries()) {
    if (shouldStop?.()) break;

    let page: PDFPageProxy | null = null;
    let task: RenderTask | null = null;
    try {
      page = await doc.getPage(pageNumber);
      const viewport = page.getViewport({ scale });

      const canvas = document.createElement("canvas");
      canvas.width = Math.max(1, Math.floor(viewport.width));
      canvas.height = Math.max(1, Math.floor(viewport.height));

      const context = canvas.getContext("2d", { alpha: format === "image/png" });
      if (!context) throw new Error("Canvas is not available in this browser.");

      // White paper background — a PDF page is never transparent.
      if (format === "image/jpeg") {
        context.fillStyle = "#ffffff";
        context.fillRect(0, 0, canvas.width, canvas.height);
      }

      task = page.render({ canvas, canvasContext: context, viewport });
      await task.promise;

      const blob = await new Promise<Blob | null>((resolve) => {
        canvas.toBlob(
          resolve,
          format,
          format === "image/png" ? undefined : quality,
        );
      });
      if (!blob) throw new Error("Encoding failed.");

      results.push({
        pageNumber,
        blob,
        width: canvas.width,
        height: canvas.height,
      });
    } finally {
      // Free GPU/canvas memory before the next page.
      canvasCleanup(task);
      page?.cleanup();
      onProgress?.(index + 1, pages.length);
    }
  }

  return results;
}

function canvasCleanup(task: RenderTask | null) {
  try {
    task?.cancel();
  } catch {
    // Already finished — nothing to do.
  }
}

/** Suggested file name for a rasterised page. */
export function pageImageName(
  pdfFileName: string,
  pageNumber: number,
  extension: "jpg" | "png",
  totalPages: number,
): string {
  const base = pdfFileName.replace(/\.[^.]+$/, "") || "page";
  const padded = String(pageNumber).padStart(String(totalPages).length, "0");
  return `${base}-page-${padded}.${extension}`;
}

/**
 * Render the first `maxPages` pages to small JPEG data URLs so tools can show
 * thumbnails (e.g. the page-reorder list). Runs one page at a time and never
 * throws: thumbnails are a nicety, the tool works without them.
 */
export async function renderPdfPreviews(
  bytes: Uint8Array,
  options: { maxWidth?: number; maxPages?: number } = {},
): Promise<string[]> {
  const maxWidth = options.maxWidth ?? 160;
  const maxPages = options.maxPages ?? MAX_PAGES;
  const urls: string[] = [];
  let doc: PDFDocumentProxy | null = null;

  try {
    const pdfjs = await getPdfjs();
    doc = await pdfjs.getDocument({ data: bytes.slice().slice(), isOffscreenCanvasSupported: true }).promise;

    for (let pageNumber = 1; pageNumber <= Math.min(doc.numPages, maxPages); pageNumber += 1) {
      const page = await doc.getPage(pageNumber);
      const base = page.getViewport({ scale: 1 });
      const scale = maxWidth / base.width;
      const viewport = page.getViewport({ scale });

      const canvas = document.createElement("canvas");
      canvas.width = Math.max(1, Math.floor(viewport.width));
      canvas.height = Math.max(1, Math.floor(viewport.height));
      const context = canvas.getContext("2d");
      if (!context) break;
      context.fillStyle = "#ffffff";
      context.fillRect(0, 0, canvas.width, canvas.height);
      await page.render({ canvas, canvasContext: context, viewport }).promise;
      urls.push(canvas.toDataURL("image/jpeg", 0.7));
      page.cleanup();
    }
  } catch {
    return urls;
  } finally {
    try {
      await doc?.destroy();
    } catch {
      // ignore
    }
  }

  return urls;
}
