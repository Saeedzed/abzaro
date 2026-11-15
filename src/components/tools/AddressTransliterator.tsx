"use client";

import { useMemo, useState } from "react";

import { CopyButton } from "@/components/tools/CopyButton";
import { transliterateAddress } from "@/lib/transliterate";

const SAMPLE = "تهران، خیابان ولیعصر، کوچه بهار، پلاک ۱۲، واحد ۳";

export default function AddressTransliterator() {
  const [value, setValue] = useState(SAMPLE);
  const result = useMemo(() => transliterateAddress(value), [value]);
  const dictionaryCount = result.words.filter((w) => w.fromDictionary).length;

  return (
    <div className="space-y-6">
      <section className="rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-700 dark:bg-slate-900">
        <label className="block">
          <span className="mb-2 block text-sm font-semibold text-slate-700 dark:text-slate-300">
            نشانی فارسی
          </span>
          <textarea
            data-testid="addr-input"
            value={value}
            rows={3}
            onChange={(event) => setValue(event.target.value)}
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100"
          />
        </label>
        <button type="button" onClick={() => setValue(SAMPLE)}
          className="mt-2 rounded-lg bg-slate-100 px-3 py-1.5 text-xs font-semibold text-slate-700 dark:bg-slate-800 dark:text-slate-300">
          نمونه
        </button>
      </section>

      <section data-testid="addr-result" className="rounded-2xl border border-emerald-200 bg-emerald-50 p-5 dark:border-emerald-800 dark:bg-emerald-950/30">
        <div className="flex items-center justify-between gap-2">
          <h3 className="text-sm font-bold text-emerald-900 dark:text-emerald-200">نشانی لاتین</h3>
          <CopyButton value={result.latin} label="کپی" />
        </div>
        <p data-testid="addr-latin" dir="ltr" className="mt-2 break-words text-lg font-semibold text-slate-900 dark:text-slate-100">
          {result.latin || "—"}
        </p>
        <p data-testid="addr-stats" className="mt-2 text-xs text-slate-600 dark:text-slate-400">
          {result.words.length} کلمه · {dictionaryCount} کلمه از واژه‌نامهٔ نشانی، بقیه با نگاشت حرف‌به‌حرف
        </p>
      </section>

      {result.words.length > 0 ? (
        <section className="rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-700 dark:bg-slate-900">
          <h3 className="mb-3 text-sm font-bold text-slate-900 dark:text-slate-100">کلمه‌به‌کلمه</h3>
          <div className="overflow-x-auto">
            <table data-testid="addr-table" className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-200 text-xs text-slate-500 dark:border-slate-700">
                  <th className="pb-2 text-start font-medium">فارسی</th>
                  <th className="pb-2 text-start font-medium">لاتین</th>
                  <th className="pb-2 text-start font-medium">منبع</th>
                </tr>
              </thead>
              <tbody>
                {result.words.map((word, index) => (
                  <tr key={`${word.source}-${index}`} className="border-b border-slate-100 last:border-0 dark:border-slate-800">
                    <td className="py-1.5">{word.source}</td>
                    <td className="py-1.5" dir="ltr">{word.latin}</td>
                    <td className="py-1.5 text-xs text-slate-500">{word.fromDictionary ? "واژه‌نامه" : "حرف‌به‌حرف"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      ) : null}

      <p className="rounded-2xl border border-slate-200 bg-white p-4 text-xs leading-6 text-slate-600 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-400">
        این ابزار «آوانگاری» است نه ترجمه: نام‌ها همان‌طور که خوانده می‌شوند با حروف لاتین
        نوشته می‌شوند. برای بسته‌های پستی بین‌المللی و پر کردن فرم‌های لاتین مناسب است.
        واژه‌نامهٔ نشانی حدود ۱۵۰ کلمهٔ پرکاربرد را دقیق برگردان می‌کند؛ کلمات دیگر با نگاشت
        حرف‌به‌حرف ساخته می‌شوند و ممکن است نیاز به اصلاح دستی داشته باشند.
      </p>
    </div>
  );
}
