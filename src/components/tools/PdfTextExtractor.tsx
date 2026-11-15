"use client";

import { useCallback, useState } from "react";

import { CopyButton } from "@/components/tools/CopyButton";
import { extractPdfText, type ExtractResult } from "@/lib/pdf-text";
import { formatBytes } from "@/lib/image";
import { toPersianDigits } from "@/lib/persian";

const fa = (value: number | string) => toPersianDigits(String(value));

const METHOD_LABEL: Record<string, string> = {
  tounicode: "نقشهٔ یونیکد فونت",
  "font-cmap": "جدول نویسهٔ فونت جاسازی‌شده",
  winansi: "کدگذاری WinAnsi",
  none: "بدون نقشهٔ یونیکد",
};

export default function PdfTextExtractor() {
  const [file, setFile] = useState<File | null>(null);
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<ExtractResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [fixRtl, setFixRtl] = useState(true);
  const [bytes, setBytes] = useState<Uint8Array | null>(null);

  const run = useCallback(
    async (buffer: Uint8Array, applyRtl: boolean) => {
      setBusy(true);
      setError(null);
      try {
        setResult(await extractPdfText(buffer, { fixRtl: applyRtl }));
      } catch (cause) {
        const message = cause instanceof Error ? cause.message : String(cause);
        setError(
          /encrypted/i.test(message)
            ? "این PDF رمز دارد. اول با ابزار «حذف رمز PDF» رمز را بردارید."
            : `این فایل باز نشد: ${message}`,
        );
        setResult(null);
      } finally {
        setBusy(false);
      }
    },
    [],
  );

  const onFile = useCallback(
    async (selected: File | null) => {
      setFile(selected);
      setResult(null);
      setError(null);
      if (!selected) {
        setBytes(null);
        return;
      }
      const buffer = new Uint8Array(await selected.arrayBuffer());
      setBytes(buffer);
      await run(buffer, fixRtl);
    },
    [fixRtl, run],
  );

  const fullText = result?.pages.map((page) => page.text).join("\n\n") ?? "";

  return (
    <div className="space-y-6">
      <section className="rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-700 dark:bg-slate-900">
        <input
          type="file"
          accept="application/pdf,.pdf"
          data-testid="pdf-text-file"
          onChange={(event) => void onFile(event.target.files?.[0] ?? null)}
          className="block w-full cursor-pointer rounded-lg border border-dashed border-slate-300 bg-slate-50 px-3 py-6 text-sm text-slate-600 file:me-3 file:rounded-md file:border-0 file:bg-emerald-600 file:px-3 file:py-1.5 file:text-white dark:border-slate-600 dark:bg-slate-800 dark:text-slate-300"
        />

        <label className="mt-4 flex items-start gap-2 text-sm text-slate-700 dark:text-slate-300">
          <input
            type="checkbox"
            data-testid="pdf-text-rtl"
            checked={fixRtl}
            onChange={(event) => {
              setFixRtl(event.target.checked);
              if (bytes) void run(bytes, event.target.checked);
            }}
            className="mt-1"
          />
          <span>
            بازسازی ترتیب راست‌به‌چپ
            <span className="mt-0.5 block text-xs text-slate-500 dark:text-slate-400">
              بیشتر PDFهای فارسی (Word، Chrome، Acrobat) متن را آینه‌ای ذخیره می‌کنند و با
              این گزینه درست خوانده می‌شود. اگر متن به‌هم‌ریخته بود، این تیک را بردارید.
            </span>
          </span>
        </label>

        {busy ? (
          <p className="mt-3 text-sm text-slate-500 dark:text-slate-400">در حال خواندن…</p>
        ) : null}

        {error ? (
          <p data-testid="pdf-text-error" className="mt-3 rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-700 dark:bg-rose-950/40 dark:text-rose-300">
            {error}
          </p>
        ) : null}
      </section>

      {result ? (
        <>
          <section
            data-testid="pdf-text-summary"
            className="rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-700 dark:border-slate-700 dark:bg-slate-800/60 dark:text-slate-300"
          >
            {fa(result.pages.length)} صفحه · {fa(fullText.trim().split(/\s+/).filter(Boolean).length)} کلمه
            {file ? ` · ${formatBytes(file.size)}` : ""}
          </section>

          {result.warnings.map((warning) => (
            <p
              key={warning}
              data-testid="pdf-text-warning"
              className="rounded-xl bg-amber-50 px-4 py-3 text-sm text-amber-800 dark:bg-amber-950/40 dark:text-amber-300"
            >
              {warning}
            </p>
          ))}

          <section className="rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-700 dark:bg-slate-900">
            <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
              <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
                متن استخراج‌شده
              </h3>
              <div className="flex gap-2">
                <CopyButton value={fullText} label="کپی متن" />
                <button
                  type="button"
                  data-testid="pdf-text-download"
                  onClick={() => {
                    const blob = new Blob([fullText], { type: "text/plain;charset=utf-8" });
                    const url = URL.createObjectURL(blob);
                    const link = document.createElement("a");
                    link.href = url;
                    link.download = (file?.name ?? "document").replace(/\.pdf$/i, "") + ".txt";
                    link.click();
                    URL.revokeObjectURL(url);
                  }}
                  className="rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-bold text-white hover:bg-emerald-700"
                >
                  دانلود TXT
                </button>
              </div>
            </div>
            <div className="space-y-4">
              {result.pages.map((page) => (
                <div key={page.page}>
                  <div className="mb-1 flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
                    <span className="font-semibold">صفحهٔ {fa(page.page)}</span>
                    <span className="rounded-full bg-slate-100 px-2 py-0.5 dark:bg-slate-800">
                      {METHOD_LABEL[page.method] ?? page.method}
                    </span>
                    {page.text.trim() === "" ? (
                      <span className="rounded-full bg-amber-100 px-2 py-0.5 text-amber-800 dark:bg-amber-950/50 dark:text-amber-300">
                        متنی پیدا نشد
                      </span>
                    ) : null}
                  </div>
                  <pre
                    data-testid={`pdf-text-page-${page.page}`}
                    className="max-h-72 overflow-auto whitespace-pre-wrap rounded-lg bg-slate-50 p-3 text-sm leading-7 text-slate-800 dark:bg-slate-800/60 dark:text-slate-200"
                    dir="auto"
                  >
                    {page.text || "—"}
                  </pre>
                </div>
              ))}
            </div>
          </section>
        </>
      ) : null}

      <section className="rounded-2xl border border-slate-200 bg-white p-5 text-xs leading-6 text-slate-600 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-400">
        <h3 className="mb-2 text-sm font-bold text-slate-900 dark:text-slate-100">
          محدودیت‌ها را صریح می‌گوییم
        </h3>
        <ul className="list-inside list-disc space-y-1">
          <li>PDF اسکن‌شده متن ندارد؛ این ابزار OCR انجام نمی‌دهد و از تصویر متن نمی‌سازد.</li>
          <li>
            اگر فونت PDF نقشهٔ یونیکد نداشته باشد، متن آن صفحه قابل بازیابی نیست و همین را
            در گزارش صفحه می‌نویسیم — حرف الکی نشان نمی‌دهیم.
          </li>
          <li>متن به ترتیب ذخیره‌شده در فایل است؛ ستون‌بندی پیچیده ممکن است به‌هم بریزد.</li>
        </ul>
      </section>
    </div>
  );
}
