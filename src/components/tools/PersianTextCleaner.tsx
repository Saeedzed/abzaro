"use client";

import { useMemo, useState } from "react";
import { Check, Copy, Eraser, Sparkles, Undo2 } from "lucide-react";
import {
  cleanOptionLabels,
  cleanPersianText,
  defaultCleanOptions,
  type CleanOptions,
} from "@/lib/persian-text";
import { toPersianDigits } from "@/lib/persian";
import { cn } from "@/lib/utils";

const OPTION_ORDER: Array<keyof CleanOptions> = [
  "normalizeArabicLetters",
  "persianDigits",
  "collapseSpaces",
  "spaceBeforePunctuation",
  "removeInvisible",
  "collapseBlankLines",
];

const SAMPLE = `  علي  كتابش را   خواند ، و رفت .  \n\n\n\n  پایانِ   متن  `;

/**
 * Persian text cleaner — normalizes Arabic letter forms, stray spaces,
 * invisible marks and blank lines. Everything runs in the browser.
 */
export function PersianTextCleaner() {
  const [text, setText] = useState("");
  const [options, setOptions] = useState<CleanOptions>(defaultCleanOptions);
  const [copied, setCopied] = useState(false);

  const { text: cleaned, stats } = useMemo(
    () => cleanPersianText(text, options),
    [text, options],
  );

  const isEmpty = text.length === 0;
  const hasChanges = !isEmpty && cleaned !== text;

  async function handleCopy() {
    if (!cleaned) return;
    try {
      await navigator.clipboard.writeText(cleaned);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard unavailable — fail silently.
    }
  }

  function toggle(key: keyof CleanOptions) {
    setOptions((previous) => ({ ...previous, [key]: !previous[key] }));
  }

  return (
    <div>
      <div className="rounded-2xl border border-ink-200 bg-white p-4 shadow-card sm:p-5">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <label htmlFor="cleaner-input" className="text-sm font-bold text-ink-900">
            متن خود را وارد کنید
          </label>
          <button
            type="button"
            onClick={() => setText(SAMPLE)}
            className="text-xs font-medium text-brand-700 underline-offset-4 transition hover:underline"
          >
            درج متن نمونه
          </button>
        </div>
        <textarea
          id="cleaner-input"
          dir="auto"
          value={text}
          onChange={(event) => setText(event.target.value)}
          placeholder="متنی که می‌خواهید تمیز شود را اینجا بنویسید یا پیست کنید…"
          rows={7}
          className="mt-2 w-full resize-y rounded-xl border border-ink-200 bg-ink-50/50 p-4 text-base leading-8 text-ink-900 outline-none transition placeholder:text-ink-400 focus:border-brand-400 focus:bg-white focus:ring-4 focus:ring-brand-100"
        />
        <div className="mt-3 flex flex-wrap items-center gap-2">
          <span className="text-xs text-ink-400">
            {toPersianDigits(text.length)} کاراکتر ورودی
          </span>
          <span className="flex-1" />
          <button
            type="button"
            onClick={() => setText("")}
            disabled={isEmpty}
            className="inline-flex items-center gap-2 rounded-lg border border-ink-200 bg-white px-3 py-2 text-sm font-semibold text-ink-700 transition hover:bg-ink-100 disabled:cursor-not-allowed disabled:opacity-40"
          >
            <Eraser className="h-4 w-4" aria-hidden="true" />
            پاک کردن
          </button>
          <button
            type="button"
            onClick={() => setText(cleaned)}
            disabled={!hasChanges}
            className="inline-flex items-center gap-2 rounded-lg bg-brand-600 px-3 py-2 text-sm font-semibold text-white transition hover:bg-brand-700 disabled:cursor-not-allowed disabled:opacity-40"
          >
            <Sparkles className="h-4 w-4" aria-hidden="true" />
            اعمال روی متن
          </button>
        </div>
      </div>

      <fieldset className="mt-5 rounded-2xl border border-ink-200 bg-white p-4 shadow-card sm:p-5">
        <legend className="px-1 text-sm font-bold text-ink-900">قواعد پاک‌سازی</legend>
        <div className="mt-1 grid gap-2 sm:grid-cols-2">
          {OPTION_ORDER.map((key) => {
            const active = options[key];
            return (
              <label
                key={key}
                className={cn(
                  "flex cursor-pointer items-center gap-3 rounded-xl border px-3 py-2.5 text-sm transition",
                  active
                    ? "border-brand-200 bg-brand-50 text-ink-900"
                    : "border-ink-200 bg-white text-ink-600 hover:bg-ink-50",
                )}
              >
                <input
                  type="checkbox"
                  checked={active}
                  onChange={() => toggle(key)}
                  className="h-4 w-4 accent-brand-600"
                />
                <span className="font-medium">{cleanOptionLabels[key]}</span>
              </label>
            );
          })}
        </div>
      </fieldset>

      <div className="mt-5 rounded-2xl border border-ink-200 bg-white p-4 shadow-card sm:p-5">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h3 className="text-sm font-bold text-ink-900">نتیجه</h3>
          <button
            type="button"
            onClick={handleCopy}
            disabled={!cleaned}
            className="inline-flex items-center gap-2 rounded-lg bg-brand-600 px-3 py-2 text-sm font-semibold text-white transition hover:bg-brand-700 disabled:cursor-not-allowed disabled:opacity-40"
          >
            {copied ? (
              <Check className="h-4 w-4" aria-hidden="true" />
            ) : (
              <Copy className="h-4 w-4" aria-hidden="true" />
            )}
            {copied ? "کپی شد" : "کپی نتیجه"}
          </button>
        </div>

        <div
          dir="auto"
          aria-live="polite"
          className="mt-3 min-h-32 whitespace-pre-wrap break-words rounded-xl border border-ink-200 bg-ink-50/50 p-4 text-base leading-8 text-ink-900"
        >
          {cleaned || (
            <span className="text-sm text-ink-400">
              نتیجهٔ پاک‌سازی اینجا نمایش داده می‌شود…
            </span>
          )}
        </div>

        <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-ink-500">
          {isEmpty ? (
            <span>متنی وارد نشده است.</span>
          ) : hasChanges ? (
            <span className="font-medium text-emerald-700">
              {toPersianDigits(stats.total)} تغییر اعمال شد
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 font-medium text-emerald-700">
              <Undo2 className="h-3.5 w-3.5" aria-hidden="true" />
              متن شما از قبل تمیز بود — تغییری لازم نبود.
            </span>
          )}
          {stats.arabicLetters > 0 && (
            <span>
              {toPersianDigits(stats.arabicLetters)} «ی/ک» عربی اصلاح شد
            </span>
          )}
          {stats.extraSpaces > 0 && (
            <span>{toPersianDigits(stats.extraSpaces)} فاصلهٔ اضافی</span>
          )}
          {stats.punctuationSpaces > 0 && (
            <span>
              {toPersianDigits(stats.punctuationSpaces)} فاصله قبل از علامت
            </span>
          )}
          {stats.invisible > 0 && (
            <span>{toPersianDigits(stats.invisible)} کاراکتر نامرئی</span>
          )}
          {stats.blankLines > 0 && (
            <span>{toPersianDigits(stats.blankLines)} خط خالی اضافی</span>
          )}
          {stats.digits > 0 && (
            <span>{toPersianDigits(stats.digits)} رقم تبدیل‌شده</span>
          )}
        </div>
      </div>

      <p className="mt-4 text-xs leading-6 text-ink-400">
        نیم‌فاصله (U+200C) حفظ می‌شود، چون بخشی از املای درست فارسی است. متن شما
        هرگز از مرورگرتان خارج نمی‌شود.
      </p>
    </div>
  );
}
