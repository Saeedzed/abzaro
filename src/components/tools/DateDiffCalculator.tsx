"use client";

import { useEffect, useMemo, useState } from "react";
import { ArrowLeftRight, CalendarDays, CalendarRange, Clock } from "lucide-react";
import { JALALI_MONTHS, MAX_JALALI_YEAR, MIN_JALALI_YEAR, jalaliMonthLength, todayJalali } from "@/lib/jalali";
import { diffDates, parseIsoJalali, type Ymd } from "@/lib/dates";
import { toEnglishDigits, toPersianDigits } from "@/lib/persian";
import { ResultHint, ResultRow, ToolPanel, formatFa } from "./shared";

function DateFields({
  id,
  label,
  value,
  onChange,
}: {
  id: string;
  label: string;
  value: Ymd;
  onChange: (next: Ymd) => void;
}) {
  const maxDay = jalaliMonthLength(value.y, value.m);
  return (
    <fieldset>
      <legend className="mb-1.5 text-xs font-semibold text-ink-700">{label}</legend>
      <div className="grid grid-cols-3 gap-2">
        <div>
          <label htmlFor={`${id}-day`} className="mb-1 block text-[10px] text-ink-500">
            روز
          </label>
          <input
            id={`${id}-day`}
            type="text"
            inputMode="numeric"
            value={toPersianDigits(String(value.d))}
            onChange={(event) => {
              const day = Number(toEnglishDigits(event.target.value).replace(/\D/g, ""));
              onChange({ ...value, d: Math.min(Math.max(day || 1, 1), maxDay) });
            }}
            className="w-full rounded-lg border border-ink-200 bg-white px-2 py-2 text-center text-sm font-semibold text-ink-900 outline-none focus:border-brand-400 focus:ring-4 focus:ring-brand-100"
            data-testid={`${id}-day`}
          />
        </div>
        <div>
          <label htmlFor={`${id}-month`} className="mb-1 block text-[10px] text-ink-500">
            ماه
          </label>
          <select
            id={`${id}-month`}
            data-testid={`${id}-month`}
            value={value.m}
            onChange={(event) => onChange({ ...value, m: Number(event.target.value) })}
            className="w-full rounded-lg border border-ink-200 bg-white px-1 py-2 text-xs font-medium text-ink-900 outline-none focus:border-brand-400 focus:ring-4 focus:ring-brand-100"
          >
            {JALALI_MONTHS.map((month, index) => (
              <option key={month} value={index + 1}>
                {month}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor={`${id}-year`} className="mb-1 block text-[10px] text-ink-500">
            سال
          </label>
          <input
            id={`${id}-year`}
            type="text"
            inputMode="numeric"
            value={toPersianDigits(String(value.y))}
            onChange={(event) => {
              const year = Number(toEnglishDigits(event.target.value).replace(/\D/g, ""));
              if (year === 0) {
                onChange({ ...value, y: MIN_JALALI_YEAR });
                return;
              }
              onChange({
                ...value,
                y: Math.min(Math.max(year, MIN_JALALI_YEAR), MAX_JALALI_YEAR),
              });
            }}
            className="w-full rounded-lg border border-ink-200 bg-white px-2 py-2 text-center text-sm font-semibold text-ink-900 outline-none focus:border-brand-400 focus:ring-4 focus:ring-brand-100"
            data-testid={`${id}-year`}
          />
        </div>
      </div>
    </fieldset>
  );
}

/**
 * Difference between two Jalali dates — days, weeks, months, years, plus the
 * weekday of each date. Also accepts a pasted ISO date (1403-05-12).
 */
export function DateDiffCalculator() {
  const [from, setFrom] = useState<Ymd>({ y: 1400, m: 1, d: 1 });
  const [to, setTo] = useState<Ymd>({ y: 1403, m: 1, d: 1 });
  const [ready, setReady] = useState(false);
  const [paste, setPaste] = useState("");

  useEffect(() => {
    const today = todayJalali();
    setTo({ y: today.jy, m: today.jm, d: today.jd });
    setReady(true);
  }, []);

  const diff = useMemo(() => diffDates(from, to), [from, to]);

  function applyPaste() {
    const parsed = parseIsoJalali(paste);
    if (parsed) {
      setFrom(parsed);
      setTo(parseIsoJalali(paste) ?? to);
      setPaste("");
    }
  }

  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <ToolPanel
        title="دو تاریخ"
        description="تاریخ‌ها بر اساس تقویم هجری شمسی."
        icon={<CalendarRange className="h-4 w-4 text-brand-600" aria-hidden="true" />}
      >
        <div className="space-y-4">
          <DateFields id="from" label="از تاریخ" value={from} onChange={setFrom} />
          <div className="flex justify-center">
            <button
              type="button"
              onClick={() => {
                setFrom(to);
                setTo(from);
              }}
              aria-label="جابه‌جایی دو تاریخ"
              className="flex h-8 w-8 items-center justify-center rounded-full border border-ink-200 bg-white text-brand-700 transition hover:bg-brand-50"
            >
              <ArrowLeftRight className="h-4 w-4" aria-hidden="true" />
            </button>
          </div>
          <DateFields id="to" label="تا تاریخ" value={to} onChange={setTo} />

          <div className="rounded-xl border border-ink-200 bg-ink-50 p-3">
            <label htmlFor="date-paste" className="mb-1 block text-[11px] font-semibold text-ink-700">
              جای‌گذاری سریع تاریخ (مثلاً ۱۴۰۳-۰۵-۱۲)
            </label>
            <div className="flex gap-2">
              <input
                id="date-paste"
                dir="ltr"
                value={paste}
                onChange={(event) => setPaste(event.target.value)}
                placeholder="1403-05-12"
                className="w-full rounded-lg border border-ink-200 bg-white px-2 py-1.5 text-xs text-ink-900 outline-none focus:border-brand-400"
              />
              <button
                type="button"
                onClick={applyPaste}
                className="shrink-0 rounded-lg bg-brand-600 px-3 py-1.5 text-[11px] font-semibold text-white transition hover:bg-brand-700"
              >
                اعمال
              </button>
            </div>
          </div>
        </div>
      </ToolPanel>

      <ToolPanel
        title="اختلاف دو تاریخ"
        description="بر حسب روز، هفته، ماه و سال"
        icon={<Clock className="h-4 w-4 text-brand-600" aria-hidden="true" />}
      >
        {diff && ready ? (
          <div className="space-y-3">
            <div className="rounded-xl border border-brand-200 bg-brand-50 px-4 py-4 text-center">
              <div className="text-xs font-medium text-brand-700">اختلاف دقیق</div>
              <div className="mt-1 text-lg font-extrabold text-brand-900" data-testid="date-diff-ymd">
                {formatFa(diff.years, 0)} سال و {formatFa(diff.months, 0)} ماه و{" "}
                {formatFa(diff.days, 0)} روز
              </div>
            </div>

            <ResultRow
              label="تعداد روز"
              value={`${formatFa(diff.absDays, 0)} روز`}
              emphasize
              hint={`${toPersianDigits(diff.weekdayA)} تا ${toPersianDigits(diff.weekdayB)}`}
            />
            <ResultRow
              label="بر حسب هفته"
              value={`${formatFa(diff.weeks, 0)} هفته و ${formatFa(diff.leftoverDays, 0)} روز`}
            />
            <ResultRow label="بر حسب ساعت" value={`${formatFa(diff.totalHours, 0)} ساعت`} />
            <ResultRow label="بر حسب دقیقه" value={`${formatFa(diff.totalMinutes, 0)} دقیقه`} />

            <div className="grid grid-cols-2 gap-2">
              <div className="rounded-xl border border-ink-200 bg-ink-50 px-3 py-2 text-center">
                <div className="text-[10px] text-ink-500">روز هفتهٔ تاریخ اول</div>
                <div className="mt-0.5 text-xs font-bold text-ink-900" data-testid="date-diff-weekday-a">
                  {toPersianDigits(diff.weekdayA)} · {toPersianDigits(from.d)} {JALALI_MONTHS[from.m - 1]}
                </div>
              </div>
              <div className="rounded-xl border border-ink-200 bg-ink-50 px-3 py-2 text-center">
                <div className="text-[10px] text-ink-500">روز هفتهٔ تاریخ دوم</div>
                <div className="mt-0.5 text-xs font-bold text-ink-900">
                  {toPersianDigits(diff.weekdayB)} · {toPersianDigits(to.d)} {JALALI_MONTHS[to.m - 1]}
                </div>
              </div>
            </div>

            <p className="text-[11px] leading-5 text-ink-400">
              {diff.direction === "same"
                ? "دو تاریخ یکسان هستند."
                : diff.direction === "later"
                  ? "تاریخ دوم بعد از تاریخ اول است."
                  : "تاریخ دوم قبل از تاریخ اول است."}
            </p>
          </div>
        ) : (
          <ResultHint>
            <span className="inline-flex items-center gap-1.5">
              <CalendarDays className="h-3.5 w-3.5" aria-hidden="true" />
              دو تاریخ معتبر انتخاب کنید.
            </span>
          </ResultHint>
        )}
      </ToolPanel>
    </div>
  );
}
