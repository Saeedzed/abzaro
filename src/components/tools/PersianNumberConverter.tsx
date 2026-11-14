"use client";

import { useState } from "react";
import { ArrowLeftRight, Check, Copy } from "lucide-react";
import { formatPersianNumberFromString, toEnglishDigits } from "@/lib/persian";
import { cn } from "@/lib/utils";

type CopyTarget = "toPersian" | "toEnglish" | null;

/**
 * Persian number converter — fully client-side.
 * Panel 1: English (or any-script) number → Persian digits with separators.
 * Panel 2: Persian/Arabic digits → English digits.
 */
export function PersianNumberConverter() {
  const [input, setInput] = useState("");
  const [faInput, setFaInput] = useState("");
  const [copied, setCopied] = useState<CopyTarget>(null);

  const persianResult = formatPersianNumberFromString(input);
  const isInvalid = input.trim() !== "" && persianResult === null;
  const englishResult = toEnglishDigits(faInput).trim();

  async function handleCopy(value: string, target: Exclude<CopyTarget, null>) {
    if (!value) return;
    try {
      await navigator.clipboard.writeText(value);
      setCopied(target);
      window.setTimeout(() => setCopied(null), 2000);
    } catch {
      // Clipboard API unavailable (e.g. insecure context) — fail silently.
    }
  }

  return (
    <div>
      <div className="grid gap-5 md:grid-cols-2">
        {/* English → Persian */}
        <div className="rounded-2xl border border-ink-200 bg-white p-5 shadow-card">
          <h3 className="flex items-center gap-2 text-base font-bold text-ink-900">
            <ArrowLeftRight className="h-4 w-4 text-brand-600" aria-hidden="true" />
            انگلیسی به فارسی
          </h3>
          <label htmlFor="to-persian-input" className="sr-only">
            عدد برای تبدیل به فارسی
          </label>
          <input
            id="to-persian-input"
            dir="ltr"
            inputMode="decimal"
            value={input}
            onChange={(event) => setInput(event.target.value)}
            placeholder="1234567"
            className="no-spinner mt-4 w-full rounded-xl border border-ink-200 bg-ink-50/50 px-4 py-3 text-left text-lg font-semibold tracking-wide text-ink-900 outline-none transition placeholder:text-ink-300 focus:border-brand-400 focus:bg-white focus:ring-4 focus:ring-brand-100"
          />
          {isInvalid && (
            <p role="alert" className="mt-2 text-xs font-medium text-red-600">
              عدد معتبر وارد کنید (فقط ارقام و حداکثر یک نقطه اعشار).
            </p>
          )}
          <div className="mt-4 flex items-center justify-between gap-3 rounded-xl bg-brand-50 px-4 py-3.5">
            <span
              dir="rtl"
              className={cn(
                "min-w-0 flex-1 truncate text-xl font-extrabold text-brand-900",
                !persianResult && "text-base font-medium text-ink-400",
              )}
            >
              {persianResult ?? "نتیجه اینجا نمایش داده می‌شود"}
            </span>
            <button
              type="button"
              onClick={() => persianResult && handleCopy(persianResult, "toPersian")}
              disabled={!persianResult}
              aria-label="کپی نتیجه فارسی"
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-white text-brand-700 shadow-card transition hover:bg-brand-100 disabled:cursor-not-allowed disabled:opacity-40"
            >
              {copied === "toPersian" ? (
                <Check className="h-4 w-4" aria-hidden="true" />
              ) : (
                <Copy className="h-4 w-4" aria-hidden="true" />
              )}
            </button>
          </div>
        </div>

        {/* Persian → English */}
        <div className="rounded-2xl border border-ink-200 bg-white p-5 shadow-card">
          <h3 className="flex items-center gap-2 text-base font-bold text-ink-900">
            <ArrowLeftRight className="h-4 w-4 text-brand-600" aria-hidden="true" />
            فارسی به انگلیسی
          </h3>
          <label htmlFor="to-english-input" className="sr-only">
            عدد فارسی برای تبدیل به انگلیسی
          </label>
          <input
            id="to-english-input"
            dir="rtl"
            inputMode="numeric"
            value={faInput}
            onChange={(event) => setFaInput(event.target.value)}
            placeholder="۱۲۳۴۵۶۷"
            className="mt-4 w-full rounded-xl border border-ink-200 bg-ink-50/50 px-4 py-3 text-lg font-semibold tracking-wide text-ink-900 outline-none transition placeholder:text-ink-300 focus:border-brand-400 focus:bg-white focus:ring-4 focus:ring-brand-100"
          />
          <div className="mt-4 flex items-center justify-between gap-3 rounded-xl bg-brand-50 px-4 py-3.5">
            <span
              dir="ltr"
              className={cn(
                "min-w-0 flex-1 truncate text-left text-xl font-extrabold text-brand-900",
                !englishResult && "text-base font-medium text-ink-400",
              )}
            >
              {englishResult || "نتیجه اینجا نمایش داده می‌شود"}
            </span>
            <button
              type="button"
              onClick={() => englishResult && handleCopy(englishResult, "toEnglish")}
              disabled={!englishResult}
              aria-label="کپی نتیجه انگلیسی"
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-white text-brand-700 shadow-card transition hover:bg-brand-100 disabled:cursor-not-allowed disabled:opacity-40"
            >
              {copied === "toEnglish" ? (
                <Check className="h-4 w-4" aria-hidden="true" />
              ) : (
                <Copy className="h-4 w-4" aria-hidden="true" />
              )}
            </button>
          </div>
        </div>
      </div>

      <p className="mt-4 text-xs leading-6 text-ink-400">
        در بخش اول می‌توانید ارقام فارسی، عربی یا انگلیسی را وارد کنید؛
        جداکننده‌های هزارگان (کاما یا «٬») به‌صورت خودکار حذف می‌شوند. تبدیل
        کاملاً در مرورگر شما انجام می‌شود.
      </p>
    </div>
  );
}
