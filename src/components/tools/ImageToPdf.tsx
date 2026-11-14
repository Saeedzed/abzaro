"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  ArrowDown,
  ArrowUp,
  Download,
  Images,
  Loader2,
  RotateCcw,
  Trash2,
  Upload,
} from "lucide-react";
import {
  downloadBlob,
  formatBytes,
  isLoadError,
  loadImageFile,
  renderImage,
  type OutputFormat,
} from "@/lib/image";
import { baseFileName, fitToPage, pageBox, type PageOrientation, type PageSizeId } from "@/lib/pdf-pages";
import { toPersianDigits } from "@/lib/persian";
import { cn } from "@/lib/utils";

const PAGE_SIZE_OPTIONS = [
  { value: "auto" as const, label: "هم‌اندازهٔ تصویر", hint: "بدون حاشیه" },
  { value: "a4" as const, label: "A4", hint: "۲۱ × ۲۹.۷ سانتی‌متر" },
  { value: "letter" as const, label: "Letter", hint: "۲۱.۶ × ۲۷.۹ سانتی‌متر" },
];

const ORIENTATION_OPTIONS = [
  { value: "auto" as const, label: "خودکار" },
  { value: "portrait" as const, label: "عمودی" },
  { value: "landscape" as const, label: "افقی" },
];

const MARGIN_OPTIONS = [
  { value: 0, label: "بدون حاشیه" },
  { value: 24, label: "حاشیهٔ کم" },
  { value: 48, label: "حاشیهٔ زیاد" },
];

interface Entry {
  id: string;
  file: File;
  url: string;
  width: number;
  height: number;
  bitmap: ImageBitmap;
}

/**
 * Images → PDF.
 *
 * Images are converted to a PDF with pdf-lib inside the browser: reorder them,
 * pick the page size/orientation/margin, and download a single PDF file.
 */
export function ImageToPdf() {
  const [entries, setEntries] = useState<Entry[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [pageSize, setPageSize] = useState<PageSizeId | "auto">("auto");
  const [orientation, setOrientation] = useState<PageOrientation>("auto");
  const [margin, setMargin] = useState(0);
  const [busy, setBusy] = useState(false);
  const [progress, setProgress] = useState({ done: 0, total: 0 });
  const [result, setResult] = useState<{ blob: Blob; name: string; pages: number } | null>(
    null,
  );
  const [dragging, setDragging] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const counterRef = useRef(0);

  // Keep entries in a ref so the unmount cleanup sees the latest list.
  const entriesRef = useRef<Entry[]>([]);
  entriesRef.current = entries;

  useEffect(() => {
    return () => {
      entriesRef.current.forEach((entry) => {
        URL.revokeObjectURL(entry.url);
        entry.bitmap.close();
      });
    };
  }, []);

  const totalBytes = useMemo(
    () => entries.reduce((sum, entry) => sum + entry.file.size, 0),
    [entries],
  );

  async function addFiles(files: FileList | File[] | null | undefined) {
    if (!files) return;
    const list = Array.from(files);
    if (list.length === 0) return;

    setError(null);
    setResult(null);

    const accepted: Entry[] = [];
    const rejected: string[] = [];

    for (const file of list) {
      const loaded = await loadImageFile(file);
      if (isLoadError(loaded)) {
        rejected.push(file.name);
        continue;
      }
      counterRef.current += 1;
      accepted.push({
        id: `img-${counterRef.current}`,
        file,
        url: URL.createObjectURL(file),
        width: loaded.width,
        height: loaded.height,
        bitmap: loaded.bitmap,
      });
    }

    if (accepted.length > 0) {
      setEntries((current) => [...current, ...accepted]);
    }
    if (rejected.length > 0) {
      setError(
        `${toPersianDigits(rejected.length)} فایل پذیرفته نشد (فقط JPG، PNG، WebP، GIF، AVIF تا ۲۵ مگابایت).`,
      );
    }
  }

  function removeEntry(id: string) {
    setResult(null);
    setEntries((current) => {
      const target = current.find((entry) => entry.id === id);
      if (target) {
        URL.revokeObjectURL(target.url);
        target.bitmap.close();
      }
      return current.filter((entry) => entry.id !== id);
    });
  }

  function move(index: number, direction: -1 | 1) {
    setResult(null);
    setEntries((current) => {
      const target = index + direction;
      if (target < 0 || target >= current.length) return current;
      const next = [...current];
      const [item] = next.splice(index, 1);
      if (item) next.splice(target, 0, item);
      return next;
    });
  }

  function reset() {
    entries.forEach((entry) => {
      URL.revokeObjectURL(entry.url);
      entry.bitmap.close();
    });
    setEntries([]);
    setResult(null);
    setError(null);
    setProgress({ done: 0, total: 0 });
    if (inputRef.current) inputRef.current.value = "";
  }

  async function handleBuild() {
    if (entries.length === 0) return;
    setBusy(true);
    setError(null);
    setResult(null);
    setProgress({ done: 0, total: entries.length });

    try {
      const { PDFDocument } = await import("pdf-lib");
      const pdf = await PDFDocument.create();
      pdf.setProducer("Abzaro");
      pdf.setCreator("ابزارو — abzaro.netlify.app");

      for (const [index, entry] of entries.entries()) {
        const aspect = entry.width / entry.height;
        const box = pageBox(
          pageSize === "auto" ? "a4" : pageSize,
          pageSize === "auto" ? "auto" : orientation,
          aspect,
        );
        const page = pdf.addPage([box.width, box.height]);

        // PNG keeps transparency; everything else ships as JPEG.
        const outputFormat: OutputFormat =
          entry.file.type === "image/png" ? "image/png" : "image/jpeg";
        const encoded = await renderImage(entry.bitmap, {
          width: entry.width,
          height: entry.height,
          format: outputFormat,
          quality: 0.92,
        });
        const bytes = new Uint8Array(await encoded.arrayBuffer());
        const embedded =
          outputFormat === "image/png"
            ? await pdf.embedPng(bytes)
            : await pdf.embedJpg(bytes);

        const drawable = fitToPage(box.width, box.height, box.width, box.height, margin);
        const fitted = fitToPage(entry.width, entry.height, drawable.width, drawable.height);
        page.drawImage(embedded, {
          x: (box.width - fitted.width) / 2,
          y: (box.height - fitted.height) / 2,
          width: fitted.width,
          height: fitted.height,
        });

        setProgress({ done: index + 1, total: entries.length });
      }

      const bytes = await pdf.save();
      const blob = new Blob([bytes as unknown as BlobPart], { type: "application/pdf" });
      const name = `${baseFileName(entries[0]?.file.name ?? "images", "images")}.pdf`;
      setResult({ blob, name, pages: entries.length });
    } catch {
      setError("ساخت PDF ممکن نشد. تصویر یا تنظیمات دیگری را امتحان کنید.");
    } finally {
      setBusy(false);
    }
  }

  if (entries.length === 0) {
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
            void addFiles(event.dataTransfer.files);
          }}
          className={cn(
            "rounded-2xl border-2 border-dashed p-8 text-center transition",
            dragging
              ? "border-brand-400 bg-brand-50"
              : "border-ink-200 bg-white hover:border-brand-300",
          )}
        >
          <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-brand-50 text-brand-600">
            <Upload className="h-7 w-7" aria-hidden="true" />
          </span>
          <p className="mt-4 text-base font-bold text-ink-900">
            تصویرها را اینجا رها کنید
          </p>
          <p className="mt-1 text-sm text-ink-500">
            می‌توانید چند تصویر را هم‌زمان انتخاب کنید — هر تصویر یک صفحه
          </p>
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            className="mt-4 inline-flex items-center gap-2 rounded-lg bg-brand-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-brand-700"
          >
            <Images className="h-4 w-4" aria-hidden="true" />
            انتخاب تصویرها
          </button>
          <input
            ref={inputRef}
            type="file"
            accept="image/*"
            multiple
            onChange={(event) => void addFiles(event.target.files)}
            className="sr-only"
            aria-label="انتخاب تصویرها"
            data-testid="image-to-pdf-input"
          />
          {error && (
            <p role="alert" className="mt-4 text-sm font-medium text-red-600">
              {error}
            </p>
          )}
        </div>
        <p className="mt-4 text-xs leading-6 text-ink-400">
          ترتیب صفحه‌ها همان ترتیب انتخاب تصویرهاست و بعداً قابل تغییر است. فایل
          شما هرگز آپلود نمی‌شود.
        </p>
      </div>
    );
  }

  return (
    <div>
      <div className="rounded-2xl border border-ink-200 bg-white p-4 shadow-card sm:p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-sm font-bold text-ink-900" data-testid="image-count">
              {toPersianDigits(entries.length)} تصویر انتخاب شده
            </p>
            <p className="mt-0.5 text-xs text-ink-500">
              مجموع {formatBytes(totalBytes)} · ترتیب را با فلش‌ها تغییر دهید
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => inputRef.current?.click()}
              className="inline-flex items-center gap-1.5 rounded-lg border border-ink-200 px-3 py-2 text-xs font-semibold text-ink-700 transition hover:bg-ink-100"
            >
              <Upload className="h-3.5 w-3.5" aria-hidden="true" />
              افزودن تصویر
            </button>
            <button
              type="button"
              onClick={reset}
              className="inline-flex items-center gap-1.5 rounded-lg border border-ink-200 px-3 py-2 text-xs font-semibold text-ink-700 transition hover:bg-ink-100"
            >
              <RotateCcw className="h-3.5 w-3.5" aria-hidden="true" />
              شروع دوباره
            </button>
          </div>
        </div>
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          multiple
          onChange={(event) => void addFiles(event.target.files)}
          className="sr-only"
          aria-label="افزودن تصویر"
        />
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-2">
        <div className="rounded-2xl border border-ink-200 bg-white p-4 shadow-card sm:p-5">
          <h3 className="flex items-center gap-2 text-sm font-bold text-ink-900">
            <Images className="h-4 w-4 text-brand-600" aria-hidden="true" />
            تنظیمات PDF
          </h3>

          <fieldset className="mt-4">
            <legend className="mb-1.5 text-xs font-semibold text-ink-700">
              اندازهٔ صفحه
            </legend>
            <div className="flex flex-col gap-2">
              {PAGE_SIZE_OPTIONS.map((item) => (
                <label
                  key={item.value}
                  className={cn(
                    "flex cursor-pointer items-center gap-3 rounded-lg border px-3 py-2 text-xs font-medium transition",
                    pageSize === item.value
                      ? "border-brand-300 bg-brand-50 text-ink-900"
                      : "border-ink-200 text-ink-600 hover:bg-ink-50",
                  )}
                >
                  <input
                    type="radio"
                    name="pdf-page-size"
                    checked={pageSize === item.value}
                    onChange={() => {
                      setPageSize(item.value);
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
          </fieldset>

          {pageSize !== "auto" && (
            <fieldset className="mt-4">
              <legend className="mb-1.5 text-xs font-semibold text-ink-700">
                جهت صفحه
              </legend>
              <div className="flex gap-2">
                {ORIENTATION_OPTIONS.map((item) => (
                  <button
                    key={item.value}
                    type="button"
                    onClick={() => {
                      setOrientation(item.value);
                      setResult(null);
                    }}
                    aria-pressed={orientation === item.value}
                    className={cn(
                      "flex-1 rounded-lg border px-2 py-2 text-xs font-semibold transition",
                      orientation === item.value
                        ? "border-brand-300 bg-brand-50 text-brand-700"
                        : "border-ink-200 text-ink-600 hover:bg-ink-100",
                    )}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            </fieldset>
          )}

          <fieldset className="mt-4">
            <legend className="mb-1.5 text-xs font-semibold text-ink-700">
              حاشیه
            </legend>
            <div className="flex gap-2">
              {MARGIN_OPTIONS.map((item) => (
                <button
                  key={item.value}
                  type="button"
                  onClick={() => {
                    setMargin(item.value);
                    setResult(null);
                  }}
                  aria-pressed={margin === item.value}
                  className={cn(
                    "flex-1 rounded-lg border px-2 py-2 text-[11px] font-semibold transition",
                    margin === item.value
                      ? "border-brand-300 bg-brand-50 text-brand-700"
                      : "border-ink-200 text-ink-600 hover:bg-ink-100",
                  )}
                >
                  {item.label}
                </button>
              ))}
            </div>
          </fieldset>

          <button
            type="button"
            onClick={() => void handleBuild()}
            disabled={busy || entries.length === 0}
            data-testid="image-to-pdf-build"
            className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-lg bg-brand-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-brand-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {busy && <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />}
            {busy
              ? `در حال ساخت PDF… (${toPersianDigits(progress.done)}/${toPersianDigits(
                  progress.total,
                )})`
              : "ساخت PDF"}
          </button>

          {error && (
            <p role="alert" className="mt-3 text-xs font-medium text-red-600">
              {error}
            </p>
          )}
        </div>

        <div className="rounded-2xl border border-ink-200 bg-white p-4 shadow-card sm:p-5">
          <div className="flex items-center justify-between gap-3">
            <h3 className="text-sm font-bold text-ink-900">ترتیب صفحه‌ها</h3>
            {result && (
              <button
                type="button"
                onClick={() => downloadBlob(result.blob, result.name)}
                data-testid="image-to-pdf-download"
                className="inline-flex items-center gap-1.5 rounded-lg bg-brand-600 px-3 py-1.5 text-[11px] font-semibold text-white transition hover:bg-brand-700"
              >
                <Download className="h-3.5 w-3.5" aria-hidden="true" />
                دانلود PDF
              </button>
            )}
          </div>

          <ul className="mt-3 max-h-[24rem] space-y-2 overflow-y-auto pe-1">
            {entries.map((entry, index) => (
              <li
                key={entry.id}
                className="flex items-center gap-2 rounded-xl border border-ink-200 bg-ink-50 p-2"
              >
                <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-white text-[11px] font-bold text-ink-600">
                  {toPersianDigits(index + 1)}
                </span>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={entry.url}
                  alt={entry.file.name}
                  className="h-11 w-11 shrink-0 rounded-md bg-white object-cover"
                />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[11px] font-semibold text-ink-800">
                    {entry.file.name}
                  </p>
                  <p className="text-[10px] text-ink-400">
                    {toPersianDigits(entry.width)} × {toPersianDigits(entry.height)} ·{" "}
                    {formatBytes(entry.file.size)}
                  </p>
                </div>
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => move(index, -1)}
                    disabled={index === 0}
                    aria-label={`جابه‌جایی صفحهٔ ${index + 1} به بالا`}
                    className="flex h-6 w-6 items-center justify-center rounded-md bg-white text-ink-600 shadow-card transition hover:bg-brand-100 disabled:opacity-30"
                  >
                    <ArrowUp className="h-3 w-3" aria-hidden="true" />
                  </button>
                  <button
                    type="button"
                    onClick={() => move(index, 1)}
                    disabled={index === entries.length - 1}
                    aria-label={`جابه‌جایی صفحهٔ ${index + 1} به پایین`}
                    className="flex h-6 w-6 items-center justify-center rounded-md bg-white text-ink-600 shadow-card transition hover:bg-brand-100 disabled:opacity-30"
                  >
                    <ArrowDown className="h-3 w-3" aria-hidden="true" />
                  </button>
                  <button
                    type="button"
                    onClick={() => removeEntry(entry.id)}
                    aria-label={`حذف ${entry.file.name}`}
                    className="flex h-6 w-6 items-center justify-center rounded-md bg-white text-red-600 shadow-card transition hover:bg-red-50"
                  >
                    <Trash2 className="h-3 w-3" aria-hidden="true" />
                  </button>
                </div>
              </li>
            ))}
          </ul>

          {result ? (
            <div
              className="mt-3 rounded-xl border border-brand-200 bg-brand-50 px-4 py-3 text-center"
              data-testid="image-to-pdf-result"
            >
              <p className="text-sm font-bold text-brand-900">PDF آماده است</p>
              <p className="mt-0.5 text-[11px] text-brand-700">
                {toPersianDigits(result.pages)} صفحه · {formatBytes(result.blob.size)}
              </p>
            </div>
          ) : (
            <p className="mt-3 text-[11px] leading-5 text-ink-400">
              تصویرها به هیچ سروری ارسال نمی‌شوند؛ PDF در مرورگر شما ساخته
              می‌شود.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
