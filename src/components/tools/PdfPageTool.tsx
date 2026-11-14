"use client";

import { useMemo, useState } from "react";
import { Download, FileText, Loader2, RotateCw, Scissors, Trash2 } from "lucide-react";
import { downloadBlob, formatBytes } from "@/lib/image";
import { baseFileName, parsePageRange } from "@/lib/pdf-pages";
import {
  deletePdfPages,
  extractPdfPages,
  inspectPdf,
  isPdfOpError,
  rotatePdf,
} from "@/lib/pdf-arrange";
import { toEnglishDigits, toPersianDigits } from "@/lib/persian";
import { cn } from "@/lib/utils";
import { UploadZone } from "./UploadZone";
import { LoadingState } from "@/components/ui/Feedbacks";

export type PageToolKind = "rotate" | "delete" | "split";

const CONFIG = {
  rotate: {
    title: "چرخاندن صفحات PDF",
    icon: RotateCw,
    cta: "چرخاندن و ساخت فایل",
    testId: "pdf-rotate",
  },
  delete: {
    title: "حذف صفحه از PDF",
    icon: Trash2,
    cta: "حذف صفحه‌ها و ساخت فایل",
    testId: "pdf-delete",
  },
  split: {
    title: "استخراج / تقسیم صفحات PDF",
    icon: Scissors,
    cta: "استخراج صفحات",
    testId: "pdf-split",
  },
} as const;

/**
 * One component for the three page-level PDF tools (rotate / delete / split).
 * They share the whole flow — pick a file, read the page count, choose pages,
 * generate — so only the operation differs.
 */
export function PdfPageTool({ kind }: { kind: PageToolKind }) {
  const config = CONFIG[kind];
  const Icon = config.icon;

  const [file, setFile] = useState<File | null>(null);
  const [pageCount, setPageCount] = useState(0);
  const [range, setRange] = useState("");
  const [angle, setAngle] = useState<90 | 180 | 270>(90);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<{ blob: Blob; name: string; pageCount: number } | null>(null);

  const parsed = useMemo(() => {
    if (!file || pageCount === 0) return { pages: [], error: null as string | null };
    if (kind === "rotate" && range.trim() === "") return { pages: [], error: null };
    return parsePageRange(toEnglishDigits(range), pageCount);
  }, [range, pageCount, file, kind]);

  const ready = Boolean(file) && parsed.error === null;

  async function handleFiles(files: File[]) {
    const next = files[0];
    if (!next) return;
    setError(null);
    setResult(null);
    setRange("");
    const info = await inspectPdf(next);
    if (isPdfOpError(info)) {
      setError(info.error);
      setFile(null);
      setPageCount(0);
      return;
    }
    setFile(next);
    setPageCount(info.pageCount);
  }

  async function run() {
    if (!file) return;
    setBusy(true);
    setError(null);
    setResult(null);

    const pages = parsed.pages;
    const outcome =
      kind === "rotate"
        ? await rotatePdf(file, angle, pages)
        : kind === "delete"
          ? await deletePdfPages(file, pages)
          : await extractPdfPages(file, pages);

    setBusy(false);

    if (isPdfOpError(outcome)) {
      setError(outcome.error);
      return;
    }

    const suffix = kind === "rotate" ? "rotated" : kind === "delete" ? "trimmed" : "pages";
    setResult({
      blob: outcome.blob,
      name: `${baseFileName(file.name, "document")}-${suffix}.pdf`,
      pageCount: outcome.pageCount,
    });
  }

  return (
    <div className="space-y-4">
      <UploadZone
        accept="application/pdf,.pdf"
        title="فایل PDF را انتخاب کنید"
        hint="حداکثر ۲۵ مگابایت — فایل شما آپلود نمی‌شود"
        buttonLabel="انتخاب فایل PDF"
        testId={`${config.testId}-input`}
        onFiles={(files) => void handleFiles(files)}
      />

      {file && (
        <div className="rounded-2xl border border-ink-200 bg-white p-4 shadow-card sm:p-5">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h3 className="flex items-center gap-2 text-sm font-bold text-ink-900">
              <FileText className="h-4 w-4 text-brand-600" aria-hidden="true" />
              {file.name}
            </h3>
            <span className="text-[11px] text-ink-500">
              {toPersianDigits(pageCount)} صفحه · {formatBytes(file.size)}
            </span>
          </div>

          {kind === "rotate" && (
            <div className="mt-4">
              <p className="text-xs font-semibold text-ink-700">زاویهٔ چرخش</p>
              <div className="mt-2 flex flex-wrap gap-2">
                {([90, 180, 270] as const).map((value) => (
                  <button
                    key={value}
                    type="button"
                    onClick={() => setAngle(value)}
                    aria-pressed={angle === value}
                    className={cn(
                      "rounded-full border px-3 py-1.5 text-xs font-medium transition",
                      angle === value
                        ? "border-brand-600 bg-brand-600 text-white"
                        : "border-ink-200 bg-white text-ink-600 hover:border-brand-300",
                    )}
                  >
                    {toPersianDigits(value)} درجه
                  </button>
                ))}
              </div>
            </div>
          )}

          <div className="mt-4">
            <label htmlFor={`${config.testId}-range`} className="mb-1.5 block text-xs font-semibold text-ink-700">
              {kind === "rotate" ? "صفحه‌ها (خالی = همهٔ صفحه‌ها)" : "شمارهٔ صفحه‌ها"}
            </label>
            <input
              id={`${config.testId}-range`}
              dir="ltr"
              value={range}
              onChange={(event) => setRange(event.target.value)}
              placeholder={kind === "split" ? "1-3, 5" : kind === "delete" ? "2, 5-6" : ""}
              data-testid={`${config.testId}-range`}
              className="w-full rounded-xl border border-ink-200 bg-white px-3 py-2.5 text-left text-sm text-ink-900 outline-none transition focus:border-brand-400 focus:ring-4 focus:ring-brand-100"
            />
            <p className="mt-1.5 text-[11px] leading-6 text-ink-500">
              مثال: <span dir="ltr">1-3, 5</span> — بازه و صفحهٔ تکی را می‌توانید ترکیب کنید.
            </p>
            {parsed.error && (
              <p role="alert" className="mt-1 text-[11px] font-medium text-red-600">
                {parsed.error}
              </p>
            )}
            {parsed.error === null && parsed.pages.length > 0 && (
              <p className="mt-1 text-[11px] font-medium text-brand-700">
                {toPersianDigits(parsed.pages.length)} صفحه انتخاب شده
              </p>
            )}
          </div>

          <button
            type="button"
            onClick={() => void run()}
            disabled={!ready || busy}
            data-testid={`${config.testId}-run`}
            className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-brand-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-brand-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {busy ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> : <Icon className="h-4 w-4" aria-hidden="true" />}
            {busy ? "در حال پردازش…" : config.cta}
          </button>

          {busy && (
            <LoadingState
              className="mt-3"
              label="در حال پردازش فایل…"
              hint="صفحات بدون افت کیفیت بازنویسی می‌شوند و همه‌چیز در مرورگر شما انجام می‌شود."
            />
          )}

          {error && (
            <p role="alert" className="mt-3 text-xs font-medium text-red-600">
              {error}
            </p>
          )}

          {result && (
            <div className="mt-3 rounded-xl border border-brand-200 bg-brand-50 px-4 py-3" data-testid={`${config.testId}-result`}>
              <p className="text-center text-sm font-bold text-brand-900">فایل آماده است</p>
              <p className="mt-0.5 text-center text-[11px] text-brand-700">
                {toPersianDigits(result.pageCount)} صفحه · {formatBytes(result.blob.size)}
              </p>
              <button
                type="button"
                onClick={() => downloadBlob(result.blob, result.name)}
                data-testid={`${config.testId}-download`}
                className="mt-2 inline-flex w-full items-center justify-center gap-2 rounded-lg bg-brand-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-brand-700"
              >
                <Download className="h-4 w-4" aria-hidden="true" />
                دانلود فایل
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
