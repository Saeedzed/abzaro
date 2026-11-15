"use client";

import { useEffect, useRef, useState } from "react";
import {
  Download,
  FileImage,
  FileText,
  Loader2,
  RotateCcw,
  Upload,
} from "lucide-react";
import { formatBytes } from "@/lib/image";
import { parsePageRange, baseFileName } from "@/lib/pdf-pages";
import {
  isPdfError,
  MAX_PAGES,
  openPdf,
  pageImageName,
  rasterisePdf,
  type OpenedPdf,
  type RasterPage,
} from "@/lib/pdf-raster";
import { toPersianDigits } from "@/lib/persian";
import { cn } from "@/lib/utils";

const SCALES = [
  { value: 1, label: "عادی", hint: "۷۲ dpi — کم‌حجم" },
  { value: 2, label: "مطلوب", hint: "۱۴۴ dpi — پیشنهادی" },
  { value: 3, label: "کیفیت بالا", hint: "۲۱۶ dpi — چاپ" },
] as const;

const FORMATS = [
  { value: "image/jpeg" as const, label: "JPG", hint: "حجم کم، مناسب سایت" },
  { value: "image/png" as const, label: "PNG", hint: "بدون افت کیفیت" },
];

interface Rendered extends RasterPage {
  /** Object URL, revoked on unmount / reset. */
  url: string;
}

/**
 * PDF → images.
 *
 * Every page is rasterised in the browser with pdf.js and offered as a JPG or
 * PNG download (or one ZIP). No file ever leaves the device.
 */
export function PdfToImage() {
  const [pdf, setPdf] = useState<OpenedPdf | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [range, setRange] = useState("");
  const [scale, setScale] = useState<number>(2);
  const [format, setFormat] = useState<"image/jpeg" | "image/png">("image/jpeg");
  const [busy, setBusy] = useState(false);
  const [progress, setProgress] = useState({ done: 0, total: 0 });
  const [pages, setPages] = useState<Rendered[]>([]);
  const [zipBusy, setZipBusy] = useState(false);
  const [dragging, setDragging] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const pdfRef = useRef<OpenedPdf | null>(null);

  // Revoke page previews when they are replaced or the tool unmounts.
  useEffect(() => {
    return () => {
      pages.forEach((page) => URL.revokeObjectURL(page.url));
    };
  }, [pages]);

  useEffect(() => {
    return () => {
      void pdfRef.current?.doc.destroy();
    };
  }, []);

  function clearPages() {
    setPages((current) => {
      current.forEach((page) => URL.revokeObjectURL(page.url));
      return [];
    });
  }

  async function handleFile(file: File | undefined) {
    if (!file) return;
    setError(null);
    clearPages();
    setRange("");
    await pdfRef.current?.doc.destroy();
    pdfRef.current = null;
    setPdf(null);

    const opened = await openPdf(file);
    if (isPdfError(opened)) {
      setError(opened.message);
      return;
    }
    pdfRef.current = opened;
    setPdf(opened);

    if (opened.meta.pageCount > MAX_PAGES) {
      setError(
        `این PDF ${toPersianDigits(opened.meta.pageCount)} صفحه دارد؛ برای حفظ سرعت، حداکثر ${toPersianDigits(
          MAX_PAGES,
        )} صفحه پشتیبانی می‌شود. بازهٔ صفحه‌ها را وارد کنید.`,
      );
    }
  }

  function reset() {
    clearPages();
    void pdfRef.current?.doc.destroy();
    pdfRef.current = null;
    setPdf(null);
    setError(null);
    setRange("");
    setProgress({ done: 0, total: 0 });
    if (inputRef.current) inputRef.current.value = "";
  }

  async function handleRender() {
    if (!pdf) return;
    const parsed = parsePageRange(range, pdf.meta.pageCount);
    if (parsed.error) {
      setError(parsed.error);
      return;
    }
    if (parsed.pages.length > MAX_PAGES) {
      setError(
        `حداکثر ${toPersianDigits(MAX_PAGES)} صفحه در هر نوبت قابل تبدیل است.`,
      );
      return;
    }

    setError(null);
    clearPages();
    setBusy(true);
    setProgress({ done: 0, total: parsed.pages.length });

    try {
      const rendered = await rasterisePdf(pdf.doc, parsed.pages, {
        scale,
        format,
        onProgress: (done, total) => setProgress({ done, total }),
      });

      setPages(
        rendered.map((page) => ({
          ...page,
          url: URL.createObjectURL(page.blob),
        })),
      );
    } catch {
      setError("تبدیل صفحه‌ها ممکن نشد. فایل یا تنظیمات دیگری را امتحان کنید.");
    } finally {
      setBusy(false);
    }
  }

  async function handleDownloadAll() {
    if (!pdf || pages.length === 0) return;
    setZipBusy(true);
    try {
      const { default: JSZip } = await import("jszip");
      const zip = new JSZip();
      const extension = format === "image/png" ? "png" : "jpg";
      for (const page of pages) {
        zip.file(
          pageImageName(pdf.meta.fileName, page.pageNumber, extension, pdf.meta.pageCount),
          page.blob,
        );
      }
      const blob = await zip.generateAsync({ type: "blob" });
      const { downloadBlob } = await import("@/lib/image");
      downloadBlob(blob, `${baseFileName(pdf.meta.fileName, "pdf")}-pages.zip`);
    } catch {
      setError("ساخت فایل ZIP ممکن نشد.");
    } finally {
      setZipBusy(false);
    }
  }

  async function handleDownloadOne(page: Rendered) {
    if (!pdf) return;
    const { downloadBlob } = await import("@/lib/image");
    downloadBlob(
      page.blob,
      pageImageName(
        pdf.meta.fileName,
        page.pageNumber,
        format === "image/png" ? "png" : "jpg",
        pdf.meta.pageCount,
      ),
    );
  }

  if (!pdf) {
    return (
      <div>
        <div
          onDragOver={(event) => {
            event.preventDefault();
            setDragging(true);
          }}
          onDragLeave={() => setDragging(false)}
          onDrop={(event) => {
            event.preventDefault();
            setDragging(false);
            void handleFile(event.dataTransfer.files[0]);
          }}
          className={cn(
            "rounded-2xl border-2 border-dashed p-8 text-center transition",
            dragging
              ? "border-brand-400 bg-brand-50"
              : "border-ink-200 bg-white hover:border-brand-300",
          )}
        >
          <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-brand-50 text-brand-600">
            <Upload className="h-7 w-7" aria-hidden="true" />
          </span>
          <p className="mt-4 text-base font-bold text-ink-900">
            فایل PDF را اینجا رها کنید
          </p>
          <p className="mt-1 text-sm text-ink-500">
            یا از دکمهٔ زیر انتخاب کنید — بدون محدودیت حجم
          </p>
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            className="mt-4 inline-flex items-center gap-2 rounded-lg bg-brand-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-brand-700"
          >
            <FileText className="h-4 w-4" aria-hidden="true" />
            انتخاب فایل PDF
          </button>
          <input
            ref={inputRef}
            type="file"
            accept="application/pdf,.pdf"
            onChange={(event) => void handleFile(event.target.files?.[0])}
            className="sr-only"
            aria-label="انتخاب فایل PDF"
            data-testid="pdf-to-image-input"
          />
          {error && (
            <p role="alert" className="mt-4 text-sm font-medium text-red-600">
              {error}
            </p>
          )}
        </div>
        <p className="mt-4 text-xs leading-6 text-ink-400">
          فایل شما هرگز آپلود نمی‌شود؛ تبدیل صفحه‌ها کاملاً داخل مرورگر انجام
          می‌شود.
        </p>
      </div>
    );
  }

  const total = pdf.meta.pageCount;
  const selected = parsePageRange(range, total);

  return (
    <div>
      <div className="rounded-2xl border border-ink-200 bg-white p-4 shadow-card sm:p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex min-w-0 items-center gap-3">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-red-50 text-red-600">
              <FileText className="h-5 w-5" aria-hidden="true" />
            </span>
            <div className="min-w-0">
              <p className="truncate text-sm font-bold text-ink-900" data-testid="pdf-file-name">
                {pdf.meta.fileName}
              </p>
              <p className="mt-0.5 text-xs text-ink-500">
                {toPersianDigits(total)} صفحه · {pdf.meta.pageSizeHint} ·{" "}
                {formatBytes(pdf.meta.size)}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={reset}
            className="inline-flex items-center gap-2 rounded-lg border border-ink-200 px-3 py-2 text-xs font-semibold text-ink-700 transition hover:bg-ink-100"
          >
            <RotateCcw className="h-3.5 w-3.5" aria-hidden="true" />
            فایل دیگر
          </button>
        </div>
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-2">
        <div className="rounded-2xl border border-ink-200 bg-white p-4 shadow-card sm:p-5">
          <h3 className="flex items-center gap-2 text-sm font-bold text-ink-900">
            <FileImage className="h-4 w-4 text-brand-600" aria-hidden="true" />
            تنظیمات تبدیل
          </h3>

          <div className="mt-4">
            <label
              htmlFor="pdf-page-range"
              className="mb-1.5 block text-xs font-semibold text-ink-700"
            >
              صفحه‌ها
            </label>
            <input
              id="pdf-page-range"
              dir="ltr"
              value={range}
              onChange={(event) => setRange(event.target.value)}
              placeholder="همهٔ صفحه‌ها — مثلاً 1-3, 5"
              className="w-full rounded-xl border border-ink-200 bg-white px-3 py-2.5 text-sm text-ink-900 outline-none transition placeholder:text-ink-300 focus:border-brand-400 focus:ring-4 focus:ring-brand-100"
              data-testid="pdf-page-range"
            />
            <p className="mt-1.5 text-[11px] leading-5 text-ink-400">
              {range.trim()
                ? selected.error
                  ? selected.error
                  : `${toPersianDigits(selected.pages.length)} صفحه انتخاب شده`
                : `خالی بگذارید تا هر ${toPersianDigits(total)} صفحه تبدیل شود`}
            </p>
          </div>

          <fieldset className="mt-4">
            <legend className="mb-1.5 text-xs font-semibold text-ink-700">
              کیفیت (DPI)
            </legend>
            <div className="flex gap-2">
              {SCALES.map((item) => (
                <button
                  key={item.value}
                  type="button"
                  onClick={() => {
                    setScale(item.value);
                    clearPages();
                  }}
                  aria-pressed={scale === item.value}
                  className={cn(
                    "flex-1 rounded-lg border px-2 py-2 text-xs font-semibold transition",
                    scale === item.value
                      ? "border-brand-300 bg-brand-50 text-brand-700"
                      : "border-ink-200 text-ink-600 hover:bg-ink-100",
                  )}
                >
                  {item.label}
                  <span className="mt-0.5 block text-[10px] font-normal opacity-70">
                    {item.hint}
                  </span>
                </button>
              ))}
            </div>
          </fieldset>

          <fieldset className="mt-4">
            <legend className="mb-1.5 text-xs font-semibold text-ink-700">
              قالب خروجی
            </legend>
            <div className="flex gap-2">
              {FORMATS.map((item) => (
                <button
                  key={item.value}
                  type="button"
                  onClick={() => {
                    setFormat(item.value);
                    clearPages();
                  }}
                  aria-pressed={format === item.value}
                  className={cn(
                    "flex-1 rounded-lg border px-3 py-2 text-xs font-semibold transition",
                    format === item.value
                      ? "border-brand-300 bg-brand-50 text-brand-700"
                      : "border-ink-200 text-ink-600 hover:bg-ink-100",
                  )}
                >
                  {item.label}
                  <span className="mt-0.5 block text-[10px] font-normal opacity-70">
                    {item.hint}
                  </span>
                </button>
              ))}
            </div>
          </fieldset>

          <button
            type="button"
            onClick={() => void handleRender()}
            disabled={busy || Boolean(selected.error && range.trim())}
            data-testid="pdf-to-image-convert"
            className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-lg bg-brand-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-brand-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {busy && <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />}
            {busy
              ? `در حال تبدیل… (${toPersianDigits(progress.done)}/${toPersianDigits(
                  progress.total,
                )})`
              : "تبدیل به تصویر"}
          </button>

          {error && (
            <p role="alert" className="mt-3 text-xs font-medium text-red-600">
              {error}
            </p>
          )}
        </div>

        <div className="rounded-2xl border border-ink-200 bg-white p-4 shadow-card sm:p-5">
          <div className="flex items-center justify-between gap-3">
            <h3 className="text-sm font-bold text-ink-900">
              تصویرهای ساخته‌شده
              {pages.length > 0 && (
                <span className="ms-2 rounded-full bg-brand-50 px-2 py-0.5 text-[11px] font-semibold text-brand-700">
                  {toPersianDigits(pages.length)}
                </span>
              )}
            </h3>
            {pages.length > 1 && (
              <button
                type="button"
                onClick={() => void handleDownloadAll()}
                disabled={zipBusy}
                data-testid="pdf-download-zip"
                className="inline-flex items-center gap-1.5 rounded-lg border border-brand-200 bg-brand-50 px-2.5 py-1.5 text-[11px] font-semibold text-brand-700 transition hover:bg-brand-100 disabled:opacity-50"
              >
                <Download className="h-3.5 w-3.5" aria-hidden="true" />
                {zipBusy ? "در حال ساخت ZIP…" : "دانلود همه (ZIP)"}
              </button>
            )}
          </div>

          {pages.length > 0 ? (
            <div
              className="mt-3 grid max-h-[28rem] gap-3 overflow-y-auto pe-1 sm:grid-cols-2"
              data-testid="pdf-image-results"
            >
              {pages.map((page) => (
                <div
                  key={page.pageNumber}
                  className="overflow-hidden rounded-xl border border-ink-200 bg-ink-50"
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={page.url}
                    alt={`صفحهٔ ${page.pageNumber}`}
                    className="h-32 w-full bg-white object-contain"
                  />
                  <div className="flex items-center justify-between gap-2 px-2 py-1.5">
                    <span className="text-[11px] font-semibold text-ink-600">
                      صفحهٔ {toPersianDigits(page.pageNumber)} ·{" "}
                      {formatBytes(page.blob.size)}
                    </span>
                    <button
                      type="button"
                      onClick={() => void handleDownloadOne(page)}
                      aria-label={`دانلود صفحهٔ ${page.pageNumber}`}
                      className="flex h-7 w-7 items-center justify-center rounded-md bg-white text-brand-700 shadow-card transition hover:bg-brand-100"
                    >
                      <Download className="h-3.5 w-3.5" aria-hidden="true" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="mt-3 rounded-xl border border-dashed border-ink-200 bg-ink-50/60 px-4 py-10 text-center text-sm text-ink-400">
              تنظیمات را انتخاب کنید و دکمهٔ «تبدیل به تصویر» را بزنید.
            </div>
          )}
        </div>
      </div>

      <p className="mt-4 text-xs leading-6 text-ink-400">
        هر صفحه با کیفیت انتخابی به یک تصویر جدا تبدیل می‌شود؛ برای چند صفحه از
        «دانلود همه (ZIP)» استفاده کنید.
      </p>
    </div>
  );
}
