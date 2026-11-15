"use client";

import { useState } from "react";
import { ArrowDown, ArrowUp, Download, FileText, Loader2, RotateCcw, Shuffle } from "lucide-react";
import { downloadBlob, formatBytes } from "@/lib/image";
import { baseFileName } from "@/lib/pdf-pages";
import { inspectPdf, isPdfOpError } from "@/lib/pdf-arrange";
import { reorderPdfPages } from "@/lib/pdf-reorder";
import { toPersianDigits } from "@/lib/persian";
import { UploadZone } from "./UploadZone";
import { ToolPanel } from "./shared";

/**
 * مرتب‌سازی صفحات PDF — with inline previews of every page (rendered by the
 * same pdfjs worker the PDF→image tool uses) and move/up/down/reverse/shuffle
 * controls. The new PDF is built with pdf-lib from the chosen order.
 */
export function PdfPageReorder() {
  const [file, setFile] = useState<File | null>(null);
  const [bytes, setBytes] = useState<Uint8Array | null>(null);
  const [order, setOrder] = useState<number[]>([]);
  const [previews, setPreviews] = useState<string[]>([]);
  const [busy, setBusy] = useState(false);
  const [loadingPages, setLoadingPages] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<{ blob: Blob; name: string } | null>(null);

  async function reset() {
    setFile(null);
    setBytes(null);
    setOrder([]);
    setPreviews((current) => {
      current.forEach((url) => URL.revokeObjectURL(url));
      return [];
    });
    setResult(null);
    setError(null);
  }

  async function handleFile(next: File | undefined) {
    if (!next) return;
    await reset();
    setError(null);
    setLoadingPages(true);
    try {
      const buffer = new Uint8Array(await next.arrayBuffer());
      const info = await inspectPdf(next);
      if (isPdfOpError(info)) {
        setError(info.error);
        return;
      }
      setFile(next);
      setBytes(buffer);
      setOrder(Array.from({ length: info.pageCount }, (_, index) => index));

      // Render small previews (best-effort: a failure only hides thumbnails).
      try {
        const { renderPdfPreviews } = await import("@/lib/pdf-raster");
        const urls = await renderPdfPreviews(buffer, { maxWidth: 160 });
        setPreviews(urls);
      } catch {
        setPreviews([]);
      }
    } catch {
      setError("خواندن فایل PDF ممکن نشد. فایل سالم است؟");
    } finally {
      setLoadingPages(false);
    }
  }

  function move(index: number, delta: number) {
    setOrder((current) => {
      const target = index + delta;
      if (target < 0 || target >= current.length) return current;
      const next = [...current];
      const [item] = next.splice(index, 1);
      if (item === undefined) return current;
      next.splice(target, 0, item);
      return next;
    });
    setResult(null);
  }

  function reverse() {
    setOrder((current) => [...current].reverse());
    setResult(null);
  }

  function shuffle() {
    setOrder((current) => {
      const next = [...current];
      for (let i = next.length - 1; i > 0; i -= 1) {
        const j = Math.floor(Math.random() * (i + 1));
        const a = next[i] as number;
        const b = next[j] as number;
        next[i] = b;
        next[j] = a;
      }
      return next;
    });
    setResult(null);
  }

  async function apply() {
    if (!bytes || !file) return;
    setBusy(true);
    setError(null);
    try {
      const { bytes: out } = await reorderPdfPages(bytes, order);
      const blob = new Blob([new Uint8Array(out)], { type: "application/pdf" });
      setResult({ blob, name: `${baseFileName(file.name)}-reordered.pdf` });
    } catch {
      setError("ساخت فایل جدید ممکن نشد. فایل PDF سالم است؟");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <ToolPanel
        title="فایل PDF"
        description="صفحه‌ها را به ترتیب دلخواه بچینید"
        icon={<FileText className="h-4 w-4 text-brand-600" aria-hidden="true" />}
      >
        <div className="space-y-4">
          {!file ? (
            <UploadZone
              accept="application/pdf"
              title="فایل PDF را انتخاب کنید"
              hint="بدون محدودیت حجم — تا ۶۰ صفحه"
              buttonLabel="انتخاب فایل PDF"
              onFiles={(files) => void handleFile(files[0])}
              testId="pdf-reorder-input"
            />
          ) : (
            <div className="flex items-center justify-between rounded-xl bg-ink-50 px-3 py-2 text-[11px] text-ink-600">
              <span className="truncate font-semibold">{file.name}</span>
              <button
                type="button"
                onClick={reset}
                className="inline-flex items-center gap-1 text-ink-500 transition hover:text-rose-600"
              >
                <RotateCcw className="h-3 w-3" aria-hidden="true" />
                فایل دیگر
              </button>
            </div>
          )}

          {error && (
            <p
              data-testid="pdf-reorder-error"
              className="rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-xs leading-6 text-rose-700"
            >
              {error}
            </p>
          )}

          {file && order.length > 0 && (
            <>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={reverse}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-ink-200 px-3 py-1.5 text-[11px] font-semibold text-ink-700 transition hover:bg-ink-100"
                >
                  <RotateCcw className="h-3.5 w-3.5" aria-hidden="true" />
                  برعکس کردن ترتیب
                </button>
                <button
                  type="button"
                  onClick={shuffle}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-ink-200 px-3 py-1.5 text-[11px] font-semibold text-ink-700 transition hover:bg-ink-100"
                >
                  <Shuffle className="h-3.5 w-3.5" aria-hidden="true" />
                  ترتیب تصادفی
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setOrder((current) => [...current].sort((a, b) => a - b));
                    setResult(null);
                  }}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-ink-200 px-3 py-1.5 text-[11px] font-semibold text-ink-700 transition hover:bg-ink-100"
                >
                  بازگشت به ترتیب اصلی
                </button>
              </div>

              <div
                className="max-h-96 space-y-2 overflow-auto pe-1"
                data-testid="pdf-reorder-list"
              >
                {order.map((pageIndex, position) => (
                  <div
                    key={`${pageIndex}-${position}`}
                    className="flex items-center gap-3 rounded-xl border border-ink-200 bg-white p-2"
                  >
                    <span className="w-6 shrink-0 text-center text-[11px] font-bold text-brand-700">
                      {toPersianDigits(position + 1)}
                    </span>
                    {previews[pageIndex] ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={previews[pageIndex]}
                        alt={`صفحهٔ ${pageIndex + 1}`}
                        className="h-16 w-12 shrink-0 rounded border border-ink-200 object-cover"
                      />
                    ) : (
                      <div className="flex h-16 w-12 shrink-0 items-center justify-center rounded border border-dashed border-ink-200 text-[9px] text-ink-400">
                        {loadingPages ? <Loader2 className="h-4 w-4 animate-spin" /> : "—"}
                      </div>
                    )}
                    <div className="min-w-0 flex-1 text-[11px] text-ink-600">
                      صفحهٔ اصلی {toPersianDigits(pageIndex + 1)}
                    </div>
                    <div className="flex shrink-0 gap-1">
                      <button
                        type="button"
                        onClick={() => move(position, -1)}
                        disabled={position === 0}
                        aria-label="جابه‌جایی به بالا"
                        className="flex h-7 w-7 items-center justify-center rounded-lg border border-ink-200 text-ink-600 transition hover:bg-ink-100 disabled:opacity-30"
                      >
                        <ArrowUp className="h-3.5 w-3.5" aria-hidden="true" />
                      </button>
                      <button
                        type="button"
                        onClick={() => move(position, 1)}
                        disabled={position === order.length - 1}
                        aria-label="جابه‌جایی به پایین"
                        className="flex h-7 w-7 items-center justify-center rounded-lg border border-ink-200 text-ink-600 transition hover:bg-ink-100 disabled:opacity-30"
                      >
                        <ArrowDown className="h-3.5 w-3.5" aria-hidden="true" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              <button
                type="button"
                onClick={apply}
                disabled={busy}
                data-testid="pdf-reorder-run"
                className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-brand-600 px-4 py-2.5 text-sm font-bold text-white shadow-card transition hover:bg-brand-700 disabled:opacity-60"
              >
                {busy && <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />}
                {busy ? "در حال ساخت فایل…" : "ساخت PDF با ترتیب جدید"}
              </button>
            </>
          )}
        </div>
      </ToolPanel>

      <ToolPanel
        title="نتیجه"
        description="فایل مرتب‌شده آمادهٔ دانلود"
        icon={<Download className="h-4 w-4 text-brand-600" aria-hidden="true" />}
      >
        {result ? (
          <div className="space-y-3" data-testid="pdf-reorder-result">
            <div className="rounded-xl border border-ink-200 bg-ink-50 px-4 py-3">
              <p className="truncate text-sm font-semibold text-ink-900">{result.name}</p>
              <p className="mt-0.5 text-[11px] text-ink-500">
                {toPersianDigits(order.length)} صفحه · {formatBytes(result.blob.size)}
              </p>
            </div>
            <button
              type="button"
              onClick={() => downloadBlob(result.blob, result.name)}
              data-testid="pdf-reorder-download"
              className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-brand-300 bg-brand-50 px-4 py-2.5 text-sm font-bold text-brand-800 transition hover:bg-brand-100"
            >
              <Download className="h-4 w-4" aria-hidden="true" />
              دانلود PDF
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            <p className="rounded-xl border border-dashed border-ink-200 bg-ink-50/60 px-4 py-8 text-center text-sm text-ink-400">
              {file ? "ترتیب را تنظیم کنید و دکمهٔ ساخت را بزنید." : "اول یک فایل PDF انتخاب کنید."}
            </p>
            <div className="rounded-xl bg-ink-50 px-3 py-2.5 text-[11px] leading-6 text-ink-500">
              <p className="font-semibold text-ink-700">خروجی شامل چه چیزی است؟</p>
              <ul className="mt-1 list-inside list-disc space-y-0.5">
                <li>همهٔ صفحه‌ها، با ترتیبی که انتخاب کردید</li>
                <li>متن و لینک‌های داخل صفحات دست‌نخورده می‌مانند</li>
                <li>هیچ صفحه‌ای حذف نمی‌شود (برای حذف، از ابزار «حذف صفحه» استفاده کنید)</li>
              </ul>
            </div>
          </div>
        )}
      </ToolPanel>
    </div>
  );
}
