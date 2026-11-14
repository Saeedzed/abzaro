"use client";

import { useMemo, useState } from "react";
import { Copy, Download, Eraser, Rows3 } from "lucide-react";
import { dedupeLines } from "@/lib/text-tools";
import { ToolPanel, formatFa } from "./shared";
import { cn } from "@/lib/utils";

const SAMPLE = `تهران
اصفهان
شیراز
تهران
مشهد
اصفهان
تبریز`;

/**
 * Removes duplicate lines while keeping the original order of first
 * occurrences — the everyday "clean up this list" job for Persian text.
 */
export function DuplicateLineRemover() {
  const [input, setInput] = useState("");
  const [ignoreCase, setIgnoreCase] = useState(true);
  const [ignoreSpaces, setIgnoreSpaces] = useState(true);
  const [removeEmpty, setRemoveEmpty] = useState(true);
  const [copied, setCopied] = useState(false);

  const result = useMemo(
    () =>
      dedupeLines(input, {
        ignoreCase,
        ignoreSurroundingSpaces: ignoreSpaces,
        removeEmpty,
      }),
    [input, ignoreCase, ignoreSpaces, removeEmpty],
  );

  const output = result.unique.join("\n");

  async function copy() {
    try {
      await navigator.clipboard.writeText(output);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1600);
    } catch {
      /* clipboard blocked — the textarea is still selectable */
    }
  }

  function download() {
    const blob = new Blob([output], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "unique-lines.txt";
    link.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="space-y-4">
      <ToolPanel
        title="متن خود را وارد کنید"
        description="هر خط یک آیتم است. ترتیب اولین تکرارها حفظ می‌شود."
        icon={<Rows3 className="h-4 w-4 text-brand-600" aria-hidden="true" />}
        action={
          <button
            type="button"
            onClick={() => setInput(SAMPLE)}
            className="rounded-lg border border-ink-200 px-2.5 py-1 text-[11px] font-medium text-ink-600 transition hover:border-brand-300 hover:text-brand-700"
          >
            نمونه
          </button>
        }
      >
        <label htmlFor="dedupe-input" className="sr-only">
          متن با خطوط تکراری
        </label>
        <textarea
          id="dedupe-input"
          dir="auto"
          value={input}
          onChange={(event) => setInput(event.target.value)}
          rows={8}
          placeholder={SAMPLE}
          data-testid="dedupe-input"
          className="w-full resize-y rounded-xl border border-ink-200 bg-white px-4 py-3 text-sm leading-7 text-ink-900 outline-none transition placeholder:text-ink-300 focus:border-brand-400 focus:ring-4 focus:ring-brand-100"
        />

        <div className="mt-3 flex flex-wrap gap-2">
          {[
            { label: "نادیده‌گرفتن بزرگی و کوچکی حروف", value: ignoreCase, set: setIgnoreCase },
            { label: "نادیده‌گرفتن فاصله‌های اضافی", value: ignoreSpaces, set: setIgnoreSpaces },
            { label: "حذف خطوط خالی", value: removeEmpty, set: setRemoveEmpty },
          ].map((option) => (
            <button
              key={option.label}
              type="button"
              onClick={() => option.set(!option.value)}
              aria-pressed={option.value}
              className={cn(
                "rounded-full border px-3 py-1.5 text-[11px] font-medium transition",
                option.value
                  ? "border-brand-600 bg-brand-50 text-brand-700"
                  : "border-ink-200 bg-white text-ink-500 hover:border-brand-300",
              )}
            >
              {option.label}
            </button>
          ))}
        </div>
      </ToolPanel>

      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard label="خطوط ورودی" value={result.before} />
        <StatCard label="خطوط یکتا" value={result.after} accent />
        <StatCard label="خطوط حذف‌شده" value={Math.max(0, result.before - result.after)} />
      </div>

      <ToolPanel
        title="خروجی بدون تکرار"
        icon={<Eraser className="h-4 w-4 text-brand-600" aria-hidden="true" />}
        action={
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => void copy()}
              disabled={result.after === 0}
              data-testid="dedupe-copy"
              className="flex items-center gap-1 rounded-lg bg-brand-600 px-3 py-1.5 text-[11px] font-semibold text-white transition hover:bg-brand-700 disabled:opacity-40"
            >
              <Copy className="h-3 w-3" aria-hidden="true" />
              {copied ? "کپی شد" : "کپی"}
            </button>
            <button
              type="button"
              onClick={download}
              disabled={result.after === 0}
              className="flex items-center gap-1 rounded-lg border border-ink-200 px-3 py-1.5 text-[11px] font-semibold text-ink-600 transition hover:border-brand-300 disabled:opacity-40"
            >
              <Download className="h-3 w-3" aria-hidden="true" />
              دانلود
            </button>
          </div>
        }
      >
        <label htmlFor="dedupe-output" className="sr-only">
          خروجی بدون خطوط تکراری
        </label>
        <textarea
          id="dedupe-output"
          dir="auto"
          readOnly
          value={output}
          rows={8}
          data-testid="dedupe-output"
          className="w-full resize-y rounded-xl border border-ink-200 bg-ink-50/60 px-4 py-3 text-sm leading-7 text-ink-900 outline-none"
        />
      </ToolPanel>
    </div>
  );
}

function StatCard({ label, value, accent = false }: { label: string; value: number; accent?: boolean }) {
  return (
    <div
      className={cn(
        "rounded-2xl border px-4 py-3 text-center shadow-card",
        accent ? "border-brand-200 bg-brand-50" : "border-ink-200 bg-white",
      )}
    >
      <p className={cn("text-2xl font-extrabold", accent ? "text-brand-700" : "text-ink-900")}>
        {formatFa(value, 0)}
      </p>
      <p className="mt-0.5 text-[11px] font-medium text-ink-500">{label}</p>
    </div>
  );
}
