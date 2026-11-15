"use client";

import { useMemo, useState } from "react";

import { CopyButton } from "@/components/tools/CopyButton";
import { CONTACT_LABEL, scanContacts, unique, type ContactKind } from "@/lib/extract-contacts";

const SAMPLE = `سلام، برای هماهنگی با شمارهٔ ۰۹۱۲۳۴۵۶۷۸۹ یا 021-88776655 تماس بگیرید.
ایمیل: info@example.com
وب‌سایت: https://example.ir/contact`;

export default function ContactExtractor() {
  const [value, setValue] = useState(SAMPLE);
  const scan = useMemo(() => scanContacts(value), [value]);
  const groups: Array<{ kind: ContactKind; items: string[] }> = [
    { kind: "emails", items: unique(scan.emails).map((e) => e.value) },
    { kind: "mobiles", items: unique(scan.mobiles).map((e) => e.value) },
    { kind: "landlines", items: unique(scan.landlines).map((e) => e.value) },
    { kind: "urls", items: unique(scan.urls).map((e) => e.value) },
  ];
  const total = groups.reduce((sum, group) => sum + group.items.length, 0);

  return (
    <div className="space-y-6">
      <section className="rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-700 dark:bg-slate-900">
        <textarea
          data-testid="contact-input"
          value={value}
          rows={6}
          onChange={(event) => setValue(event.target.value)}
          placeholder="متن را اینجا بچسبانید…"
          className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100"
        />
        <div className="mt-2 flex flex-wrap items-center gap-2">
          <button type="button" onClick={() => setValue(SAMPLE)}
            className="rounded-lg bg-slate-100 px-3 py-1.5 text-xs font-semibold text-slate-700 dark:bg-slate-800 dark:text-slate-300">نمونه</button>
          <button type="button" onClick={() => setValue("")}
            className="rounded-lg bg-slate-100 px-3 py-1.5 text-xs font-semibold text-slate-700 dark:bg-slate-800 dark:text-slate-300">پاک کردن</button>
          <span data-testid="contact-total" className="text-xs text-slate-500 dark:text-slate-400">
            مجموع: {total} مورد
          </span>
        </div>
      </section>

      <div className="grid gap-4 sm:grid-cols-2">
        {groups.map((group) => (
          <section key={group.kind} data-testid={`contact-${group.kind}`}
            className="rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-900">
            <h3 className="mb-2 text-sm font-bold text-slate-900 dark:text-slate-100">
              {CONTACT_LABEL[group.kind]}{" "}
              <span className="text-xs font-normal text-slate-500">({group.items.length})</span>
            </h3>
            {group.items.length === 0 ? (
              <p className="text-xs text-slate-400">چیزی پیدا نشد</p>
            ) : (
              <ul className="space-y-1">
                {group.items.map((item) => (
                  <li key={item} dir="ltr" className="flex items-center justify-between gap-2 rounded bg-slate-50 px-2 py-1 text-sm dark:bg-slate-800/60">
                    <span className="truncate">{item}</span>
                    <CopyButton value={item} label="کپی" />
                  </li>
                ))}
              </ul>
            )}
          </section>
        ))}
      </div>

      <p className="rounded-2xl border border-slate-200 bg-white p-4 text-xs leading-6 text-slate-600 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-400">
        ارقام فارسی و عربی اول به لاتین تبدیل می‌شوند، بعد الگوها اجرا می‌شوند. شماره‌های
        موبایل به شکل ۰۹xxxxxxxxx یکدست می‌شوند (پیش‌شمارهٔ ۹۸ حذف می‌شود). هر متن مشکوک به
        شماره — مثل کد ملی ۱۰ رقمی — ممکن است به‌اشتباه در فهرست تلفن بیاید؛ نتیجه را یک‌بار
        مرور کنید.
      </p>
    </div>
  );
}
