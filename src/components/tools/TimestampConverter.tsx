"use client";

import { useEffect, useMemo, useState } from "react";
import { CalendarClock, Clock } from "lucide-react";
import { describeTimestamp, parseTimestamp } from "@/lib/data-tools";
import { toPersianDigits } from "@/lib/persian";
import { ResultRow, ToolPanel } from "./shared";

const PRESETS = [
  { label: "الان", value: () => Math.floor(Date.now() / 1000) },
  { label: "۲۰۲۴-۰۱-۰۱", value: () => 1704067200 },
  { label: "۲۰۰۰-۰۱-۰۱", value: () => 946684800 },
  { label: "۲۰۳۰-۰۱-۰۱", value: () => 1893456000 },
];

/** تبدیل Timestamp به تاریخ شمسی/میلادی و برعکس. */
export function TimestampConverter() {
  // Start empty so the server HTML and the first client render match; «الان»
  // is filled in after mount (and a shared ?ts= value wins over it).
  const [input, setInput] = useState("");
  const [unit, setUnit] = useState<"auto" | "s" | "ms">("auto");
  const [iso, setIso] = useState("");

  useEffect(() => {
    const shared = new URLSearchParams(window.location.search).get("ts");
    setInput(shared && shared.trim() !== "" ? shared : String(Math.floor(Date.now() / 1000)));
  }, []);

  const millis = useMemo(() => parseTimestamp(input, unit), [input, unit]);
  const parts = useMemo(() => (millis === null ? null : describeTimestamp(millis)), [millis]);
  const fromIso = useMemo(() => {
    if (!iso) return null;
    const parsed = new Date(`${iso}T00:00:00Z`);
    return Number.isNaN(parsed.getTime()) ? null : parsed.getTime();
  }, [iso]);
  const isoParts = fromIso === null ? null : describeTimestamp(fromIso);

  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <ToolPanel
        title="Timestamp → تاریخ"
        description="ثانیه یا میلی‌ثانیه؛ خودش تشخیص می‌دهد"
        icon={<Clock className="h-4 w-4 text-brand-600" aria-hidden="true" />}
      >
        <div className="space-y-3">
          <div>
            <label htmlFor="ts-input" className="mb-1 block text-xs font-semibold text-ink-700">
              Timestamp (Unix)
            </label>
            <input
              id="ts-input"
              dir="ltr"
              value={input}
              onChange={(event) => setInput(event.target.value)}
              data-testid="timestamp-input"
              className="w-full rounded-lg border border-ink-200 px-3 py-2 font-mono text-sm outline-none focus:border-brand-400"
            />
          </div>

          <div className="flex gap-2">
            {(
              [
                { id: "auto", label: "خودکار" },
                { id: "s", label: "ثانیه" },
                { id: "ms", label: "میلی‌ثانیه" },
              ] as const
            ).map((option) => (
              <button
                key={option.id}
                type="button"
                onClick={() => setUnit(option.id)}
                aria-pressed={unit === option.id}
                className={
                  unit === option.id
                    ? "flex-1 rounded-lg border border-brand-300 bg-brand-50 px-2 py-1.5 text-[11px] font-semibold text-brand-700"
                    : "flex-1 rounded-lg border border-ink-200 px-2 py-1.5 text-[11px] font-semibold text-ink-600 transition hover:bg-ink-100"
                }
              >
                {option.label}
              </button>
            ))}
          </div>

          <div className="flex flex-wrap gap-2">
            {PRESETS.map((preset) => (
              <button
                key={preset.label}
                type="button"
                onClick={() => setInput(String(preset.value()))}
                className="rounded-full border border-ink-200 bg-white px-3 py-1 text-[11px] font-medium text-ink-600 transition hover:border-brand-300"
              >
                {preset.label}
              </button>
            ))}
          </div>

          <div className="space-y-2 pt-1">
            {parts ? (
              <>
                <ResultRow label="تاریخ شمسی" value={parts.jalali} testId="ts-jalali" />
                <ResultRow label="تاریخ میلادی" value={`${parts.gregorian} · ${parts.time} UTC`} />
                <ResultRow label="ISO 8601" value={parts.iso} />
                <ResultRow label="ثانیه" value={String(parts.seconds)} copyable={false} />
                <ResultRow label="میلی‌ثانیه" value={String(parts.millis)} copyable={false} />
                <p className="text-[11px] leading-6 text-ink-400">
                  زمان نمایش‌داده‌شده بر اساس UTC است تا نتیجه روی همهٔ دستگاه‌ها
                  یکسان باشد.
                </p>
              </>
            ) : (
              <p className="rounded-xl border border-dashed border-ink-200 bg-ink-50/60 px-4 py-6 text-center text-sm text-ink-400">
                یک timestamp معتبر وارد کنید (مثلاً {toPersianDigits(1704067200)}).
              </p>
            )}
          </div>
        </div>
      </ToolPanel>

      <ToolPanel
        title="تاریخ → Timestamp"
        description="تاریخ میلادی را انتخاب کنید"
        icon={<CalendarClock className="h-4 w-4 text-brand-600" aria-hidden="true" />}
      >
        <div className="space-y-3">
          <div>
            <label htmlFor="iso-input" className="mb-1 block text-xs font-semibold text-ink-700">
              تاریخ (میلادی)
            </label>
            <input
              id="iso-input"
              type="date"
              dir="ltr"
              value={iso}
              onChange={(event) => setIso(event.target.value)}
              data-testid="date-input"
              className="w-full rounded-lg border border-ink-200 px-3 py-2 text-sm outline-none focus:border-brand-400"
            />
          </div>

          {isoParts ? (
            <div className="space-y-2">
              <ResultRow label="Timestamp (ثانیه)" value={String(isoParts.seconds)} testId="ts-from-date" />
              <ResultRow label="میلی‌ثانیه" value={String(isoParts.millis)} />
              <ResultRow label="شمسی" value={isoParts.jalali} />
              <ResultRow label="روز هفته" value={isoParts.weekday} copyable={false} />
            </div>
          ) : (
            <p className="rounded-xl border border-dashed border-ink-200 bg-ink-50/60 px-4 py-6 text-center text-sm text-ink-400">
              یک تاریخ انتخاب کنید تا timestamp آن ساخته شود.
            </p>
          )}

          <p className="rounded-xl bg-ink-50 px-3 py-2 text-[11px] leading-6 text-ink-500">
            در جاوااسکریپت <code dir="ltr">Date.now()</code> میلی‌ثانیه برمی‌گرداند؛
            در PHP و Python معمولاً ثانیه. اگر عدد ۱۳ رقمی باشد میلی‌ثانیه است.
          </p>
        </div>
      </ToolPanel>
    </div>
  );
}
