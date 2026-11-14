"use client";

import { useEffect, useRef, useState } from "react";
import { Download, FileImage, Loader2, RotateCcw, Wand2 } from "lucide-react";
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
import { UploadZone } from "./UploadZone";

const TARGETS = [
  { value: "image/png" as const, label: "PNG", hint: "بدون افت کیفیت · پشتیبانی از شفافیت" },
  { value: "image/jpeg" as const, label: "JPG", hint: "حجم کم · مناسب عکس" },
  { value: "image/webp" as const, label: "WebP", hint: "کم‌حجم‌ترین حالت" },
];

/**
 * JPG ↔ PNG (and WebP) converter. Re-encodes the picture in a canvas, so the
 * conversion is lossless only for PNG; JPEG quality is adjustable.
 */
export function ImageFormatConverter() {
  const [image, setImage] = useState<LoadedImage | null>(null);
  const [target, setTarget] = useState<OutputFormat>("image/png");
  const [quality, setQuality] = useState(0.92);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<{ blob: Blob; width: number; height: number } | null>(null);
  const [resultUrl, setResultUrl] = useState<string | null>(null);
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

  async function handleFiles(files: File[]) {
    const file = files[0];
    if (!file) return;
    setError(null);
    setResult(null);
    const loaded = await loadImageFile(file);
    if (isLoadError(loaded)) {
      setError(loaded.message);
      return;
    }
    setImage(loaded);
    // Sensible default: photos → JPG, everything else → PNG.
    setTarget(loaded.type === "image/jpeg" ? "image/png" : "image/jpeg");
  }

  async function convert() {
    if (!image) return;
    setBusy(true);
    setError(null);
    try {
      const blob = await renderImage(image.bitmap, {
        width: image.width,
        height: image.height,
        format: target,
        quality,
      });
      setResult({ blob, width: image.width, height: image.height });
    } catch {
      setError("تبدیل قالب ممکن نشد. فایل دیگری را امتحان کنید.");
    } finally {
      setBusy(false);
    }
  }

  if (!image) {
    return (
      <UploadZone
        title="تصویر را اینجا رها کنید"
        hint="JPG، PNG، WebP، GIF یا AVIF — حداکثر ۲۵ مگابایت"
        buttonLabel="انتخاب تصویر"
        accept="image/*"
        onFiles={(files) => void handleFiles(files)}
        icon={<FileImage className="h-7 w-7" aria-hidden="true" />}
        error={error}
        testId="format-input"
      />
    );
  }

  const extension = extensionFor(target);
  const sizeDelta = result ? Math.round(((image.size - result.blob.size) / image.size) * 100) : 0;

  return (
    <div>
      <div className="rounded-2xl border border-ink-200 bg-white p-4 shadow-card sm:p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="min-w-0">
            <p className="truncate text-sm font-bold text-ink-900">{image.name}</p>
            <p className="mt-0.5 text-xs text-ink-500">
              {toPersianDigits(image.width)} × {toPersianDigits(image.height)} پیکسل ·{" "}
              {formatBytes(image.size)} · {image.type.replace("image/", "").toUpperCase()}
            </p>
          </div>
          <button
            type="button"
            onClick={() => {
              setImage(null);
              setResult(null);
              setError(null);
              if (inputRef.current) inputRef.current.value = "";
            }}
            className="inline-flex items-center gap-2 rounded-lg border border-ink-200 px-3 py-2 text-xs font-semibold text-ink-700 transition hover:bg-ink-100"
          >
            <RotateCcw className="h-3.5 w-3.5" aria-hidden="true" />
            تصویر دیگر
          </button>
        </div>
        <input ref={inputRef} type="file" accept="image/*" className="sr-only" aria-label="تعویض تصویر" />
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-2">
        <div className="rounded-2xl border border-ink-200 bg-white p-4 shadow-card sm:p-5">
          <h3 className="flex items-center gap-2 text-sm font-bold text-ink-900">
            <Wand2 className="h-4 w-4 text-brand-600" aria-hidden="true" />
            قالب خروجی
          </h3>

          <div className="mt-3 flex flex-col gap-2">
            {TARGETS.map((item) => (
              <label
                key={item.value}
                className={cn(
                  "flex cursor-pointer items-center gap-3 rounded-lg border px-3 py-2 text-xs font-medium transition",
                  target === item.value
                    ? "border-brand-300 bg-brand-50 text-ink-900"
                    : "border-ink-200 text-ink-600 hover:bg-ink-50",
                )}
              >
                <input
                  type="radio"
                  name="format-target"
                  checked={target === item.value}
                  onChange={() => {
                    setTarget(item.value);
                    setResult(null);
                  }}
                  className="h-3.5 w-3.5 accent-brand-600"
                />
                <span>
                  {item.label}
                  <span className="ms-1.5 text-[10px] text-ink-400">{item.hint}</span>
                </span>
              </label>
            ))}
          </div>

          {target !== "image/png" && (
            <div className="mt-4">
              <label htmlFor="format-quality" className="mb-1.5 block text-xs font-semibold text-ink-700">
                کیفیت: {toPersianDigits(Math.round(quality * 100))}٪
              </label>
              <input
                id="format-quality"
                type="range"
                min={30}
                max={100}
                step={1}
                value={Math.round(quality * 100)}
                onChange={(event) => {
                  setQuality(Number(event.target.value) / 100);
                  setResult(null);
                }}
                className="w-full accent-brand-600"
              />
            </div>
          )}

          <button
            type="button"
            onClick={() => void convert()}
            disabled={busy}
            data-testid="format-convert"
            className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-lg bg-brand-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-brand-700 disabled:opacity-50"
          >
            {busy && <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />}
            تبدیل به {target.replace("image/", "").toUpperCase()}
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
            <div className="mt-3 space-y-3" data-testid="format-result">
              <div className="overflow-hidden rounded-xl border border-ink-200 bg-ink-50 p-2">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={resultUrl} alt="پیش‌نمایش تصویر تبدیل‌شده" className="mx-auto max-h-56 rounded-lg" />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div className="rounded-xl border border-ink-200 bg-ink-50 px-3 py-2.5 text-center">
                  <div className="text-[11px] text-ink-500">قبل</div>
                  <div className="mt-0.5 text-sm font-extrabold text-ink-900">{formatBytes(image.size)}</div>
                </div>
                <div className="rounded-xl border border-brand-200 bg-brand-50 px-3 py-2.5 text-center">
                  <div className="text-[11px] text-brand-700">بعد</div>
                  <div className="mt-0.5 text-sm font-extrabold text-brand-900">{formatBytes(result.blob.size)}</div>
                </div>
              </div>
              <p className="text-center text-[11px] text-ink-500">
                {sizeDelta > 0
                  ? `${toPersianDigits(sizeDelta)}٪ کوچک‌تر شد`
                  : `${toPersianDigits(Math.abs(sizeDelta))}٪ بزرگ‌تر شد`}
              </p>
              <button
                type="button"
                onClick={() =>
                  downloadBlob(
                    result.blob,
                    `${image.name.replace(/\.[^.]+$/, "") || "image"}.${extension}`,
                  )
                }
                data-testid="format-download"
                className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-brand-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-brand-700"
              >
                <Download className="h-4 w-4" aria-hidden="true" />
                دانلود {target.replace("image/", "").toUpperCase()}
              </button>
            </div>
          ) : (
            <div className="mt-3 rounded-xl border border-dashed border-ink-200 bg-ink-50/60 px-4 py-10 text-center text-sm text-ink-400">
              قالب دلخواه را انتخاب کنید و دکمهٔ تبدیل را بزنید.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
