"use client";

import { useCallback, useRef, useState } from "react";

import { DEFAULT_FONT_STACK, renderImageWithText } from "@/lib/text-on-image";

export default function TextOnImage() {
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [image, setImage] = useState<HTMLImageElement | null>(null);
  const [text, setText] = useState("سلام دنیا");
  const [fontSize, setFontSize] = useState(48);
  const [color, setColor] = useState("#ffffff");
  const [position, setPosition] = useState<"top" | "center" | "bottom">("bottom");
  const [opacity, setOpacity] = useState(1);
  const [band, setBand] = useState(true);
  const [bandColor, setBandColor] = useState("#000000");
  const [width, setWidth] = useState(0.9);
  const [align, setAlign] = useState<"right" | "center" | "left">("center");
  const [output, setOutput] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const objectUrl = useRef<string | null>(null);

  const onFile = useCallback((file: File | null) => {
    setOutput(null);
    setError(null);
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      setError("فایل باید تصویر باشد (JPG، PNG یا WebP).");
      return;
    }
    if (objectUrl.current) URL.revokeObjectURL(objectUrl.current);
    const url = URL.createObjectURL(file);
    objectUrl.current = url;
    const img = new Image();
    img.onload = () => {
      setImage(img);
      setImageUrl(url);
    };
    img.onerror = () => setError("این تصویر باز نشد.");
    img.src = url;
  }, []);

  const render = useCallback(async () => {
    if (!image) return;
    setBusy(true);
    setError(null);
    try {
      const { blob } = await renderImageWithText(image, {
        text,
        fontSize,
        color,
        position,
        opacity,
        band,
        bandColor,
        width,
        align,
      });
      setOutput(URL.createObjectURL(blob));
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : String(cause));
    } finally {
      setBusy(false);
    }
  }, [image, text, fontSize, color, position, opacity, band, bandColor, width, align]);

  return (
    <div className="space-y-6">
      <section className="rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-700 dark:bg-slate-900">
        <input
          type="file"
          accept="image/*"
          data-testid="toi-file"
          onChange={(event) => onFile(event.target.files?.[0] ?? null)}
          className="block w-full cursor-pointer rounded-lg border border-dashed border-slate-300 bg-slate-50 px-3 py-5 text-sm file:me-3 file:rounded-md file:border-0 file:bg-emerald-600 file:px-3 file:py-1.5 file:text-white dark:border-slate-600 dark:bg-slate-800 dark:text-slate-300"
        />

        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <label className="block sm:col-span-2">
            <span className="mb-1 block text-xs text-slate-500 dark:text-slate-400">متن</span>
            <textarea
              data-testid="toi-text"
              value={text}
              rows={2}
              onChange={(event) => setText(event.target.value)}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100"
            />
          </label>
          <label className="block">
            <span className="mb-1 block text-xs text-slate-500 dark:text-slate-400">
              اندازهٔ فونت: {fontSize}px
            </span>
            <input type="range" min={12} max={200} value={fontSize} data-testid="toi-size"
              onChange={(event) => setFontSize(Number(event.target.value))} className="w-full" />
          </label>
          <label className="block">
            <span className="mb-1 block text-xs text-slate-500 dark:text-slate-400">رنگ متن</span>
            <input type="color" value={color} data-testid="toi-color"
              onChange={(event) => setColor(event.target.value)}
              className="h-9 w-full rounded-lg border border-slate-300 dark:border-slate-600" />
          </label>
          <label className="block">
            <span className="mb-1 block text-xs text-slate-500 dark:text-slate-400">جای متن</span>
            <select value={position} data-testid="toi-position"
              onChange={(event) => setPosition(event.target.value as typeof position)}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100">
              <option value="top">بالا</option>
              <option value="center">وسط</option>
              <option value="bottom">پایین</option>
            </select>
          </label>
          <label className="block">
            <span className="mb-1 block text-xs text-slate-500 dark:text-slate-400">
              شفافیت: {Math.round(opacity * 100)}٪
            </span>
            <input type="range" min={0.1} max={1} step={0.05} value={opacity} data-testid="toi-opacity"
              onChange={(event) => setOpacity(Number(event.target.value))} className="w-full" />
          </label>
          <label className="flex items-center gap-2 text-sm text-slate-700 dark:text-slate-300">
            <input type="checkbox" checked={band} data-testid="toi-band"
              onChange={(event) => setBand(event.target.checked)} />
            نوار پشت متن
          </label>
          <label className="block">
            <span className="mb-1 block text-xs text-slate-500 dark:text-slate-400">رنگ نوار</span>
            <input type="color" value={bandColor} data-testid="toi-band-color"
              onChange={(event) => setBandColor(event.target.value)}
              className="h-9 w-full rounded-lg border border-slate-300 dark:border-slate-600" />
          </label>
          <label className="block">
            <span className="mb-1 block text-xs text-slate-500 dark:text-slate-400">
              عرض متن: {Math.round(width * 100)}٪ عرض تصویر
            </span>
            <input type="range" min={0.3} max={1} step={0.05} value={width} data-testid="toi-width"
              onChange={(event) => setWidth(Number(event.target.value))} className="w-full" />
          </label>
          <label className="block">
            <span className="mb-1 block text-xs text-slate-500 dark:text-slate-400">چینش</span>
            <select value={align} data-testid="toi-align"
              onChange={(event) => setAlign(event.target.value as typeof align)}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100">
              <option value="right">راست</option>
              <option value="center">وسط</option>
              <option value="left">چپ</option>
            </select>
          </label>
        </div>

        <button type="button" data-testid="toi-run" onClick={() => void render()} disabled={!image || busy}
          className="mt-4 w-full rounded-xl bg-emerald-600 px-4 py-3 text-sm font-bold text-white disabled:bg-slate-300 dark:disabled:bg-slate-700">
          {busy ? "در حال ساخت…" : "اعمال متن روی تصویر"}
        </button>
        {error ? <p data-testid="toi-error" className="mt-3 rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-700 dark:bg-rose-950/40 dark:text-rose-300">{error}</p> : null}
      </section>

      <div className="grid gap-4 sm:grid-cols-2">
        {imageUrl ? (
          <figure className="rounded-2xl border border-slate-200 bg-white p-3 dark:border-slate-700 dark:bg-slate-900">
            <figcaption className="mb-2 text-xs text-slate-500 dark:text-slate-400">تصویر اصلی</figcaption>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={imageUrl} alt="تصویر ورودی" className="w-full rounded-lg" />
          </figure>
        ) : null}
        {output ? (
          <figure data-testid="toi-output" className="rounded-2xl border border-emerald-200 bg-emerald-50 p-3 dark:border-emerald-800 dark:bg-emerald-950/30">
            <figcaption className="mb-2 text-xs text-emerald-800 dark:text-emerald-300">خروجی</figcaption>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={output} alt="تصویر با متن" className="w-full rounded-lg" />
            <a href={output} download="text-on-image.jpg" data-testid="toi-download"
              className="mt-3 block rounded-xl bg-emerald-700 px-4 py-2 text-center text-sm font-bold text-white">
              دانلود تصویر
            </a>
          </figure>
        ) : null}
      </div>

      <p className="rounded-2xl border border-slate-200 bg-white p-4 text-xs leading-6 text-slate-600 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-400">
        متن با فونت سیستمی فارسی رندر می‌شود ({DEFAULT_FONT_STACK.split(",")[0]}) و اگر نصب
        نباشد مرورگر از Tahoma استفاده می‌کند. تصویر هیچ‌وقت آپلود نمی‌شود.
      </p>
    </div>
  );
}
