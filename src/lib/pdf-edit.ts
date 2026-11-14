/**
 * PDF editing helpers — merge and re-save (compress).
 *
 * `mergePdfs` and `resavePdf` are pure enough to run in Node, so they are
 * unit-tested in pdf-edit.test.ts. Rasterising compression is browser-only and
 * lives in the component (it needs a canvas).
 */

type PdfLib = typeof import("pdf-lib");

/**
 * pdf-lib is ~380 KB. Loading it lazily keeps it out of the shared chunk that
 * every page (including text-only tools) would otherwise download, and the
 * module promise is cached so repeated calls reuse the same instance.
 */
let pdfLibPromise: Promise<PdfLib> | null = null;

export function loadPdfLib(): Promise<PdfLib> {
  if (!pdfLibPromise) pdfLibPromise = import("pdf-lib");
  return pdfLibPromise;
}

export interface MergeInput {
  name: string;
  bytes: Uint8Array;
}

export interface MergeResult {
  bytes: Uint8Array;
  pageCount: number;
  /** Per-file page counts, in the order they were merged. */
  sources: Array<{ name: string; pages: number }>;
  error: string | null;
}

/** Merge several PDFs into one, preserving order. Returns a Persian error on failure. */
export async function mergePdfs(inputs: MergeInput[]): Promise<MergeResult> {
  const { PDFDocument } = await loadPdfLib();
  const empty: MergeResult = { bytes: new Uint8Array(), pageCount: 0, sources: [], error: null };
  if (inputs.length === 0) return { ...empty, error: "هیچ فایلی برای ادغام انتخاب نشده است." };

  try {
    const output = await PDFDocument.create();
    output.setProducer("Abzaro");
    output.setCreator("ابزارو — abzaro.netlify.app");
    const sources: MergeResult["sources"] = [];

    for (const input of inputs) {
      const source = await PDFDocument.load(input.bytes, { ignoreEncryption: true });
      const count = source.getPageCount();
      const pages = await output.copyPages(source, source.getPageIndices());
      for (const page of pages) output.addPage(page);
      sources.push({ name: input.name, pages: count });
    }

    const bytes = await output.save({ useObjectStreams: true });
    return {
      bytes,
      pageCount: output.getPageCount(),
      sources,
      error: null,
    };
  } catch (error) {
    const name = (error as { name?: string })?.name;
    if (name === "EncryptedPDFError") {
      return { ...empty, error: "یکی از فایل‌ها رمز عبور دارد؛ ابتدا رمز را بردارید." };
    }
    return { ...empty, error: "ادغام فایل‌ها ممکن نشد. یکی از PDF‌ها خراب است." };
  }
}

/** Load a PDF and drop its metadata + trailing bytes. */
export async function resavePdf(bytes: Uint8Array): Promise<{
  bytes: Uint8Array;
  pageCount: number;
  error: string | null;
}> {
  const { PDFDocument } = await loadPdfLib();
  try {
    const doc = await PDFDocument.load(bytes, { ignoreEncryption: true, updateMetadata: false });
    doc.setTitle("");
    doc.setAuthor("");
    doc.setSubject("");
    doc.setKeywords([]);
    doc.setProducer("Abzaro");
    doc.setCreator("ابزارو — abzaro.netlify.app");
    const out = await doc.save({ useObjectStreams: true, addDefaultPage: false });
    return { bytes: out, pageCount: doc.getPageCount(), error: null };
  } catch {
    return {
      bytes: new Uint8Array(),
      pageCount: 0,
      error: "خواندن این PDF ممکن نشد.",
    };
  }
}

/** Compression presets for the rasterising mode. */
export const PDF_COMPRESS_PRESETS = [
  { id: "high", label: "کیفیت بالا", scale: 2, quality: 0.85, hint: "مناسب آرشیو" },
  { id: "balanced", label: "متعادل", scale: 1.5, quality: 0.7, hint: "پیشنهادی" },
  { id: "small", label: "کم‌حجم", scale: 1, quality: 0.55, hint: "مناسب ایمیل" },
] as const;

export type PdfCompressMode = "lossless" | "raster";
