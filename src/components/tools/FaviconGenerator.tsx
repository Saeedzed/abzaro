"use client";

import { useEffect, useRef, useState } from "react";
import { Download, Package, Upload } from "lucide-react";
import {
  downloadBlob,
  formatBytes,
  isLoadError,
  loadImageFile,
  type LoadedImage,
} from "@/lib/image";
import { toPersianDigits } from "@/lib/persian";
import { cn } from "@/lib/utils";
import { ToolPanel } from "./shared";

/** The sizes every browser + OS combination asks for. */
const SIZES = [
  { name: "favicon-16.png", size: 16, label: "۱۶×۱۶ (تب مرورگر)" },
  { name: "favicon-32.png", size: 32, label: "۳۲×۳۲ (تب و بوکمارک)" },
  { name: "apple-touch-icon.png", size: 180, label: "۱۸۰×۱۸۰ (آیکون آیفون)" },
  { name: "android-chrome-192.png", size: 192, label: "۱۹۲×۱۹۲ (اندروید)" },
  { name: "android-chrome-512.png", size: 512, label: "۵۱۲×۵۱۲ (PWA بزرگ)" },
] as const;

const BACKGROUNDS = [
  { id: "white", label: "سفید", value: "#ffffff" },
  { id: "transparent", label: "شفاف", value: null },
] as const;

const MANIFEST = JSON.stringify(
  {
    name: "My Site",
    short_name: "Site",
    icons: [
      { src: "/android-chrome-192.png", sizes: "192x192", type: "image/png" },
      { src: "/android-chrome-512.png", sizes: "512x512", type: "image/png" },
    ],
    theme_color: "#ffffff",
    background_color: "#ffffff",
    display: "standalone",
  },
  null,
  2,
);

/**
 * ساخت favicon از یک عکس: پنج سایز استاندارد PNG در یک فایل ZIP، به‌همراه
 * site.webmanifest و کد HTML آمادهٔ کپی. همه‌چیز در مرورگر.
 */
export function FaviconGenerator() {
  const [image, setImage] = useState<LoadedImage | null>(null);
  const [sourceFile, setSourceFile] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [background, setBackground] = useState<(typeof BACKGROUNDS)[number]>(BACKGROUNDS[0]);
  const [radius, setRadius] = useState(0);
  const [busy, setBusy] = useState(false);
  const [zip, setZip] = useState<{ blob: Blob; size: number } | null>(null);
  const [dragging, setDragging] = useState(false);
  const [copied, setCopied] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // One object URL for the source preview, revoked when the image changes.
  useEffect(() => {
    if (!image || !sourceFile) {
      setPreviewUrl(null);
      return;
    }
    const url = URL.createObjectURL(sourceFile);
    setPreviewUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [image, sourceFile]);

  useEffect(() => {
    if (!image) return;
    return () => image.bitmap.close();
  }, [image]);

  async function handleFile(file: File | undefined) {
    if (!file) return;
    setError(null);
    setZip(null);
    const loaded = await loadImageFile(file);
    if (isLoadError(loaded)) {
      setError(loaded.message);
      setImage(null);
      return;
    }
    setImage(loaded);
    setSourceFile(file);
  }

  function renderSize(size: number, canvas: HTMLCanvasElement) {
    if (!image) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    canvas.width = size;
    canvas.height = size;

    // Square-crop from the centre of the source image.
    const side = Math.min(image.width, image.height);
    const sx = (image.width - side) / 2;
    const sy = (image.height - side) / 2;

    if (background.value) {
      ctx.fillStyle = background.value;
      ctx.fillRect(0, 0, size, size);
    }
    if (radius > 0) {
      const r = (size / 2) * radius;
      ctx.beginPath();
      ctx.moveTo(r, 0);
      ctx.arcTo(size, 0, size, size, r);
      ctx.arcTo(size, size, 0, size, r);
      ctx.arcTo(0, size, 0, 0, r);
      ctx.arcTo(0, 0, size, 0, r);
      ctx.closePath();
      ctx.clip();
    }
    ctx.drawImage(image.bitmap, sx, sy, side, side, 0, 0, size, size);
  }

  async function buildZip() {
    if (!image) return;
    setBusy(true);
    setError(null);
    try {
      const { default: JSZip } = await import("jszip");
      const archive = new JSZip();

      for (const entry of SIZES) {
        const canvas = document.createElement("canvas");
        renderSize(entry.size, canvas);
        const blob = await new Promise<Blob | null>((resolve) =>
          canvas.toBlob(resolve, "image/png"),
        );
        if (!blob) throw new Error("encode-failed");
        archive.file(entry.name, blob);
      }

      archive.file("site.webmanifest", MANIFEST);
      archive.file(
        "README.txt",
        [
          "فایل‌های favicon را در ریشهٔ سایت آپلود کنید.",
          "",
          "در بخش <head> صفحات این خطوط را اضافه کنید:",
          '<link rel="icon" href="/favicon-32.png" sizes="32x32">',
          '<link rel="icon" href="/favicon-16.png" sizes="16x16">',
          '<link rel="apple-touch-icon" href="/apple-touch-icon.png">',
          '<link rel="manifest" href="/site.webmanifest">',
        ].join("\n"),
      );

      const blob = await archive.generateAsync({ type: "blob" });
      setZip({ blob, size: blob.size });
    } catch {
      setError("ساخت فایل ZIP انجام نشد. یک عکس دیگر امتحان کنید.");
    } finally {
      setBusy(false);
    }
  }

  async function copySnippet() {
    const snippet = [
      '<link rel="icon" href="/favicon-32.png" sizes="32x32">',
      '<link rel="icon" href="/favicon-16.png" sizes="16x16">',
      '<link rel="apple-touch-icon" href="/apple-touch-icon.png">',
      '<link rel="manifest" href="/site.webmanifest">',
    ].join("\n");
    try {
      await navigator.clipboard.writeText(snippet);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard blocked.
    }
  }

  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <ToolPanel
        title="عکس پایه"
        description="بهترین نتیجه: عکس مربعی با پس‌زمینهٔ ساده"
        icon={<Package className="h-4 w-4 text-brand-600" aria-hidden="true" />}
      >
        <div className="space-y-4">
          <input
            ref={inputRef}
            type="file"
            accept="image/*"
            data-testid="favicon-input"
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
            data-testid="favicon-dropzone"
            className={cn(
              "flex cursor-pointer flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed px-4 py-8 text-center transition",
              dragging
                ? "border-brand-500 bg-brand-50"
                : "border-ink-200 bg-ink-50/40 hover:border-brand-300",
            )}
          >
            <Upload className="h-6 w-6 text-brand-500" aria-hidden="true" />
            <p className="text-sm font-semibold text-ink-700">عکس یا لوگو را انتخاب کنید</p>
            <p className="text-[11px] text-ink-400">PNG با پس‌زمینهٔ شفاف بهترین گزینه است</p>
          </div>

          {error && (
            <p
              data-testid="favicon-error"
              className="rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-xs text-rose-700"
            >
              {error}
            </p>
          )}

          {image && (
            <>
              <div className="flex items-center gap-3 rounded-xl bg-ink-50 px-3 py-2">
                <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-white shadow-card">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={previewUrl ?? ""}
                    alt=""
                    className="h-10 w-10 rounded"
                  />
                </div>
                <div className="min-w-0 text-[11px] text-ink-600">
                  <p className="truncate font-semibold">{image.name}</p>
                  <p>
                    {toPersianDigits(image.width)}×{toPersianDigits(image.height)} ·{" "}
                    {formatBytes(image.size)}
                  </p>
                </div>
              </div>

              <div>
                <p className="mb-2 text-xs font-semibold text-ink-700">پس‌زمینه</p>
                <div className="flex gap-2">
                  {BACKGROUNDS.map((item) => (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => setBackground(item)}
                      aria-pressed={background.id === item.id}
                      className={cn(
                        "flex-1 rounded-lg border px-2 py-1.5 text-[11px] font-semibold transition",
                        background.id === item.id
                          ? "border-brand-300 bg-brand-50 text-brand-700"
                          : "border-ink-200 text-ink-600 hover:bg-ink-100",
                      )}
                    >
                      {item.label}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between text-xs font-semibold text-ink-700">
                  <label htmlFor="favicon-radius">گردی گوشه‌ها</label>
                  <span className="text-brand-700">
                    {radius === 0 ? "بدون گردی" : radius === 1 ? "دایره" : `${toPersianDigits(Math.round(radius * 100))}٪`}
                  </span>
                </div>
                <input
                  id="favicon-radius"
                  type="range"
                  min={0}
                  max={1}
                  step={0.05}
                  value={radius}
                  onChange={(event) => setRadius(Number(event.target.value))}
                  className="mt-1 w-full accent-brand-600"
                />
              </div>

              <button
                type="button"
                onClick={buildZip}
                disabled={busy}
                data-testid="favicon-run"
                className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-brand-600 px-4 py-2.5 text-sm font-bold text-white shadow-card transition hover:bg-brand-700 disabled:opacity-60"
              >
                <Package className="h-4 w-4" aria-hidden="true" />
                {busy ? "در حال ساخت…" : "ساخت بستهٔ favicon"}
              </button>
            </>
          )}
        </div>
      </ToolPanel>

      <ToolPanel
        title="فایل‌های خروجی"
        description="پنج سایز PNG + manifest + راهنما"
        icon={<Download className="h-4 w-4 text-brand-600" aria-hidden="true" />}
      >
        <ul className="space-y-1.5 text-[11px] text-ink-600">
          {SIZES.map((entry) => (
            <li
              key={entry.name}
              className="flex items-center justify-between rounded-lg bg-ink-50 px-3 py-1.5"
            >
              <code dir="ltr" className="text-ink-800">
                {entry.name}
              </code>
              <span className="text-ink-400">{entry.label}</span>
            </li>
          ))}
          <li className="flex items-center justify-between rounded-lg bg-ink-50 px-3 py-1.5">
            <code dir="ltr" className="text-ink-800">
              site.webmanifest
            </code>
            <span className="text-ink-400">تنظیمات PWA</span>
          </li>
        </ul>

        {zip && (
          <div className="mt-3 space-y-2" data-testid="favicon-result">
            <button
              type="button"
              onClick={() => downloadBlob(zip.blob, "favicon-package.zip")}
              data-testid="favicon-download"
              className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-brand-300 bg-brand-50 px-4 py-2.5 text-sm font-bold text-brand-800 transition hover:bg-brand-100"
            >
              <Download className="h-4 w-4" aria-hidden="true" />
              دانلود ZIP ({formatBytes(zip.size)})
            </button>
          </div>
        )}

        <div className="mt-4">
          <div className="flex items-center justify-between">
            <p className="text-xs font-semibold text-ink-700">کد HTML آماده</p>
            <button
              type="button"
              onClick={copySnippet}
              className="text-[11px] font-semibold text-brand-700 transition hover:text-brand-800"
            >
              {copied ? "کپی شد" : "کپی"}
            </button>
          </div>
          <pre
            dir="ltr"
            className="mt-1 overflow-x-auto rounded-xl bg-ink-900 p-3 text-[10px] leading-5 text-ink-100"
          >
            {`<link rel="icon" href="/favicon-32.png" sizes="32x32">
<link rel="icon" href="/favicon-16.png" sizes="16x16">
<link rel="apple-touch-icon" href="/apple-touch-icon.png">
<link rel="manifest" href="/site.webmanifest">`}
          </pre>
        </div>
      </ToolPanel>
    </div>
  );
}
