"use client";

import { useMemo, useState } from "react";
import { Check, Copy, Eraser } from "lucide-react";
import {
  READING_WPM,
  SPEAKING_WPM,
  estimateSeconds,
  formatDuration,
  getTextStats,
} from "@/lib/text-stats";
import { toPersianDigits } from "@/lib/persian";

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

/**
 * Word counter — fully client-side. Counts words, characters, sentences,
 * paragraphs, lines and estimates reading / speaking time.
 */
export function WordCounter() {
  const [text, setText] = useState("");
  const [copied, setCopied] = useState(false);

  const stats = useMemo(() => getTextStats(text), [text]);
  const readingSeconds = estimateSeconds(stats.words, READING_WPM);
  const speakingSeconds = estimateSeconds(stats.words, SPEAKING_WPM);
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
        <label htmlFor="word-counter-input" className="sr-only">
          متن برای شمارش کلمات
        </label>
        <textarea
          id="word-counter-input"
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
          <span className="ms-auto text-xs text-ink-400">
            {toPersianDigits(text.length)} کاراکتر
          </span>
        </div>
      </div>

      <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatCard label="کلمات" value={toPersianDigits(stats.words)} />
        <StatCard
          label="کاراکتر (با فاصله)"
          value={toPersianDigits(stats.charactersWithSpaces)}
        />
        <StatCard
          label="کاراکتر (بدون فاصله)"
          value={toPersianDigits(stats.charactersWithoutSpaces)}
        />
        <StatCard label="جمله‌ها" value={toPersianDigits(stats.sentences)} />
        <StatCard
          label="پاراگراف‌ها"
          value={toPersianDigits(stats.paragraphs)}
        />
        <StatCard label="خطوط" value={toPersianDigits(stats.lines)} />
        <StatCard label="زمان مطالعه" value={formatDuration(readingSeconds)} />
        <StatCard label="زمان گفتار" value={formatDuration(speakingSeconds)} />
      </div>

      <p className="mt-4 text-xs leading-6 text-ink-400">
        زمان مطالعه بر اساس سرعت متوسط خواندن فارسی (
        {toPersianDigits(READING_WPM)} کلمه در دقیقه) و زمان گفتار بر اساس{" "}
        {toPersianDigits(SPEAKING_WPM)} کلمه در دقیقه محاسبه می‌شود. متن شما
        هرگز از مرورگرتان خارج نمی‌شود.
      </p>
    </div>
  );
}
