"use client";

import { useMemo, useState } from "react";
import { Check, Copy, Eraser } from "lucide-react";
import { getTextStats } from "@/lib/text-stats";
import { toPersianDigits } from "@/lib/persian";
import { cn } from "@/lib/utils";

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-ink-200 bg-ink-50 px-4 py-3 text-center">
      <div className="text-xl font-extrabold text-ink-900 sm:text-2xl">
        {value}
      </div>
      <div className="mt-1 text-xs text-ink-500">{label}</div>
    </div>
  );
}

const LIMITS = [
  { label: "توضیحات متا (SEO)", limit: 160 },
  { label: "پست شبکه اجتماعی", limit: 280 },
] as const;

/**
 * Character counter — fully client-side. Counts characters with/without
 * spaces, words, lines, sentences and UTF-8 bytes, plus progress bars
 * against common character limits.
 */
export function CharacterCounter() {
  const [text, setText] = useState("");
  const [copied, setCopied] = useState(false);

  const stats = useMemo(() => getTextStats(text), [text]);
  const isEmpty = text.length === 0;

  async function handleCopy() {
    if (!text) return;
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard API unavailable (e.g. insecure context) — fail silently.
    }
  }

  function handleClear() {
    setText("");
    setCopied(false);
  }

  return (
    <div>
      <div className="rounded-2xl border border-ink-200 bg-white p-4 shadow-card sm:p-5">
        <label htmlFor="character-counter-input" className="sr-only">
          متن برای شمارش کاراکترها
        </label>
        <textarea
          id="character-counter-input"
          dir="auto"
          value={text}
          onChange={(event) => setText(event.target.value)}
          placeholder="متن خود را اینجا بنویسید یا پیست کنید…"
          rows={8}
          className="w-full resize-y rounded-xl border border-ink-200 bg-ink-50/50 p-4 text-base leading-8 text-ink-900 outline-none transition placeholder:text-ink-400 focus:border-brand-400 focus:bg-white focus:ring-4 focus:ring-brand-100"
        />
        <div className="mt-3 flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={handleCopy}
            disabled={isEmpty}
            className="inline-flex items-center gap-2 rounded-lg bg-brand-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-brand-700 disabled:cursor-not-allowed disabled:opacity-40"
          >
            {copied ? (
              <Check className="h-4 w-4" aria-hidden="true" />
            ) : (
              <Copy className="h-4 w-4" aria-hidden="true" />
            )}
            {copied ? "کپی شد" : "کپی متن"}
          </button>
          <button
            type="button"
            onClick={handleClear}
            disabled={isEmpty}
            className="inline-flex items-center gap-2 rounded-lg border border-ink-200 bg-white px-4 py-2 text-sm font-semibold text-ink-700 transition hover:bg-ink-100 disabled:cursor-not-allowed disabled:opacity-40"
          >
            <Eraser className="h-4 w-4" aria-hidden="true" />
            پاک کردن
          </button>
        </div>
      </div>

      <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-3">
        <StatCard
          label="کاراکتر (با فاصله)"
          value={toPersianDigits(stats.charactersWithSpaces)}
        />
        <StatCard
          label="کاراکتر (بدون فاصله)"
          value={toPersianDigits(stats.charactersWithoutSpaces)}
        />
        <StatCard label="کلمات" value={toPersianDigits(stats.words)} />
        <StatCard label="خطوط" value={toPersianDigits(stats.lines)} />
        <StatCard label="جمله‌ها" value={toPersianDigits(stats.sentences)} />
        <StatCard
          label="حجم متن (بایت)"
          value={toPersianDigits(stats.bytes)}
        />
      </div>

      <div className="mt-5 space-y-4 rounded-2xl border border-ink-200 bg-white p-4 shadow-card sm:p-5">
        <h3 className="text-sm font-bold text-ink-900">
          محدودیت‌های رایج کاراکتر
        </h3>
        {LIMITS.map(({ label, limit }) => {
          const count = stats.charactersWithSpaces;
          const percent = Math.min(100, (count / limit) * 100);
          const exceeded = count > limit;
          return (
            <div key={label}>
              <div className="flex items-center justify-between text-xs">
                <span className="font-medium text-ink-700">{label}</span>
                <span
                  className={cn(
                    "font-semibold",
                    exceeded ? "text-red-600" : "text-ink-500",
                  )}
                >
                  {toPersianDigits(count)} از {toPersianDigits(limit)}
                  {exceeded && " — از محدودیت گذشتید"}
                </span>
              </div>
              <div
                className="mt-2 h-2 overflow-hidden rounded-full bg-ink-100"
                role="progressbar"
                aria-valuenow={count}
                aria-valuemin={0}
                aria-valuemax={limit}
                aria-label={label}
              >
                <div
                  className={cn(
                    "h-full rounded-full transition-all duration-200",
                    exceeded ? "bg-red-500" : "bg-brand-500",
                  )}
                  style={{ width: `${percent}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>

      <p className="mt-4 text-xs leading-6 text-ink-400">
        حجم متن بر اساس کدگذاری UTF-8 محاسبه می‌شود؛ کاراکترهای فارسی معمولاً
        ۲ بایت و ایموجی‌ها ۴ بایت هستند. متن شما هرگز از مرورگرتان خارج
        نمی‌شود.
      </p>
    </div>
  );
}
