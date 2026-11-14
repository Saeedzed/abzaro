"use client";

import { useState } from "react";
import { Download, Droplets, FileText, Loader2 } from "lucide-react";
import { downloadBlob, formatBytes } from "@/lib/image";
import { baseFileName } from "@/lib/pdf-pages";
import { inspectPdf, isPdfOpError } from "@/lib/pdf-arrange";
import { stampPdf, type StampPosition } from "@/lib/pdf-reorder";
import { toPersianDigits } from "@/lib/persian";
import { cn } from "@/lib/utils";
import { UploadZone } from "./UploadZone";
import { ToolPanel } from "./shared";

const POSITIONS: Array<{ id: StampPosition; label: string }> = [
  { id: "bottom-center", label: "پایین وسط" },
  { id: "bottom-right", label: "پایین راست" },
  { id: "bottom-left", label: "پایین چپ" },
  { id: "top-center", label: "بالا وسط" },
];

/** شمارهٔ صفحه و واترمارک متنی روی PDF. */
export function PdfWatermark() {
  const [file, setFile] = useState<File | null>(null);
  const [bytes, setBytes] = useState<Uint8Array | null>(null);
  const [pageCount, setPageCount] = useState(0);
  const [pageNumbers, setPageNumbers] = useState(true);
  const [watermark, setWatermark] = useState("");
  const [position, setPosition] = useState<StampPosition>("bottom-center");
  const [fontSize, setFontSize] = useState(10);
  const [opacity, setOpacity] = useState(0.18);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<{ blob: Blob; name: string } | null>(null);

  async function handleFile(next: File | undefined) {
    if (!next) return;
    setFile(null);
    setBytes(null);
    setResult(null);
    setError(null);
    const info = await inspectPdf(next);
    if (isPdfOpError(info)) {
      setError(info.error);
      return;
    }
    setFile(next);
    setPageCount(info.pageCount);
    setBytes(new Uint8Array(await next.arrayBuffer()));
  }

  async function apply() {
    if (!bytes || !file) return;
    setBusy(true);
    setError(null);
    try {
      const { bytes: out } = await stampPdf(bytes, {
        pageNumbers,
        watermark,
        position,
        fontSize,
        opacity,
      });
      const blob = new Blob([new Uint8Array(out)], { type: "application/pdf" });
      setResult({ blob, name: `${baseFileName(file.name)}-numbered.pdf` });
    } catch {
      setError("اضافه کردن شماره/واترمارک ممکن نشد. فایل PDF سالم است؟");
    } finally {
      setBusy(false);
    }
  }

  async function download() {
    if (!result) return;
    downloadBlob(result.blob, result.name);
  }

  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <ToolPanel
        title="فایل و تنظیمات"
        description="شمارهٔ صفحه و متن واترمارک را انتخاب کنید"
        icon={<Droplets className="h-4 w-4 text-brand-600" aria-hidden="true" />}
      >
        <div className="space-y-4">
          {!file ? (
            <UploadZone
              accept="application/pdf"
              title="فایل PDF را انتخاب کنید"
              hint="حداکثر ۴۰ مگابایت"
              buttonLabel="انتخاب فایل PDF"
              onFiles={(files) => void handleFile(files[0])}
              testId="pdf-watermark-input"
            />
          ) : (
            <div className="flex items-center justify-between rounded-xl bg-ink-50 px-3 py-2 text-[11px] text-ink-600">
              <span className="truncate font-semibold">{file.name}</span>
              <span>{toPersianDigits(pageCount)} صفحه</span>
            </div>
          )}

          <label className="flex items-center gap-2 rounded-xl border border-ink-200 px-3 py-2 text-xs font-semibold text-ink-700">
            <input
              type="checkbox"
              checked={pageNumbers}
              onChange={(event) => setPageNumbers(event.target.checked)}
              data-testid="pdf-watermark-numbers"
              className="accent-brand-600"
            />
            افزودن شمارهٔ صفحه (مثل 1 / 10)
          </label>

          {pageNumbers && (
            <div>
              <p className="mb-2 text-xs font-semibold text-ink-700">محل شماره</p>
              <div className="grid grid-cols-2 gap-2">
                {POSITIONS.map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setPosition(item.id)}
                    aria-pressed={position === item.id}
                    className={cn(
                      "rounded-lg border px-2 py-1.5 text-[11px] font-medium transition",
                      position === item.id
                        ? "border-brand-300 bg-brand-50 text-brand-700"
                        : "border-ink-200 text-ink-600 hover:bg-ink-100",
                    )}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
              <p className="mt-1.5 text-[10px] leading-5 text-ink-400">
                شماره‌ها با ارقام لاتین نوشته می‌شوند (۱ / ۱۰ ← 1 / 10)، چون فونت
                استاندارد PDF ارقام فارسی را پشتیبانی نمی‌کند.
              </p>
            </div>
          )}

          <div>
            <label htmlFor="watermark-text" className="mb-1 block text-xs font-semibold text-ink-700">
              متن واترمارک (اختیاری)
            </label>
            <input
              id="watermark-text"
              dir="ltr"
              value={watermark}
              onChange={(event) => setWatermark(event.target.value)}
              placeholder="CONFIDENTIAL"
              data-testid="pdf-watermark-text"
              className="w-full rounded-lg border border-ink-200 px-3 py-2 text-sm outline-none focus:border-brand-400"
            />
            <p className="mt-1 text-[10px] leading-5 text-amber-700">
              متن واترمارک باید لاتین باشد (فونت استاندارد PDF حروف فارسی ندارد).
            </p>
          </div>

          <div>
            <div className="flex items-center justify-between text-xs font-semibold text-ink-700">
              <label htmlFor="watermark-size">اندازهٔ فونت</label>
              <span className="text-brand-700">{toPersianDigits(fontSize)}</span>
            </div>
            <input
              id="watermark-size"
              type="range"
              min={6}
              max={24}
              value={fontSize}
              onChange={(event) => setFontSize(Number(event.target.value))}
              className="mt-1 w-full accent-brand-600"
            />
          </div>

          <div>
            <div className="flex items-center justify-between text-xs font-semibold text-ink-700">
              <label htmlFor="watermark-opacity">شفافیت واترمارک</label>
              <span className="text-brand-700">{toPersianDigits(Math.round(opacity * 100))}٪</span>
            </div>
            <input
              id="watermark-opacity"
              type="range"
              min={5}
              max={60}
              value={Math.round(opacity * 100)}
              onChange={(event) => setOpacity(Number(event.target.value) / 100)}
              className="mt-1 w-full accent-brand-600"
            />
          </div>

          {error && (
            <p
              data-testid="pdf-watermark-error"
              className="rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-xs text-rose-700"
            >
              {error}
            </p>
          )}

          <button
            type="button"
            onClick={apply}
            disabled={busy || !file || (!pageNumbers && watermark.trim() === "")}
            data-testid="pdf-watermark-run"
            className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-brand-600 px-4 py-2.5 text-sm font-bold text-white shadow-card transition hover:bg-brand-700 disabled:opacity-60"
          >
            {busy && <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />}
            {busy ? "در حال اعمال…" : "اعمال روی همهٔ صفحه‌ها"}
          </button>
        </div>
      </ToolPanel>

      <ToolPanel
        title="خروجی"
        description="فایل جدید با شماره/واترمارک"
        icon={<FileText className="h-4 w-4 text-brand-600" aria-hidden="true" />}
      >
        {result ? (
          <div className="space-y-3" data-testid="pdf-watermark-result">
            <div className="rounded-xl border border-ink-200 bg-ink-50 px-4 py-3">
              <p className="truncate text-sm font-semibold text-ink-900">{result.name}</p>
              <p className="mt-0.5 text-[11px] text-ink-500">
                {toPersianDigits(pageCount)} صفحه · {formatBytes(result.blob.size)}
              </p>
            </div>
            <button
              type="button"
              onClick={download}
              data-testid="pdf-watermark-download"
              className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-brand-300 bg-brand-50 px-4 py-2.5 text-sm font-bold text-brand-800 transition hover:bg-brand-100"
            >
              <Download className="h-4 w-4" aria-hidden="true" />
              دانلود PDF
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            <p className="rounded-xl border border-dashed border-ink-200 bg-ink-50/60 px-4 py-8 text-center text-sm text-ink-400">
              {file ? "تنظیمات را انتخاب کنید و دکمهٔ اعمال را بزنید." : "اول یک فایل PDF انتخاب کنید."}
            </p>
            <div className="rounded-xl bg-ink-50 px-3 py-2.5 text-[11px] leading-6 text-ink-500">
              <p className="font-semibold text-ink-700">نکته‌های مهم</p>
              <ul className="mt-1 list-inside list-disc space-y-0.5">
                <li>شمارهٔ صفحه روی همهٔ صفحه‌ها اضافه می‌شود.</li>
                <li>واترمارک با زاویهٔ ۴۵ درجه و شفافیت قابل تنظیم است.</li>
                <li>فایل اصلی تغییری نمی‌کند؛ نسخهٔ جدید ساخته می‌شود.</li>
              </ul>
            </div>
          </div>
        )}
      </ToolPanel>
    </div>
  );
}
