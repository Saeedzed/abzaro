"use client";

import { useEffect, useRef, useState } from "react";
import { Download, Image as ImageIcon, Minimize2, RotateCcw, Upload } from "lucide-react";
import {
  downloadBlob,
  extensionFor,
  fitWithin,
  formatBytes,
  isLoadError,
  loadImageFile,
  renderImage,
  type LoadedImage,
  type OutputFormat,
} from "@/lib/image";
import { toPersianDigits } from "@/lib/persian";
import { cn } from "@/lib/utils";

const QUALITY_STEPS = [
  { value: 0.9, label: "کیفیت بالا" },
  { value: 0.75, label: "متعادل" },
  { value: 0.55, label: "حجم کم" },
] as const;

const MAX_EDGES = [
  { value: 0, label: "اندازهٔ اصلی" },
  { value: 1920, label: "حداکثر ۱۹۲۰px" },
  { value: 1280, label: "حداکثر ۱۲۸۰px" },
] as const;

/**
 * Image compressor — re-encodes the file in the browser at a chosen quality
 * (optionally downscaling) and reports the size saved. Never uploads anything.
 */
export function ImageCompressor() {
  const [image, setImage] = useState<LoadedImage | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [quality, setQuality] = useState<number>(0.75);
  const [maxEdge, setMaxEdge] = useState<number>(0);
  const [format, setFormat] = useState<OutputFormat>("image/jpeg");
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<{ blob: Blob; width: number; height: number } | null>(null);
  const [resultUrl, setResultUrl] = useState<string | null>(null);
  const [dragging, setDragging] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!result) {
      setResultUrl(null);
      return;
    }
    const url = URL.createObjectURL(result.blob);
    setResultUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [result]);

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
    // Preserve transparency for PNG sources, otherwise produce a small JPEG.
    setFormat(loaded.type === "image/png" ? "image/webp" : "image/jpeg");
  }

  function reset() {
    setImage(null);
    setResult(null);
    setError(null);
    if (inputRef.current) inputRef.current.value = "";
  }

  async function handleCompress() {
    if (!image) return;
    setBusy(true);
    setError(null);
    try {
      const target =
        maxEdge > 0
          ? fitWithin(image.width, image.height, maxEdge, maxEdge)
          : { width: image.width, height: image.height };

      const blob = await renderImage(image.bitmap, {
        width: target.width,
        height: target.height,
        format,
        quality,
      });
      setResult({ blob, width: target.width, height: target.height });
    } catch {
      setError("فشرده‌سازی ممکن نشد. فایل دیگری را امتحان کنید.");
    } finally {
      setBusy(false);
    }
  }

  function handleDownload() {
    if (!result || !image) return;
    const base = image.name.replace(/\.[^.]+$/, "") || "image";
    downloadBlob(result.blob, `${base}-compressed.${extensionFor(format)}`);
  }

  const savedPercent =
    result && image && image.size > 0
      ? Math.round(((image.size - result.blob.size) / image.size) * 100)
      : 0;

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
          فایل شما هرگز آپلود نمی‌شود؛ فشرده‌سازی کاملاً داخل مرورگر انجام می‌شود.
        </p>
      </div>
    );
  }

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
          <h3 className="flex items-center gap-2 text-sm font-bold text-ink-900">
            <Minimize2 className="h-4 w-4 text-brand-600" aria-hidden="true" />
            تنظیمات فشرده‌سازی
          </h3>

          <fieldset className="mt-4">
            <legend className="mb-1.5 text-xs font-semibold text-ink-700">میزان کیفیت</legend>
            <div className="flex gap-2">
              {QUALITY_STEPS.map((step) => (
                <button
                  key={step.value}
                  type="button"
                  onClick={() => {
                    setQuality(step.value);
                    setResult(null);
                  }}
                  aria-pressed={quality === step.value}
                  className={cn(
                    "flex-1 rounded-lg border px-2 py-2 text-xs font-semibold transition",
                    quality === step.value
                      ? "border-brand-300 bg-brand-50 text-brand-700"
                      : "border-ink-200 text-ink-600 hover:bg-ink-100",
                  )}
                >
                  {step.label}
                </button>
              ))}
            </div>
          </fieldset>

          <fieldset className="mt-4">
            <legend className="mb-1.5 text-xs font-semibold text-ink-700">حداکثر ابعاد</legend>
            <div className="flex flex-col gap-2">
              {MAX_EDGES.map((edge) => (
                <label
                  key={edge.value}
                  className={cn(
                    "flex cursor-pointer items-center gap-3 rounded-lg border px-3 py-2 text-xs font-medium transition",
                    maxEdge === edge.value
                      ? "border-brand-300 bg-brand-50 text-ink-900"
                      : "border-ink-200 text-ink-600 hover:bg-ink-50",
                  )}
                >
                  <input
                    type="radio"
                    name="max-edge"
                    checked={maxEdge === edge.value}
                    onChange={() => {
                      setMaxEdge(edge.value);
                      setResult(null);
                    }}
                    className="h-3.5 w-3.5 accent-brand-600"
                  />
                  {edge.label}
                </label>
              ))}
            </div>
          </fieldset>

          <fieldset className="mt-4">
            <legend className="mb-1.5 text-xs font-semibold text-ink-700">قالب خروجی</legend>
            <div className="flex gap-2">
              {(
                [
                  { id: "image/jpeg" as const, label: "JPG" },
                  { id: "image/webp" as const, label: "WebP" },
                ] as const
              ).map((item) => (
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
            <p className="mt-2 text-[11px] leading-5 text-ink-400">
              WebP معمولاً حجم کمتری می‌دهد؛ JPG سازگاری بیشتری دارد.
            </p>
          </fieldset>

          <button
            type="button"
            onClick={() => void handleCompress()}
            disabled={busy}
            className="mt-4 w-full rounded-lg bg-brand-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-brand-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {busy ? "در حال فشرده‌سازی…" : "فشرده کن"}
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
                  alt="پیش‌نمایش تصویر فشرده‌شده"
                  className="mx-auto max-h-64 rounded-lg"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div className="rounded-xl border border-ink-200 bg-ink-50 px-3 py-2.5 text-center">
                  <div className="text-[11px] text-ink-500">قبل</div>
                  <div className="mt-0.5 text-sm font-extrabold text-ink-900">
                    {formatBytes(image.size)}
                  </div>
                </div>
                <div className="rounded-xl border border-brand-200 bg-brand-50 px-3 py-2.5 text-center">
                  <div className="text-[11px] text-brand-700">بعد</div>
                  <div className="mt-0.5 text-sm font-extrabold text-brand-900">
                    {formatBytes(result.blob.size)}
                  </div>
                </div>
              </div>

              <div
                className={cn(
                  "rounded-xl px-4 py-3 text-center text-sm font-bold",
                  savedPercent > 0
                    ? "bg-emerald-50 text-emerald-800"
                    : "bg-amber-50 text-amber-800",
                )}
              >
                {savedPercent > 0
                  ? `${toPersianDigits(savedPercent)}٪ کوچک‌تر شد`
                  : "حجم کم نشد — کیفیت بالاتر یا قالب WebP را امتحان کنید."}
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
              تنظیمات را انتخاب کنید و دکمهٔ «فشرده کن» را بزنید.
            </div>
          )}
        </div>
      </div>

      <p className="mt-4 text-xs leading-6 text-ink-400">
        کیفیت و ابعاد را متعادل انتخاب کنید: کاهش کیفیت و کوچک‌کردن ابعاد بیشترین
        تأثیر را روی حجم دارند. فایل شما هرگز آپلود نمی‌شود.
      </p>
    </div>
  );
}
