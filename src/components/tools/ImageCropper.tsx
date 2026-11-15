"use client";

import { useEffect, useRef, useState } from "react";
import { Crop, Download, Upload } from "lucide-react";
import {
  downloadBlob,
  extensionFor,
  formatBytes,
  isLoadError,
  loadImageFile,
  type LoadedImage,
  type OutputFormat,
} from "@/lib/image";
import { toPersianDigits } from "@/lib/persian";
import { cn } from "@/lib/utils";
import { ToolPanel } from "./shared";
import { DeviceLimitLabel } from "./DeviceLimitLabel";
import { CropEditor, fitRatioRect, type CropRect } from "./CropEditor";

interface RatioPreset {
  id: string;
  label: string;
  /** width / height — 0 means free */
  ratio: number;
  hint?: string;
}

const RATIOS: RatioPreset[] = [
  { id: "free", label: "آزاد", ratio: 0 },
  { id: "1:1", label: "۱:۱", ratio: 1, hint: "پست اینستاگرام" },
  { id: "4:5", label: "۴:۵", ratio: 4 / 5, hint: "پست عمودی" },
  { id: "9:16", label: "۹:۱۶", ratio: 9 / 16, hint: "استوری / ریلز" },
  { id: "16:9", label: "۱۶:۹", ratio: 16 / 9, hint: "کاور یوتیوب" },
  { id: "3:2", label: "۳:۲", ratio: 3 / 2 },
];

const FORMATS: Array<{ id: OutputFormat; label: string }> = [
  { id: "image/jpeg", label: "JPG" },
  { id: "image/png", label: "PNG" },
  { id: "image/webp", label: "WebP" },
];

/**
 * برش تصویر با نسبت‌های آمادهٔ شبکه‌های اجتماعی.
 * The crop box is chosen on a scaled preview but the canvas always renders
 * from the ORIGINAL bitmap, so the output is full resolution.
 */
export function ImageCropper() {
  const [image, setImage] = useState<LoadedImage | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [preset, setPreset] = useState<RatioPreset>(RATIOS[1] as RatioPreset);
  const [format, setFormat] = useState<OutputFormat>("image/jpeg");
  const [rect, setRect] = useState<CropRect>({ x: 0, y: 0, w: 0, h: 0 });
  const [sourceUrl, setSourceUrl] = useState<string | null>(null);
  const [sourceFile, setSourceFile] = useState<File | null>(null);
  const [result, setResult] = useState<{ blob: Blob; width: number; height: number } | null>(null);
  const [resultUrl, setResultUrl] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
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

  // Object URL of the picked file, used by the on-image crop editor.
  useEffect(() => {
    if (!sourceFile) {
      setSourceUrl(null);
      return;
    }
    const url = URL.createObjectURL(sourceFile);
    setSourceUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [sourceFile]);

  async function handleFile(file: File | undefined) {
    if (!file) return;
    setError(null);
    setResult(null);
    const loaded = await loadImageFile(file);
    if (isLoadError(loaded)) {
      setError(loaded.message);
      setImage(null);
      setSourceFile(null);
      return;
    }
    setSourceFile(file);
    setImage(loaded);
    setRect(
      loaded ? fitRatioRect(loaded.width, loaded.height, preset.ratio) : { x: 0, y: 0, w: 0, h: 0 },
    );
  }

  /** Re-fit the box (keeping its centre) when the ratio preset changes. */
  function applyRatio(next: RatioPreset) {
    setPreset(next);
    if (!image) return;
    setRect((current) => {
      if (!next.ratio) return { x: 0, y: 0, w: image.width, h: image.height };
      const cx = current.w ? current.x + current.w / 2 : image.width / 2;
      const cy = current.h ? current.y + current.h / 2 : image.height / 2;
      const areaScale = current.w
        ? Math.min(1, current.w / image.width)
        : 1;
      return fitRatioRect(image.width, image.height, next.ratio, cx, cy, areaScale);
    });
  }

  async function handleCrop() {
    if (!image) return;
    setBusy(true);
    setError(null);
    try {
      const sx = Math.round(rect.x);
      const sy = Math.round(rect.y);
      const sw = Math.max(1, Math.round(rect.w));
      const sh = Math.max(1, Math.round(rect.h));
      const outWidth = Math.round(sw);
      const outHeight = Math.round(sh);
      const canvas = document.createElement("canvas");
      canvas.width = outWidth;
      canvas.height = outHeight;
      const ctx = canvas.getContext("2d");
      if (!ctx) throw new Error("no-canvas");
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(0, 0, outWidth, outHeight);
      ctx.drawImage(image.bitmap, sx, sy, sw, sh, 0, 0, outWidth, outHeight);

      const blob = await new Promise<Blob | null>((resolve) =>
        canvas.toBlob(resolve, format, 0.92),
      );
      if (!blob) throw new Error("encode-failed");
      setResult({ blob, width: outWidth, height: outHeight });
    } catch {
      setError("برش تصویر انجام نشد. یک تصویر دیگر امتحان کنید.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <ToolPanel
        title="انتخاب و برش"
        description="نسبت دلخواه یا نسبت‌های آمادهٔ شبکه‌های اجتماعی"
        icon={<Crop className="h-4 w-4 text-brand-600" aria-hidden="true" />}
      >
        <div className="space-y-4">
          <input
            ref={inputRef}
            type="file"
            accept="image/*"
            data-testid="crop-input"
            className="hidden"
            onChange={(event) => handleFile(event.target.files?.[0])}
          />
          <div
            onDragOver={(event) => {
              event.preventDefault();
              setDragging(true);
            }}
            onDragLeave={() => setDragging(false)}
            onDrop={(event) => {
              event.preventDefault();
              setDragging(false);
              handleFile(event.dataTransfer.files?.[0]);
            }}
            onClick={() => inputRef.current?.click()}
            role="button"
            tabIndex={0}
            onKeyDown={(event) => event.key === "Enter" && inputRef.current?.click()}
            data-testid="crop-dropzone"
            className={cn(
              "flex cursor-pointer flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed px-4 py-8 text-center transition",
              dragging
                ? "border-brand-500 bg-brand-50"
                : "border-ink-200 bg-ink-50/40 hover:border-brand-300",
            )}
          >
            <Upload className="h-6 w-6 text-brand-500" aria-hidden="true" />
            <p className="text-sm font-semibold text-ink-700">
              عکس را بکشید یا کلیک کنید
            </p>
            <p className="text-[11px] text-ink-400">JPG، PNG، WebP · تا <DeviceLimitLabel /></p>
          </div>

          {error && (
            <p
              data-testid="crop-error"
              className="rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-xs text-rose-700"
            >
              {error}
            </p>
          )}

          {image && (
            <>
              <div className="flex items-center justify-between rounded-xl bg-ink-50 px-3 py-2 text-[11px] text-ink-600">
                <span className="truncate">{image.name}</span>
                <span>
                  {toPersianDigits(image.width)}×{toPersianDigits(image.height)} ·{" "}
                  {formatBytes(image.size)}
                </span>
              </div>

              <CropEditor
                src={sourceUrl ?? ""}
                imageWidth={image.width}
                imageHeight={image.height}
                ratio={preset.ratio}
                rect={rect}
                onRectChange={setRect}
              />

              <div>
                <p className="mb-2 text-xs font-semibold text-ink-700">نسبت برش</p>
                <div className="grid grid-cols-3 gap-2">
                  {RATIOS.map((item) => (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => applyRatio(item)}
                      aria-pressed={preset.id === item.id}
                      data-testid={`crop-ratio-${item.id}`}
                      className={cn(
                        "rounded-xl border px-2 py-2 text-[11px] transition",
                        preset.id === item.id
                          ? "border-brand-500 bg-brand-50 font-bold text-brand-800"
                          : "border-ink-200 bg-white text-ink-600 hover:border-brand-300",
                      )}
                    >
                      <span dir="ltr">{item.label}</span>
                      {item.hint && (
                        <span className="mt-0.5 block text-[9px] font-normal text-ink-400">
                          {item.hint}
                        </span>
                      )}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <p className="mb-2 text-xs font-semibold text-ink-700">قالب خروجی</p>
                <div className="flex gap-2">
                  {FORMATS.map((item) => (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => setFormat(item.id)}
                      aria-pressed={format === item.id}
                      className={cn(
                        "flex-1 rounded-lg border px-2 py-1.5 text-[11px] font-semibold transition",
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
                onClick={handleCrop}
                disabled={busy}
                data-testid="crop-run"
                className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-brand-600 px-4 py-2.5 text-sm font-bold text-white shadow-card transition hover:bg-brand-700 disabled:opacity-60"
              >
                <Crop className="h-4 w-4" aria-hidden="true" />
                {busy ? "در حال برش…" : "برش تصویر"}
              </button>
            </>
          )}
        </div>
      </ToolPanel>

      <ToolPanel
        title="پیش‌نمایش و دانلود"
        description={result ? `${toPersianDigits(result.width)}×${toPersianDigits(result.height)}` : undefined}
        icon={<Download className="h-4 w-4 text-brand-600" aria-hidden="true" />}
      >
        {result && resultUrl ? (
          <div className="space-y-3" data-testid="crop-result">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={resultUrl}
              alt="نتیجهٔ برش"
              className="max-h-80 w-full rounded-xl border border-ink-200 object-contain"
            />
            <div className="flex items-center justify-between text-[11px] text-ink-500">
              <span>{formatBytes(result.blob.size)}</span>
              <span>
                {toPersianDigits(result.width)}×{toPersianDigits(result.height)}
              </span>
            </div>
            <button
              type="button"
              onClick={() =>
                downloadBlob(result.blob, `cropped.${extensionFor(format)}`)
              }
              data-testid="crop-download"
              className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-brand-300 bg-brand-50 px-4 py-2.5 text-sm font-bold text-brand-800 transition hover:bg-brand-100"
            >
              <Download className="h-4 w-4" aria-hidden="true" />
              دانلود تصویر برش‌خورده
            </button>
          </div>
        ) : (
          <p className="rounded-xl border border-dashed border-ink-200 bg-ink-50/60 px-4 py-10 text-center text-sm text-ink-400">
            {image ? "نسبت را انتخاب کنید و «برش تصویر» را بزنید." : "اول یک تصویر انتخاب کنید."}
          </p>
        )}
      </ToolPanel>
    </div>
  );
}
