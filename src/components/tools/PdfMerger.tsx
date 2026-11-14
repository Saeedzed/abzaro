"use client";

import { LoadingState } from "@/components/ui/Feedbacks";
import { useMemo, useState } from "react";
import {
  ArrowDown,
  ArrowUp,
  Download,
  FileText,
  Layers,
  Loader2,
  Plus,
  RotateCcw,
  Trash2,
} from "lucide-react";
import { downloadBlob, formatBytes } from "@/lib/image";
import { baseFileName } from "@/lib/pdf-pages";
import { mergePdfs } from "@/lib/pdf-edit";
import { toPersianDigits } from "@/lib/persian";
import { UploadZone } from "./UploadZone";

interface Item {
  id: string;
  file: File;
  pages: number;
  error: string | null;
}

const MAX_FILES = 20;

/**
 * Merge several PDFs into one. Files are read with pdf-lib and copied page by
 * page, so the original quality is preserved (no re-rasterising).
 */
export function PdfMerger() {
  const [items, setItems] = useState<Item[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<{ blob: Blob; pages: number; name: string } | null>(null);
  const [counter, setCounter] = useState(0);

  const totalPages = useMemo(() => items.reduce((sum, item) => sum + item.pages, 0), [items]);
  const totalBytes = useMemo(() => items.reduce((sum, item) => sum + item.file.size, 0), [items]);
  const ready = items.length > 0 && items.every((item) => item.error === null);

  async function addFiles(files: File[]) {
    setError(null);
    setResult(null);
    const accepted: Item[] = [];
    let next = counter;

    for (const file of files.slice(0, MAX_FILES)) {
      next += 1;
      const item: Item = {
        id: `pdf-${next}`,
        file,
        pages: 0,
        error: null,
      };
      if (file.type !== "application/pdf" && !/\.pdf$/i.test(file.name)) {
        item.error = "فایل PDF نیست.";
      } else {
        try {
          const { PDFDocument } = await import("pdf-lib");
          const doc = await PDFDocument.load(new Uint8Array(await file.arrayBuffer()), {
            ignoreEncryption: true,
          });
          item.pages = doc.getPageCount();
          if (item.pages === 0) item.error = "این فایل صفحه‌ای ندارد.";
        } catch {
          item.error = "فایل خراب یا رمزدار است.";
        }
      }
      accepted.push(item);
    }

    setCounter(next);
    setItems((current) => [...current, ...accepted].slice(0, MAX_FILES + 1));
  }

  function move(index: number, direction: -1 | 1) {
    setResult(null);
    setItems((current) => {
      const target = index + direction;
      if (target < 0 || target >= current.length) return current;
      const next = [...current];
      const [item] = next.splice(index, 1);
      if (item) next.splice(target, 0, item);
      return next;
    });
  }

  function remove(id: string) {
    setResult(null);
    setItems((current) => current.filter((item) => item.id !== id));
  }

  async function handleMerge() {
    if (!ready) return;
    setBusy(true);
    setError(null);
    setResult(null);
    try {
      const inputs = await Promise.all(
        items.map(async (item) => ({
          name: item.file.name,
          bytes: new Uint8Array(await item.file.arrayBuffer()),
        })),
      );
      const merged = await mergePdfs(inputs);
      if (merged.error) {
        setError(merged.error);
        return;
      }
      setResult({
        blob: new Blob([merged.bytes as unknown as BlobPart], { type: "application/pdf" }),
        pages: merged.pageCount,
        name: `${baseFileName(items[0]?.file.name ?? "merged", "merged")}-merged.pdf`,
      });
    } catch {
      setError("ادغام فایل‌ها ممکن نشد.");
    } finally {
      setBusy(false);
    }
  }

  if (items.length === 0) {
    return (
      <UploadZone
        title="فایل‌های PDF را اینجا رها کنید"
        hint="می‌توانید چند فایل را هم‌زمان انتخاب کنید — حداکثر ۲۰ فایل"
        buttonLabel="انتخاب فایل‌های PDF"
        accept="application/pdf,.pdf"
        multiple
        onFiles={(files) => void addFiles(files)}
        icon={<Layers className="h-7 w-7" aria-hidden="true" />}
        error={error}
        testId="pdf-merge-input"
      />
    );
  }

  return (
    <div>
      <div className="rounded-2xl border border-ink-200 bg-white p-4 shadow-card sm:p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-sm font-bold text-ink-900" data-testid="pdf-merge-count">
              {toPersianDigits(items.length)} فایل · {toPersianDigits(totalPages)} صفحه
            </p>
            <p className="mt-0.5 text-xs text-ink-500">مجموع {formatBytes(totalBytes)}</p>
          </div>
          <div className="flex items-center gap-2">
            <label className="inline-flex cursor-pointer items-center gap-1.5 rounded-lg border border-ink-200 px-3 py-2 text-xs font-semibold text-ink-700 transition hover:bg-ink-100">
              <Plus className="h-3.5 w-3.5" aria-hidden="true" />
              افزودن فایل
              <input
                type="file"
                accept="application/pdf,.pdf"
                multiple
                onChange={(event) => void addFiles(Array.from(event.target.files ?? []))}
                className="sr-only"
                aria-label="افزودن فایل PDF"
              />
            </label>
            <button
              type="button"
              onClick={() => {
                setItems([]);
                setResult(null);
                setError(null);
              }}
              className="inline-flex items-center gap-1.5 rounded-lg border border-ink-200 px-3 py-2 text-xs font-semibold text-ink-700 transition hover:bg-ink-100"
            >
              <RotateCcw className="h-3.5 w-3.5" aria-hidden="true" />
              شروع دوباره
            </button>
          </div>
        </div>
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-2">
        <div className="rounded-2xl border border-ink-200 bg-white p-4 shadow-card sm:p-5">
          <h3 className="flex items-center gap-2 text-sm font-bold text-ink-900">
            <Layers className="h-4 w-4 text-brand-600" aria-hidden="true" />
            ترتیب ادغام
          </h3>
          <p className="mt-1 text-[11px] text-ink-500">
            فایل بالاتر، صفحه‌هایش اول می‌آید.
          </p>

          <ul className="mt-3 max-h-[26rem] space-y-2 overflow-y-auto pe-1">
            {items.map((item, index) => (
              <li
                key={item.id}
                className="flex items-center gap-2 rounded-xl border border-ink-200 bg-ink-50 p-2"
              >
                <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-white text-[11px] font-bold text-ink-600">
                  {toPersianDigits(index + 1)}
                </span>
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-red-50 text-red-600">
                  <FileText className="h-4 w-4" aria-hidden="true" />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[11px] font-semibold text-ink-800">{item.file.name}</p>
                  <p className={item.error ? "text-[10px] text-red-600" : "text-[10px] text-ink-400"}>
                    {item.error ?? `${toPersianDigits(item.pages)} صفحه · ${formatBytes(item.file.size)}`}
                  </p>
                </div>
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => move(index, -1)}
                    disabled={index === 0}
                    aria-label={`جابه‌جایی ${item.file.name} به بالا`}
                    className="flex h-6 w-6 items-center justify-center rounded-md bg-white text-ink-600 shadow-card transition hover:bg-brand-100 disabled:opacity-30"
                  >
                    <ArrowUp className="h-3 w-3" aria-hidden="true" />
                  </button>
                  <button
                    type="button"
                    onClick={() => move(index, 1)}
                    disabled={index === items.length - 1}
                    aria-label={`جابه‌جایی ${item.file.name} به پایین`}
                    className="flex h-6 w-6 items-center justify-center rounded-md bg-white text-ink-600 shadow-card transition hover:bg-brand-100 disabled:opacity-30"
                  >
                    <ArrowDown className="h-3 w-3" aria-hidden="true" />
                  </button>
                  <button
                    type="button"
                    onClick={() => remove(item.id)}
                    aria-label={`حذف ${item.file.name}`}
                    className="flex h-6 w-6 items-center justify-center rounded-md bg-white text-red-600 shadow-card transition hover:bg-red-50"
                  >
                    <Trash2 className="h-3 w-3" aria-hidden="true" />
                  </button>
                </div>
              </li>
            ))}
          </ul>
        </div>

        <div className="rounded-2xl border border-ink-200 bg-white p-4 shadow-card sm:p-5">
          <h3 className="text-sm font-bold text-ink-900">خروجی</h3>

          <button
            type="button"
            onClick={() => void handleMerge()}
            disabled={busy || !ready}
            data-testid="pdf-merge-build"
            className="mt-3 inline-flex w-full items-center justify-center gap-2 rounded-lg bg-brand-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-brand-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {busy && <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />}
            {busy ? "در حال ادغام…" : `ادغام ${toPersianDigits(items.length)} فایل`}
          </button>

          {busy && (
            <LoadingState
              className="mt-3"
              label="در حال ادغام فایل‌ها…"
              hint="صفحات به ترتیب فهرست بالا کنار هم قرار می‌گیرند؛ این کار در مرورگر شما انجام می‌شود."
            />
          )}

          {error && (
            <p role="alert" className="mt-3 text-xs font-medium text-red-600">
              {error}
            </p>
          )}

          {result ? (
            <div className="mt-3 rounded-xl border border-brand-200 bg-brand-50 px-4 py-3" data-testid="pdf-merge-result">
              <p className="text-center text-sm font-bold text-brand-900">PDF آماده است</p>
              <p className="mt-0.5 text-center text-[11px] text-brand-700">
                {toPersianDigits(result.pages)} صفحه · {formatBytes(result.blob.size)}
              </p>
              <button
                type="button"
                onClick={() => downloadBlob(result.blob, result.name)}
                data-testid="pdf-merge-download"
                className="mt-2 inline-flex w-full items-center justify-center gap-2 rounded-lg bg-brand-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-brand-700"
              >
                <Download className="h-4 w-4" aria-hidden="true" />
                دانلود PDF
              </button>
            </div>
          ) : (
            <div className="mt-3 rounded-xl border border-dashed border-ink-200 bg-ink-50/60 px-4 py-10 text-center text-sm text-ink-400">
              ترتیب را مشخص کنید و دکمهٔ ادغام را بزنید.
            </div>
          )}

          <p className="mt-3 text-[11px] leading-5 text-ink-400">
            کیفیت اصلی فایل‌ها حفظ می‌شود؛ صفحه‌ها کپی می‌شوند و دوباره فشرده
            نمی‌شوند.
          </p>
        </div>
      </div>
    </div>
  );
}
