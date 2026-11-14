"use client";

import { useState } from "react";
import { SpellCheck } from "lucide-react";
import { numberToPersianWords } from "@/lib/number-to-words";
import { toEnglishDigits } from "@/lib/persian";
import { ResultHint, ResultRow, ToolPanel, formatFa } from "./shared";
import { cn } from "@/lib/utils";

const EXAMPLES = [
  { label: "۱٬۲۵۰٬۰۰۰", value: "1250000" },
  { label: "۹۸٬۵۰۰", value: "98500" },
  { label: "۴۰", value: "40" },
  { label: "۱۲٫۵", value: "12.5" },
] as const;

/**
 * Number → Persian words converter. Useful for invoices and cheques, where the
 * amount must be written out in words. Runs entirely in the browser.
 */
export function NumberToWords() {
  const [input, setInput] = useState("");

  // Accept Persian digits while typing — normalise before converting.
  const result = numberToPersianWords(input);
  const showError = input.trim() !== "" && !result.ok;

  return (
    <div>
      <ToolPanel
        title="عدد را وارد کنید"
        description="رقم فارسی، عربی یا انگلیسی؛ جداکنندهٔ هزارگان و اعشار هم پذیرفته می‌شود."
        icon={<SpellCheck className="h-4 w-4 text-brand-600" aria-hidden="true" />}
      >
        <label htmlFor="n2w-input" className="sr-only">
          عدد برای تبدیل به حروف
        </label>
        <input
          id="n2w-input"
          dir="ltr"
          inputMode="text"
          value={input}
          onChange={(event) => setInput(event.target.value)}
          placeholder="1250000"
          aria-invalid={showError || undefined}
          aria-describedby={showError ? "n2w-error" : undefined}
          className={cn(
            "w-full rounded-xl border bg-white px-4 py-3.5 text-left text-2xl font-extrabold tracking-wide text-ink-900 outline-none transition placeholder:text-ink-300 placeholder:font-normal focus:ring-4",
            showError
              ? "border-red-300 focus:border-red-400 focus:ring-red-100"
              : "border-ink-200 focus:border-brand-400 focus:ring-brand-100",
          )}
        />
        {showError && (
          <p id="n2w-error" role="alert" className="mt-2 text-xs font-medium text-red-600">
            {result.error}
          </p>
        )}

        <div className="mt-3 flex flex-wrap items-center gap-2">
          <span className="text-xs text-ink-400">نمونه:</span>
          {EXAMPLES.map((example) => (
            <button
              key={example.value}
              type="button"
              onClick={() => setInput(example.value)}
              className="rounded-lg border border-ink-200 bg-white px-2.5 py-1.5 text-xs font-semibold text-ink-600 transition hover:border-brand-200 hover:bg-brand-50 hover:text-brand-700"
            >
              {example.label}
            </button>
          ))}
        </div>
      </ToolPanel>

      <div className="mt-5 space-y-3">
        {input.trim() === "" ? (
          <ResultHint>عدد را وارد کنید تا معادل حروفی آن نمایش داده شود.</ResultHint>
        ) : result.ok ? (
          <>
            <div className="rounded-2xl border border-brand-200 bg-brand-50 p-5">
              <div className="text-xs font-medium text-brand-700">معادل حروفی</div>
              <p
                dir="rtl"
                aria-live="polite"
                className="mt-2 text-xl font-extrabold leading-9 text-brand-900 sm:text-2xl"
              >
                {result.words}
              </p>
            </div>
            <ResultRow
              label="عدد به رقم فارسی"
              value={formatFa(
                Number(toEnglishDigits(input).replace(/[,٬\s]/g, "")),
                10,
              )}
            />
          </>
        ) : null}
      </div>

      <p className="mt-4 text-xs leading-6 text-ink-400">
        مناسب برای نوشتن مبلغ در فاکتور، چک و قرارداد. اعداد اعشاری بعد از
        «ممیز» رقم‌به‌رقم خوانده می‌شوند (مثلاً ۱۲٫۵ → «دوازده ممیز پنج»).
      </p>
    </div>
  );
}
