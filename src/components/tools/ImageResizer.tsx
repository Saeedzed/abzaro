"use client";

import { useEffect, useRef, useState } from "react";
import { Download, Image as ImageIcon, Link2, Link2Off, RotateCcw, Upload } from "lucide-react";
import {
  downloadBlob,
  extensionFor,
  formatBytes,
  isLoadError,
  loadImageFile,
  renderImage,
  type LoadedImage,
  type OutputFormat,
} from "@/lib/image";
import { toPersianDigits } from "@/lib/persian";
import { cn } from "@/lib/utils";

const PRESETS = [
  { label: "عرض ۱۰۸۰", width: 1080 },
  { label: "عرض ۸۰۰", width: 800 },
  { label: "عرض ۵۰۰", width: 500 },
  { label: "عرض ۳۰۰", width: 300 },
] as const;

const FORMATS: Array<{ id: OutputFormat; label: string }> = [
  { id: "image/jpeg", label: "JPG" },
  { id: "image/png", label: "PNG" },
  { id: "image/webp", label: "WebP" },
];

/**
 * Image resizer — reads the file locally, draws it on a canvas at the chosen
 * size and offers the result as a download. Nothing is uploaded.
 */
export function ImageResizer() {
  const [image, setImage] = useState<LoadedImage | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [width, setWidth] = useState("");
  const [height, setHeight] = useState("");
  const [lockRatio, setLockRatio] = useState(true);
  const [format, setFormat] = useState<OutputFormat>("image/jpeg");
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<{ blob: Blob; width: number; height: number } | null>(null);
  const [resultUrl, setResultUrl] = useState<string | null>(null);
  const [dragging, setDragging] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const ratio = image && image.height !== 0 ? image.width / image.height : 1;

  // Keep exactly one live object URL for the result, revoked on change/unmount.
  useEffect(() => {
    if (!result) {
      setResultUrl(null);
      return;
    }
    const url = URL.createObjectURL(result.blob);
    setResultUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [result]);

  // Release the decoded bitmap when it is replaced or the tool unmounts.
  useEffect(() => {
    if (!image) return;
    return () => image.bitmap.close();
  }, [image]);

  async function handleFile(file: File | undefined) {
    if (!file) return;
    setError(null);
    setResult(null);
    const loaded = await loadImageFile(file);
    if (isLoadError(loaded)) {
      setError(loaded.message);
      setImage(null);
      return;
    }
    setImage(loaded);
    setWidth(String(loaded.width));
    setHeight(String(loaded.height));
  }

  function changeWidth(value: string) {
    setWidth(value);
    setResult(null);
    const parsed = Number(value);
    if (lockRatio && Number.isFinite(parsed) && parsed > 0) {
      setHeight(String(Math.round(parsed / ratio)));
    }
  }

  function changeHeight(value: string) {
    setHeight(value);
    setResult(null);
    const parsed = Number(value);
    if (lockRatio && Number.isFinite(parsed) && parsed > 0) {
      setWidth(String(Math.round(parsed * ratio)));
    }
  }

  function applyPreset(presetWidth: number) {
    setWidth(String(presetWidth));
    setHeight(String(Math.round(presetWidth / ratio)));
    setResult(null);
  }

  function reset() {
    setImage(null);
    setResult(null);
    setError(null);
    setWidth("");
    setHeight("");
    if (inputRef.current) inputRef.current.value = "";
  }

  async function handleResize() {
    if (!image) return;
    const w = Number(width);
    const h = Number(height);
    if (!Number.isFinite(w) || !Number.isFinite(h) || w < 1 || h < 1) {
      setError("عرض و ارتفاع باید عددی بزرگ‌تر از صفر باشند.");
      return;
    }
    if (w > 10000 || h > 10000) {
      setError("حداکثر ابعاد مجاز ۱۰۰۰۰ پیکسل است.");
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const blob = await renderImage(image.bitmap, {
        width: w,
        height: h,
        format,
        quality: 0.92,
      });
      setResult({ blob, width: Math.round(w), height: Math.round(h) });
    } catch {
      setError("تغییر اندازهٔ تصویر ممکن نشد. فایل یا ابعاد دیگری را امتحان کنید.");
    } finally {
      setBusy(false);
    }
  }

  function handleDownload() {
    if (!result || !image) return;
    const base = image.name.replace(/\.[^.]+$/, "") || "image";
    downloadBlob(result.blob, `${base}-${result.width}x${result.height}.${extensionFor(format)}`);
  }

  // ---------------- empty state ----------------
  if (!image) {
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
            dragging ? "border-brand-400 bg-brand-50" : "border-ink-200 bg-white hover:border-brand-300",
          )}
        >
          <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-brand-50 text-brand-600">
            <Upload className="h-7 w-7" aria-hidden="true" />
          </span>
          <p className="mt-4 text-base font-bold text-ink-900">تصویر را اینجا رها کنید</p>
          <p className="mt-1 text-sm text-ink-500">یا از دکمهٔ زیر انتخاب کنید — حداکثر ۲۵ مگابایت</p>
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            className="mt-4 inline-flex items-center gap-2 rounded-lg bg-brand-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-brand-700"
          >
            <ImageIcon className="h-4 w-4" aria-hidden="true" />
            انتخاب تصویر
          </button>
          <input
            ref={inputRef}
            type="file"
            accept="image/*"
            onChange={(event) => void handleFile(event.target.files?.[0])}
            className="sr-only"
            aria-label="انتخاب فایل تصویر"
          />
          {error && (
            <p role="alert" className="mt-4 text-sm font-medium text-red-600">
              {error}
            </p>
          )}
        </div>
        <p className="mt-4 text-xs leading-6 text-ink-400">
          تصویر شما هرگز آپلود نمی‌شود؛ همهٔ پردازش‌ها داخل مرورگر انجام می‌شود.
        </p>
      </div>
    );
  }

  // ---------------- loaded state ----------------
  return (
    <div>
      <div className="rounded-2xl border border-ink-200 bg-white p-4 shadow-card sm:p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="min-w-0">
            <p className="truncate text-sm font-bold text-ink-900">{image.name}</p>
            <p className="mt-0.5 text-xs text-ink-500">
              {toPersianDigits(image.width)} × {toPersianDigits(image.height)} پیکسل · {formatBytes(image.size)}
            </p>
          </div>
          <button
            type="button"
            onClick={reset}
            className="inline-flex items-center gap-2 rounded-lg border border-ink-200 px-3 py-2 text-xs font-semibold text-ink-700 transition hover:bg-ink-100"
          >
            <RotateCcw className="h-3.5 w-3.5" aria-hidden="true" />
            تصویر دیگر
          </button>
        </div>
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-2">
        <div className="rounded-2xl border border-ink-200 bg-white p-4 shadow-card sm:p-5">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-ink-900">ابعاد جدید</h3>
            <button
              type="button"
              onClick={() => setLockRatio((value) => !value)}
              aria-pressed={lockRatio}
              className={cn(
                "inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-xs font-semibold transition",
                lockRatio
                  ? "border-brand-200 bg-brand-50 text-brand-700"
                  : "border-ink-200 text-ink-500 hover:bg-ink-100",
              )}
            >
              {lockRatio ? (
                <Link2 className="h-3.5 w-3.5" aria-hidden="true" />
              ) : (
                <Link2Off className="h-3.5 w-3.5" aria-hidden="true" />
              )}
              {lockRatio ? "نسبت حفظ می‌شود" : "نسبت آزاد"}
            </button>
          </div>

          <div className="mt-3 grid grid-cols-2 gap-3">
            <div>
              <label htmlFor="resize-width" className="mb-1.5 block text-xs font-semibold text-ink-700">
                عرض (px)
              </label>
              <input
                id="resize-width"
                type="number"
                min={1}
                max={10000}
                value={width}
                onChange={(event) => changeWidth(event.target.value)}
                className="w-full rounded-xl border border-ink-200 bg-white px-3 py-2.5 text-center text-lg font-semibold text-ink-900 outline-none transition focus:border-brand-400 focus:ring-4 focus:ring-brand-100"
              />
            </div>
            <div>
              <label htmlFor="resize-height" className="mb-1.5 block text-xs font-semibold text-ink-700">
                ارتفاع (px)
              </label>
              <input
                id="resize-height"
                type="number"
                min={1}
                max={10000}
                value={height}
                onChange={(event) => changeHeight(event.target.value)}
                className="w-full rounded-xl border border-ink-200 bg-white px-3 py-2.5 text-center text-lg font-semibold text-ink-900 outline-none transition focus:border-brand-400 focus:ring-4 focus:ring-brand-100"
              />
            </div>
          </div>

          <div className="mt-3 flex flex-wrap gap-2">
            {PRESETS.map((preset) => (
              <button
                key={preset.width}
                type="button"
                onClick={() => applyPreset(preset.width)}
                className="rounded-lg border border-ink-200 bg-white px-2.5 py-1.5 text-xs font-semibold text-ink-600 transition hover:border-brand-200 hover:bg-brand-50 hover:text-brand-700"
              >
                {preset.label}
              </button>
            ))}
          </div>

          <div className="mt-4">
            <span className="mb-1.5 block text-xs font-semibold text-ink-700">قالب خروجی</span>
            <div className="flex gap-2">
              {FORMATS.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => {
                    setFormat(item.id);
                    setResult(null);
                  }}
                  aria-pressed={format === item.id}
                  className={cn(
                    "flex-1 rounded-lg border px-3 py-2 text-xs font-semibold transition",
                    format === item.id
                      ? "border-brand-300 bg-brand-50 text-brand-700"
                      : "border-ink-200 text-ink-600 hover:bg-ink-100",
                  )}
                >
                  {item.label}
                </button>
              ))}
            </div>
          </div>

          <button
            type="button"
            onClick={() => void handleResize()}
            disabled={busy}
            className="mt-4 w-full rounded-lg bg-brand-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-brand-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {busy ? "در حال پردازش…" : "تغییر اندازه"}
          </button>

          {error && (
            <p role="alert" className="mt-3 text-xs font-medium text-red-600">
              {error}
            </p>
          )}
        </div>

        <div className="rounded-2xl border border-ink-200 bg-white p-4 shadow-card sm:p-5">
          <h3 className="text-sm font-bold text-ink-900">نتیجه</h3>
          {result && resultUrl ? (
            <div className="mt-3 space-y-3">
              <div className="overflow-hidden rounded-xl border border-ink-200 bg-ink-50 p-2">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={resultUrl}
                  alt="پیش‌نمایش تصویر تغییر‌اندازه‌داده‌شده"
                  className="mx-auto max-h-64 rounded-lg"
                />
              </div>
              <div className="flex items-center justify-between rounded-xl border border-brand-200 bg-brand-50 px-4 py-3">
                <div className="text-xs font-medium text-brand-700">ابعاد نهایی</div>
                <div className="text-base font-extrabold text-brand-900">
                  {toPersianDigits(result.width)} × {toPersianDigits(result.height)}
                </div>
              </div>
              <div className="flex items-center justify-between rounded-xl border border-ink-200 bg-ink-50 px-4 py-3">
                <div className="text-xs font-medium text-ink-500">حجم فایل</div>
                <div className="text-right">
                  <div className="text-base font-extrabold text-ink-900">{formatBytes(result.blob.size)}</div>
                  <div className="text-[11px] text-ink-400">قبلاً {formatBytes(image.size)}</div>
                </div>
              </div>
              <button
                type="button"
                onClick={handleDownload}
                className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-brand-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-brand-700"
              >
                <Download className="h-4 w-4" aria-hidden="true" />
                دانلود تصویر
              </button>
            </div>
          ) : (
            <div className="mt-3 rounded-xl border border-dashed border-ink-200 bg-ink-50/60 px-4 py-10 text-center text-sm text-ink-400">
              ابعاد را تنظیم کنید و دکمهٔ «تغییر اندازه» را بزنید.
            </div>
          )}
        </div>
      </div>

      <p className="mt-4 text-xs leading-6 text-ink-400">
        تصویر شما هرگز آپلود نمی‌شود؛ همهٔ پردازش‌ها داخل مرورگر انجام می‌شود و فایل فقط روی
        دستگاه خودتان دانلود می‌گردد.
      </p>
    </div>
  );
}
