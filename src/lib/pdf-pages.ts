/**
 * Pure geometry + page-range helpers shared by the two PDF tools.
 *
 * Kept free of DOM/PDF-library imports so it can be unit-tested in Node
 * (see pdf-pages.test.ts).
 */

/** Standard paper sizes in PDF points (1 pt = 1/72 inch). */
export const PAGE_SIZES = {
  a4: { width: 595.28, height: 841.89, label: "A4" },
  letter: { width: 612, height: 792, label: "Letter" },
} as const;

export type PageSizeId = keyof typeof PAGE_SIZES;

export type PageOrientation = "auto" | "portrait" | "landscape";

/**
 * Resolve the page box for a given size + orientation, optionally matching a
 * single image's aspect ratio ("auto" = the page takes the image's shape).
 */
export function pageBox(
  size: PageSizeId,
  orientation: PageOrientation,
  contentAspect?: number,
): { width: number; height: number } {
  const base = PAGE_SIZES[size];
  const shortEdge = Math.min(base.width, base.height);
  const longEdge = Math.max(base.width, base.height);

  if (orientation === "landscape") return { width: longEdge, height: shortEdge };
  if (orientation === "portrait") return { width: shortEdge, height: longEdge };

  // auto — match the image so there are no white bars at all.
  if (contentAspect && Number.isFinite(contentAspect) && contentAspect > 0) {
    return contentAspect >= 1
      ? { width: longEdge, height: longEdge / contentAspect }
      : { width: longEdge * contentAspect, height: longEdge };
  }
  return { width: shortEdge, height: longEdge };
}

/**
 * Fit a content box inside a page box while preserving its aspect ratio.
 * Used so images are never stretched or cropped.
 */
export function fitToPage(
  contentWidth: number,
  contentHeight: number,
  pageWidth: number,
  pageHeight: number,
  margin = 0,
): { width: number; height: number } {
  const availableWidth = Math.max(1, pageWidth - margin * 2);
  const availableHeight = Math.max(1, pageHeight - margin * 2);
  if (contentWidth <= 0 || contentHeight <= 0) {
    return { width: availableWidth, height: availableHeight };
  }
  const scale = Math.min(
    availableWidth / contentWidth,
    availableHeight / contentHeight,
  );
  return {
    width: Math.max(1, contentWidth * scale),
    height: Math.max(1, contentHeight * scale),
  };
}

export interface PageRangeResult {
  pages: number[];
  error: string | null;
}

/**
 * Parse a Persian-friendly page range such as "1-3, 5" and return the
 * 1-based page numbers it selects.
 *
 * - empty / whitespace  → every page
 * - "3"                 → just page 3
 * - "1-4"               → 1,2,3,4
 * - "1-3,7,9-10"        → 1,2,3,7,9,10
 * - "5-3"               → 3,4,5 (reversed ranges are normalised)
 *
 * Out-of-range or unparsable input returns `error` in Persian.
 */
export function parsePageRange(input: string, totalPages: number): PageRangeResult {
  const all = Array.from({ length: Math.max(0, totalPages) }, (_, i) => i + 1);
  const trimmed = input.trim();
  if (!trimmed) return { pages: all, error: null };

  const pages = new Set<number>();
  const chunks = trimmed
    .replace(/[,،؛\s]+/g, " ")
    .split(" ")
    .filter(Boolean);

  for (const chunk of chunks) {
    const match = /^(\d+)(?:\s*[-–]\s*(\d+))?$/.exec(chunk);
    if (!match) {
      return { pages: [], error: "شمارهٔ صفحه‌ها را مثل «۱-۳، ۵» وارد کنید." };
    }
    const start = Number(match[1]);
    const end = match[2] ? Number(match[2]) : start;
    if (start < 1 || end < 1) {
      return { pages: [], error: "شمارهٔ صفحه نمی‌تواند صفر یا منفی باشد." };
    }
    if (start > totalPages || end > totalPages) {
      return {
        pages: [],
        error: `این فایل ${totalPages} صفحه دارد؛ شمارهٔ بزرگ‌تری وارد کرده‌اید.`,
      };
    }
    for (let page = Math.min(start, end); page <= Math.max(start, end); page += 1) {
      pages.add(page);
    }
  }

  return {
    pages: [...pages].sort((a, b) => a - b),
    error: null,
  };
}

/** Sanitise a user-supplied filename for use in a download. */
export function baseFileName(name: string, fallback = "file"): string {
  const withoutExtension = name.replace(/\.[^./\\]+$/, "");
  const cleaned = withoutExtension
    .replace(/[\\/:*?"<>|]+/g, "-")
    .replace(/\s+/g, "-")
    .slice(0, 60)
    .trim();
  return cleaned || fallback;
}

/** JPEG quality used when rasterising a PDF page. */
export const PDF_RENDER_SCALES = [
  { value: 1, label: "عادی (۱×)", dpi: 72 },
  { value: 2, label: "مطلوب (۲×)", dpi: 144 },
  { value: 3, label: "کیفیت بالا (۳×)", dpi: 216 },
] as const;
