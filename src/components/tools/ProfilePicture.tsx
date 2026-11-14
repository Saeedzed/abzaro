"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Download, Loader2, RotateCcw, UserRound, ZoomIn } from "lucide-react";
import { downloadBlob, formatBytes } from "@/lib/image";
import { toPersianDigits } from "@/lib/persian";
import { cn } from "@/lib/utils";
import { UploadZone } from "./UploadZone";

const PRESETS = [
  { size: 400, label: "شبکه اجتماعی", hint: "۴۰۰ × ۴۰۰" },
  { size: 512, label: "تلگرام / دیسکورد", hint: "۵۱۲ × ۵۱۲" },
  { size: 200, label: "ایمیل / اسناد", hint: "۲۰۰ × ۲۰۰" },
  { size: 1024, label: "چاپ / کیفیت بالا", hint: "۱۰۲۴ × ۱۰۲۴" },
];

const SHAPES = [
  { id: "circle" as const, label: "دایره" },
  { id: "rounded" as const, label: "گوشه‌گرد" },
  { id: "square" as const, label: "مربع" },
];

const BACKGROUNDS = [
  { id: "white" as const, color: "#ffffff", label: "سفید" },
  { id: "light" as const, color: "#f1f5f9", label: "خاکستری" },
  { id: "brand" as const, color: "#2563eb", label: "آبی" },
  { id: "dark" as const, color: "#0f172a", label: "تیره" },
];

/**
 * Profile picture maker.
 *
 * Crops the uploaded photo to a square, lets the visitor zoom and change the
 * background/shape, then exports a PNG at the exact size they need.
 */
export function ProfilePicture() {
  const [file, setFile] = useState<File | null>(null);
  const [bitmap, setBitmap] = useState<ImageBitmap | null>(null);
  const [size, setSize] = useState(400);
  const [zoom, setZoom] = useState(1);
  const [shape, setShape] = useState<(typeof SHAPES)[number]["id"]>("circle");
  const [background, setBackground] = useState<(typeof BACKGROUNDS)[number]["id"]>("white");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<{ blob: Blob; url: string } | null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (!result) return;
    return () => URL.revokeObjectURL(result.url);
  }, [result]);

  useEffect(() => {
    if (!bitmap) return;
    return () => bitmap.close();
  }, [bitmap]);

  const draw = useCallback(
    (canvas: HTMLCanvasElement) => {
      if (!bitmap) return;
      const context = canvas.getContext("2d");
      if (!context) return;
      const bg = BACKGROUNDS.find((item) => item.id === background)?.color ?? "#ffffff";

      canvas.width = size;
      canvas.height = size;
      context.clearRect(0, 0, size, size);
      context.fillStyle = bg;
      context.fillRect(0, 0, size, size);

      // Cover the square, then apply the zoom.
      const scale = (size / Math.min(bitmap.width, bitmap.height)) * zoom;
      const drawnWidth = bitmap.width * scale;
      const drawnHeight = bitmap.height * scale;
      const dx = (size - drawnWidth) / 2;
      const dy = (size - drawnHeight) / 2;

      context.save();
      if (shape === "circle") {
        context.beginPath();
        context.arc(size / 2, size / 2, size / 2, 0, Math.PI * 2);
        context.clip();
      } else if (shape === "rounded") {
        const radius = size * 0.18;
        context.beginPath();
        context.roundRect(0, 0, size, size, radius);
        context.clip();
      }
      context.imageSmoothingEnabled = true;
      context.imageSmoothingQuality = "high";
      context.drawImage(bitmap, dx, dy, drawnWidth, drawnHeight);
      context.restore();
    },
    [bitmap, size, zoom, shape, background],
  );

  // Live preview on the canvas.
  useEffect(() => {
    const canvas = canvasRef.current;
    if (canvas && bitmap) draw(canvas);
  }, [bitmap, draw]);

  async function handleFiles(files: File[]) {
    const picked = files[0];
    if (!picked) return;
    setError(null);
    setResult(null);
    if (!picked.type.startsWith("image/")) {
      setError("فقط فایل تصویری پذیرفته می‌شود.");
      return;
    }
    try {
      const loaded = await createImageBitmap(picked);
      setBitmap(loaded);
      setFile(picked);
      setZoom(1);
    } catch {
      setError("خواندن این تصویر ممکن نشد.");
    }
  }

  async function exportPng() {
    if (!bitmap) return;
    setBusy(true);
    setError(null);
    try {
      const canvas = document.createElement("canvas");
      draw(canvas);
      const blob = await new Promise<Blob | null>((resolve) => {
        canvas.toBlob(resolve, "image/png");
      });
      if (!blob) throw new Error("Encoding failed.");
      setResult({ blob, url: URL.createObjectURL(blob) });
    } catch {
      setError("ساخت تصویر ممکن نشد.");
    } finally {
      setBusy(false);
    }
  }

  if (!bitmap) {
    return (
      <UploadZone
        title="عکس خود را اینجا رها کنید"
        hint="JPG، PNG یا WebP — حداکثر ۲۵ مگابایت"
        buttonLabel="انتخاب عکس"
        accept="image/*"
        onFiles={(files) => void handleFiles(files)}
        icon={<UserRound className="h-7 w-7" aria-hidden="true" />}
        error={error}
        testId="profile-input"
      />
    );
  }

  return (
    <div>
      <div className="grid gap-4 lg:grid-cols-2">
        <div className="rounded-2xl border border-ink-200 bg-white p-4 shadow-card sm:p-5">
          <h3 className="flex items-center gap-2 text-sm font-bold text-ink-900">
            <UserRound className="h-4 w-4 text-brand-600" aria-hidden="true" />
            پیش‌نمایش
          </h3>
          <div className="mt-3 flex justify-center rounded-xl border border-ink-200 bg-ink-50 p-4">
            <canvas
              ref={canvasRef}
              width={size}
              height={size}
              data-testid="profile-canvas"
              className="h-48 w-48 rounded-lg shadow-card"
              aria-label="پیش‌نمایش تصویر پروفایل"
            />
          </div>

          <div className="mt-4">
            <label htmlFor="profile-zoom" className="mb-1.5 flex items-center gap-1.5 text-xs font-semibold text-ink-700">
              <ZoomIn className="h-3.5 w-3.5" aria-hidden="true" />
              بزرگ‌نمایی: {toPersianDigits(Math.round(zoom * 100))}٪
            </label>
            <input
              id="profile-zoom"
              type="range"
              min={100}
              max={300}
              step={5}
              value={Math.round(zoom * 100)}
              onChange={(event) => {
                setZoom(Number(event.target.value) / 100);
                setResult(null);
              }}
              className="w-full accent-brand-600"
            />
          </div>
        </div>

        <div className="rounded-2xl border border-ink-200 bg-white p-4 shadow-card sm:p-5">
          <h3 className="text-sm font-bold text-ink-900">تنظیمات</h3>

          <fieldset className="mt-3">
            <legend className="mb-1.5 text-xs font-semibold text-ink-700">اندازهٔ خروجی</legend>
            <div className="grid grid-cols-2 gap-2">
              {PRESETS.map((preset) => (
                <button
                  key={preset.size}
                  type="button"
                  onClick={() => {
                    setSize(preset.size);
                    setResult(null);
                  }}
                  aria-pressed={size === preset.size}
                  data-testid={`profile-size-${preset.size}`}
                  className={cn(
                    "rounded-lg border px-2 py-2 text-[11px] font-semibold transition",
                    size === preset.size
                      ? "border-brand-300 bg-brand-50 text-brand-700"
                      : "border-ink-200 text-ink-600 hover:bg-ink-100",
                  )}
                >
                  {preset.label}
                  <span className="mt-0.5 block text-[10px] font-normal opacity-70">{preset.hint}</span>
                </button>
              ))}
            </div>
          </fieldset>

          <fieldset className="mt-4">
            <legend className="mb-1.5 text-xs font-semibold text-ink-700">شکل</legend>
            <div className="flex gap-2">
              {SHAPES.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => {
                    setShape(item.id);
                    setResult(null);
                  }}
                  aria-pressed={shape === item.id}
                  className={cn(
                    "flex-1 rounded-lg border px-2 py-2 text-[11px] font-semibold transition",
                    shape === item.id
                      ? "border-brand-300 bg-brand-50 text-brand-700"
                      : "border-ink-200 text-ink-600 hover:bg-ink-100",
                  )}
                >
                  {item.label}
                </button>
              ))}
            </div>
          </fieldset>

          <fieldset className="mt-4">
            <legend className="mb-1.5 text-xs font-semibold text-ink-700">پس‌زمینه</legend>
            <div className="flex gap-2">
              {BACKGROUNDS.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => {
                    setBackground(item.id);
                    setResult(null);
                  }}
                  aria-pressed={background === item.id}
                  aria-label={`پس‌زمینهٔ ${item.label}`}
                  title={item.label}
                  className={cn(
                    "h-8 flex-1 rounded-lg border-2 transition",
                    background === item.id ? "border-brand-500" : "border-ink-200",
                  )}
                  style={{ backgroundColor: item.color }}
                />
              ))}
            </div>
          </fieldset>

          <button
            type="button"
            onClick={() => void exportPng()}
            disabled={busy}
            data-testid="profile-export"
            className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-lg bg-brand-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-brand-700 disabled:opacity-50"
          >
            {busy && <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />}
            ساخت تصویر {toPersianDigits(size)}×{toPersianDigits(size)}
          </button>

          <button
            type="button"
            onClick={() => {
              setBitmap(null);
              setFile(null);
              setResult(null);
              setError(null);
            }}
            className="mt-2 inline-flex w-full items-center justify-center gap-2 rounded-lg border border-ink-200 px-4 py-2 text-xs font-semibold text-ink-700 transition hover:bg-ink-100"
          >
            <RotateCcw className="h-3.5 w-3.5" aria-hidden="true" />
            عکس دیگر
          </button>

          {error && (
            <p role="alert" className="mt-3 text-xs font-medium text-red-600">
              {error}
            </p>
          )}
        </div>
      </div>

      {result && (
        <div
          className="mt-4 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-brand-200 bg-brand-50 p-4"
          data-testid="profile-result"
        >
          <div className="flex items-center gap-3">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={result.url} alt="تصویر پروفایل نهایی" className="h-12 w-12 rounded-lg border border-brand-200" />
            <div>
              <p className="text-sm font-bold text-brand-900">
                تصویر پروفایل آماده است
              </p>
              <p className="text-[11px] text-brand-700">
                {toPersianDigits(size)} × {toPersianDigits(size)} پیکسل · {formatBytes(result.blob.size)} ·{" "}
                {file?.name ?? ""}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() =>
              downloadBlob(
                result.blob,
                `${(file?.name ?? "profile").replace(/\.[^.]+$/, "")}-${size}.png`,
              )
            }
            data-testid="profile-download"
            className="inline-flex items-center gap-2 rounded-lg bg-brand-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-brand-700"
          >
            <Download className="h-4 w-4" aria-hidden="true" />
            دانلود PNG
          </button>
        </div>
      )}
    </div>
  );
}
