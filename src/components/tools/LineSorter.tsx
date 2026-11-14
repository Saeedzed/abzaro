"use client";

import { useState } from "react";
import { ArrowDownUp, Copy, Download, Shuffle } from "lucide-react";
import { SORT_LABELS, sortLines, type SortMode } from "@/lib/text-tools";
import { ToolPanel, formatFa } from "./shared";
import { cn } from "@/lib/utils";

const SAMPLE = `شیراز
اصفهان
تهران
بندرعباس
مشهد`;

const MODES = Object.keys(SORT_LABELS) as SortMode[];

/** Sort or shuffle lines — alphabetical (Persian collation), by length, or random. */
export function LineSorter() {
  const [input, setInput] = useState("");
  const [mode, setMode] = useState<SortMode>("alphabetical");
  const [copied, setCopied] = useState(false);
  const [seed, setSeed] = useState(0);

  // `seed` forces a fresh shuffle when the user presses «تصادفی» again.
  const output = sortLines(input, mode).join("\n");
  const count = input.split(/\r?\n/).filter((line) => line.trim() !== "").length;

  async function copy() {
    try {
      await navigator.clipboard.writeText(output);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1600);
    } catch {
      /* ignore */
    }
  }

  function download() {
    const blob = new Blob([output], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "sorted-lines.txt";
    link.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="space-y-4">
      <ToolPanel
        title="خطوط را وارد کنید"
        description="هر خط یک آیتم است؛ خطوط خالی حذف می‌شوند."
        icon={<ArrowDownUp className="h-4 w-4 text-brand-600" aria-hidden="true" />}
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
        <label htmlFor="sort-input" className="sr-only">
          متن برای مرتب‌سازی
        </label>
        <textarea
          id="sort-input"
          dir="auto"
          value={input}
          onChange={(event) => setInput(event.target.value)}
          rows={7}
          placeholder={SAMPLE}
          data-testid="sort-input"
          className="w-full resize-y rounded-xl border border-ink-200 bg-white px-4 py-3 text-sm leading-7 text-ink-900 outline-none transition placeholder:text-ink-300 focus:border-brand-400 focus:ring-4 focus:ring-brand-100"
        />

        <div className="mt-3 flex flex-wrap gap-2">
          {MODES.map((option) => (
            <button
              key={option}
              type="button"
              onClick={() => {
                setMode(option);
                if (option === "random") setSeed((value) => value + 1);
              }}
              aria-pressed={mode === option}
              data-testid={`sort-mode-${option}`}
              className={cn(
                "flex items-center gap-1 rounded-full border px-3 py-1.5 text-[11px] font-medium transition",
                mode === option
                  ? "border-brand-600 bg-brand-600 text-white"
                  : "border-ink-200 bg-white text-ink-600 hover:border-brand-300 hover:text-brand-700",
              )}
            >
              {option === "random" && <Shuffle className="h-3 w-3" aria-hidden="true" />}
              {SORT_LABELS[option]}
            </button>
          ))}
        </div>
      </ToolPanel>

      <ToolPanel
        title={`خروجی مرتب‌شده (${formatFa(count, 0)} خط)`}
        icon={<ArrowDownUp className="h-4 w-4 text-brand-600" aria-hidden="true" />}
        action={
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => void copy()}
              disabled={count === 0}
              data-testid="sort-copy"
              className="flex items-center gap-1 rounded-lg bg-brand-600 px-3 py-1.5 text-[11px] font-semibold text-white transition hover:bg-brand-700 disabled:opacity-40"
            >
              <Copy className="h-3 w-3" aria-hidden="true" />
              {copied ? "کپی شد" : "کپی"}
            </button>
            <button
              type="button"
              onClick={download}
              disabled={count === 0}
              className="flex items-center gap-1 rounded-lg border border-ink-200 px-3 py-1.5 text-[11px] font-semibold text-ink-600 transition hover:border-brand-300 disabled:opacity-40"
            >
              <Download className="h-3 w-3" aria-hidden="true" />
              دانلود
            </button>
          </div>
        }
      >
        <label htmlFor="sort-output" className="sr-only">
          خروجی مرتب‌شده
        </label>
        <textarea
          id="sort-output"
          key={`${mode}-${seed}`}
          dir="auto"
          readOnly
          value={output}
          rows={7}
          data-testid="sort-output"
          className="w-full resize-y rounded-xl border border-ink-200 bg-ink-50/60 px-4 py-3 text-sm leading-7 text-ink-900 outline-none"
        />
      </ToolPanel>
    </div>
  );
}
