"use client";

import { useState } from "react";
import { Download, FileText, Gauge, Loader2, RotateCcw } from "lucide-react";
import { UploadZone } from "./UploadZone";
import { downloadBlob, formatBytes } from "@/lib/image";
import { baseFileName } from "@/lib/pdf-pages";
import { PDF_COMPRESS_PRESETS, resavePdf } from "@/lib/pdf-edit";
import { toPersianDigits } from "@/lib/persian";
import { cn } from "@/lib/utils";

const MAX_BYTES = 60 * 1024 * 1024;

interface Outcome {
  blob: Blob;
  pageCount: number;
  mode: "lossless" | "raster";
}

/**
 * PDF compressor.
 *
 * Mode 1 (lossless): rewrites the PDF with pdf-lib — drops metadata, unused
 * objects get garbage-collected and cross-reference tables are rebuilt.
 * Mode 2 (raster): re-renders every page to a JPEG via pdf.js at a chosen
 * quality, which shrinks scanned documents dramatically.
 */
export function PdfCompressor() {
  const [file, setFile] = useState<File | null>(null);
  const [preset, setPreset] = useState<(typeof PDF_COMPRESS_PRESETS)[number]["id"]>("balanced");
  const [busy, setBusy] = useState(false);
  const [progress, setProgress] = useState({ done: 0, total: 0 });
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<Outcome | null>(null);

  function reset() {
    setFile(null);
    setResult(null);
    setError(null);
    setProgress({ done: 0, total: 0 });
  }

  function handleFiles(files: File[]) {
    const picked = files[0];
    if (!picked) return;
    if (picked.type !== "application/pdf" && !/\.pdf$/i.test(picked.name)) {
      setError("فقط فایل PDF پذیرفته می‌شود.");
      return;
    }
    if (picked.size > MAX_BYTES) {
      setError("حجم فایل PDF باید کمتر از ۶۰ مگابایت باشد.");
      return;
    }
    setError(null);
    setResult(null);
    setFile(picked);
  }

  async function compressLossless() {
    if (!file) return;
    setBusy(true);
    setError(null);
    try {
      const bytes = new Uint8Array(await file.arrayBuffer());
      const out = await resavePdf(bytes);
      if (out.error) {
        setError(out.error);
        return;
      }
      setResult({
        blob: new Blob([out.bytes as unknown as BlobPart], { type: "application/pdf" }),
        pageCount: out.pageCount,
        mode: "lossless",
      });
    } catch {
      setError("فشرده‌سازی ممکن نشد. فایل دیگری را امتحان کنید.");
    } finally {
      setBusy(false);
    }
  }

  async function compressRaster() {
    if (!file) return;
    setBusy(true);
    setError(null);
    setProgress({ done: 0, total: 0 });
    try {
      const { PDFDocument } = await import("pdf-lib");
      const { openPdf, isPdfError, rasterisePdf } = await import("@/lib/pdf-raster");
      const opened = await openPdf(file);
      if (isPdfError(opened)) {
        setError(opened.message);
        return;
      }

      const setting = PDF_COMPRESS_PRESETS.find((item) => item.id === preset) ?? PDF_COMPRESS_PRESETS[1];
      const allPages = Array.from({ length: opened.meta.pageCount }, (_, i) => i + 1);
      setProgress({ done: 0, total: allPages.length });

      const rendered = await rasterisePdf(opened.doc, allPages, {
        scale: setting.scale,
        format: "image/jpeg",
        quality: setting.quality,
        onProgress: (done, total) => setProgress({ done, total }),
      });

      const pdf = await PDFDocument.create();
      pdf.setProducer("Abzaro");
      pdf.setCreator("ابزارو — abzaro.netlify.app");
      for (const page of rendered) {
        const image = await pdf.embedJpg(new Uint8Array(await page.blob.arrayBuffer()));
        const width = 595.28;
        const height = Math.round((width * page.height) / page.width);
        const sheet = pdf.addPage([width, height]);
        sheet.drawImage(image, { x: 0, y: 0, width, height });
      }
      const bytes = await pdf.save({ useObjectStreams: true });
      void opened.doc.destroy();

      setResult({
        blob: new Blob([bytes as unknown as BlobPart], { type: "application/pdf" }),
        pageCount: rendered.length,
        mode: "raster",
      });
    } catch {
      setError("تبدیل صفحه‌ها ممکن نشد. حالت دیگری را امتحان کنید.");
    } finally {
      setBusy(false);
    }
  }

  if (!file) {
    return (
      <UploadZone
        title="فایل PDF را اینجا رها کنید"
        hint="یا از دکمهٔ زیر انتخاب کنید — حداکثر ۶۰ مگابایت"
        buttonLabel="انتخاب فایل PDF"
        accept="application/pdf,.pdf"
        onFiles={handleFiles}
        icon={<FileText className="h-7 w-7" aria-hidden="true" />}
        error={error}
        testId="pdf-compress-input"
      />
    );
  }

  const saved = result ? Math.round(((file.size - result.blob.size) / file.size) * 100) : 0;

  return (
    <div>
      <div className="rounded-2xl border border-ink-200 bg-white p-4 shadow-card sm:p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex min-w-0 items-center gap-3">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-red-50 text-red-600">
              <FileText className="h-5 w-5" aria-hidden="true" />
            </span>
            <div className="min-w-0">
              <p className="truncate text-sm font-bold text-ink-900" data-testid="pdf-compress-name">
                {file.name}
              </p>
              <p className="mt-0.5 text-xs text-ink-500">{formatBytes(file.size)}</p>
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
            <Gauge className="h-4 w-4 text-brand-600" aria-hidden="true" />
            روش فشرده‌سازی
          </h3>

          <div className="mt-4 space-y-3">
            <div className="rounded-xl border border-brand-300 bg-brand-50 p-3">
              <p className="text-xs font-bold text-brand-900">۱. بدون افت کیفیت (سریع)</p>
              <p className="mt-1 text-[11px] leading-5 text-brand-800">
                متادیتا و داده‌های اضافی حذف می‌شود؛ متن و تصاویر دست‌نخورده
                می‌مانند. بهترین گزینه برای PDFهای متنی.
              </p>
              <button
                type="button"
                onClick={() => void compressLossless()}
                disabled={busy}
                data-testid="pdf-compress-lossless"
                className="mt-2 inline-flex w-full items-center justify-center gap-2 rounded-lg bg-brand-600 px-3 py-2 text-xs font-semibold text-white transition hover:bg-brand-700 disabled:opacity-50"
              >
                {busy ? <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden="true" /> : null}
                اجرای این روش
              </button>
            </div>

            <div className="rounded-xl border border-ink-200 p-3">
              <p className="text-xs font-bold text-ink-900">۲. تبدیل صفحه‌ها به تصویر</p>
              <p className="mt-1 text-[11px] leading-5 text-ink-500">
                هر صفحه به JPEG تبدیل می‌شود؛ بیشترین کاهش حجم برای فایل‌های
                اسکن‌شده. متن دیگر قابل انتخاب نیست.
              </p>
              <div className="mt-2 flex gap-2">
                {PDF_COMPRESS_PRESETS.map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => {
                      setPreset(item.id);
                      setResult(null);
                    }}
                    aria-pressed={preset === item.id}
                    className={cn(
                      "flex-1 rounded-lg border px-2 py-1.5 text-[11px] font-semibold transition",
                      preset === item.id
                        ? "border-brand-300 bg-brand-50 text-brand-700"
                        : "border-ink-200 text-ink-600 hover:bg-ink-100",
                    )}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
              <button
                type="button"
                onClick={() => void compressRaster()}
                disabled={busy}
                data-testid="pdf-compress-raster"
                className="mt-2 inline-flex w-full items-center justify-center gap-2 rounded-lg border border-brand-200 bg-white px-3 py-2 text-xs font-semibold text-brand-700 transition hover:bg-brand-50 disabled:opacity-50"
              >
                {busy && progress.total > 0
                  ? `در حال تبدیل… (${toPersianDigits(progress.done)}/${toPersianDigits(progress.total)})`
                  : "اجرای این روش"}
              </button>
            </div>
          </div>

          {error && (
            <p role="alert" className="mt-3 text-xs font-medium text-red-600">
              {error}
            </p>
          )}
        </div>

        <div className="rounded-2xl border border-ink-200 bg-white p-4 shadow-card sm:p-5">
          <h3 className="text-sm font-bold text-ink-900">نتیجه</h3>
          {result ? (
            <div className="mt-3 space-y-3" data-testid="pdf-compress-result">
              <div className="grid grid-cols-2 gap-2">
                <div className="rounded-xl border border-ink-200 bg-ink-50 px-3 py-2.5 text-center">
                  <div className="text-[11px] text-ink-500">قبل</div>
                  <div className="mt-0.5 text-sm font-extrabold text-ink-900">
                    {formatBytes(file.size)}
                  </div>
                </div>
                <div className="rounded-xl border border-brand-200 bg-brand-50 px-3 py-2.5 text-center">
                  <div className="text-[11px] text-brand-700">بعد</div>
                  <div className="mt-0.5 text-sm font-extrabold text-brand-900" data-testid="pdf-compress-after">
                    {formatBytes(result.blob.size)}
                  </div>
                </div>
              </div>
              <div
                className={cn(
                  "rounded-xl px-4 py-3 text-center text-sm font-bold",
                  saved > 0 ? "bg-emerald-50 text-emerald-800" : "bg-amber-50 text-amber-800",
                )}
              >
                {saved > 0
                  ? `${toPersianDigits(saved)}٪ کوچک‌تر شد`
                  : "این فایل از قبل بهینه است — روش دوم را امتحان کنید."}
              </div>
              <p className="text-center text-[11px] text-ink-500">
                {toPersianDigits(result.pageCount)} صفحه ·{" "}
                {result.mode === "lossless" ? "بدون افت کیفیت" : "تبدیل‌شده به تصویر"}
              </p>
              <button
                type="button"
                onClick={() =>
                  downloadBlob(result.blob, `${baseFileName(file.name, "document")}-compressed.pdf`)
                }
                data-testid="pdf-compress-download"
                className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-brand-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-brand-700"
              >
                <Download className="h-4 w-4" aria-hidden="true" />
                دانلود PDF فشرده
              </button>
            </div>
          ) : (
            <div className="mt-3 rounded-xl border border-dashed border-ink-200 bg-ink-50/60 px-4 py-10 text-center text-sm text-ink-400">
              یکی از دو روش را انتخاب کنید.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
