"use client";

import { useEffect, useMemo, useState } from "react";
import { Cake, CalendarDays, Clock3, Sparkles } from "lucide-react";
import {
  JALALI_MONTHS,
  MAX_JALALI_YEAR,
  MIN_JALALI_YEAR,
  jalaliMonthLength,
  todayJalali,
} from "@/lib/jalali";
import { exactAge } from "@/lib/dates";
import { toEnglishDigits, toPersianDigits } from "@/lib/persian";
import { ResultHint, ResultRow, ToolPanel, formatFa } from "./shared";

/**
 * Exact age calculator — years, months, days **and** hours/minutes, with the
 * weekday, zodiac sign and the countdown to the next birthday.
 */
export function ExactAgeCalculator() {
  const [day, setDay] = useState("");
  const [month, setMonth] = useState("1");
  const [year, setYear] = useState("");
  const [hour, setHour] = useState("");
  const [minute, setMinute] = useState("");
  const [now, setNow] = useState<{ y: number; m: number; d: number; h: number; i: number } | null>(null);

  // Read the clock on the client only (avoids hydration mismatch).
  useEffect(() => {
    const today = todayJalali();
    const clock = new Date();
    setNow({ y: today.jy, m: today.jm, d: today.jd, h: clock.getHours(), i: clock.getMinutes() });
  }, []);

  const yearNum = Number(toEnglishDigits(year).replace(/\D/g, ""));
  const dayNum = Number(toEnglishDigits(day).replace(/\D/g, ""));
  const monthNum = Number(month);
  const hourNum = hour === "" ? 0 : Number(toEnglishDigits(hour).replace(/\D/g, ""));
  const minuteNum = minute === "" ? 0 : Number(toEnglishDigits(minute).replace(/\D/g, ""));

  const maxDay = yearNum ? jalaliMonthLength(yearNum, monthNum) : 31;
  const validYear = yearNum >= MIN_JALALI_YEAR && yearNum <= MAX_JALALI_YEAR;
  const hasInput = day !== "" && year !== "";

  const result = useMemo(() => {
    if (!now || !hasInput || !validYear) return null;
    if (dayNum < 1 || dayNum > maxDay) return null;
    if (hourNum > 23 || minuteNum > 59) return null;
    return exactAge(
      { date: { y: yearNum, m: monthNum, d: dayNum }, hour: hourNum, minute: minuteNum },
      { date: { y: now.y, m: now.m, d: now.d }, hour: now.h, minute: now.i },
    );
  }, [now, hasInput, validYear, dayNum, maxDay, yearNum, monthNum, hourNum, minuteNum]);

  const futureError =
    hasInput && validYear && now && dayNum >= 1 && dayNum <= maxDay && result === null
      ? "این تاریخ در آینده است یا معتبر نیست."
      : null;

  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <ToolPanel
        title="تاریخ و ساعت تولد"
        description="ساعت تولد اختیاری است؛ برای دقت بیشتر واردش کنید."
        icon={<CalendarDays className="h-4 w-4 text-brand-600" aria-hidden="true" />}
      >
        <div className="space-y-3">
          <div className="grid grid-cols-3 gap-2">
            <div>
              <label htmlFor="ex-day" className="mb-1.5 block text-xs font-semibold text-ink-700">
                روز
              </label>
              <input
                id="ex-day"
                type="text"
                inputMode="numeric"
                value={toPersianDigits(day)}
                onChange={(event) => setDay(toEnglishDigits(event.target.value).replace(/\D/g, ""))}
                placeholder="۱۲"
                className="w-full rounded-lg border border-ink-200 bg-white px-2 py-2 text-center text-sm font-semibold text-ink-900 outline-none focus:border-brand-400 focus:ring-4 focus:ring-brand-100"
                data-testid="exact-day"
              />
            </div>
            <div>
              <label htmlFor="ex-month" className="mb-1.5 block text-xs font-semibold text-ink-700">
                ماه
              </label>
              <select
                id="ex-month"
                value={month}
                onChange={(event) => setMonth(event.target.value)}
                className="w-full rounded-lg border border-ink-200 bg-white px-1 py-2 text-xs font-medium text-ink-900 outline-none focus:border-brand-400"
              >
                {JALALI_MONTHS.map((name, index) => (
                  <option key={name} value={index + 1}>
                    {name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label htmlFor="ex-year" className="mb-1.5 block text-xs font-semibold text-ink-700">
                سال
              </label>
              <input
                id="ex-year"
                type="text"
                inputMode="numeric"
                value={toPersianDigits(year)}
                onChange={(event) => setYear(toEnglishDigits(event.target.value).replace(/\D/g, ""))}
                placeholder="۱۳۷۰"
                className="w-full rounded-lg border border-ink-200 bg-white px-2 py-2 text-center text-sm font-semibold text-ink-900 outline-none focus:border-brand-400 focus:ring-4 focus:ring-brand-100"
                data-testid="exact-year"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label htmlFor="ex-hour" className="mb-1.5 block text-xs font-semibold text-ink-700">
                ساعت (۰ تا ۲۳)
              </label>
              <input
                id="ex-hour"
                type="text"
                inputMode="numeric"
                value={toPersianDigits(hour)}
                onChange={(event) =>
                  setHour(toEnglishDigits(event.target.value).replace(/\D/g, "").slice(0, 2))
                }
                placeholder="۸"
                className="w-full rounded-lg border border-ink-200 bg-white px-2 py-2 text-center text-sm font-semibold text-ink-900 outline-none focus:border-brand-400"
                data-testid="exact-hour"
              />
            </div>
            <div>
              <label htmlFor="ex-minute" className="mb-1.5 block text-xs font-semibold text-ink-700">
                دقیقه (۰ تا ۵۹)
              </label>
              <input
                id="ex-minute"
                type="text"
                inputMode="numeric"
                value={toPersianDigits(minute)}
                onChange={(event) =>
                  setMinute(toEnglishDigits(event.target.value).replace(/\D/g, "").slice(0, 2))
                }
                placeholder="۳۰"
                className="w-full rounded-lg border border-ink-200 bg-white px-2 py-2 text-center text-sm font-semibold text-ink-900 outline-none focus:border-brand-400"
                data-testid="exact-minute"
              />
            </div>
          </div>

          {(futureError || (hasInput && !validYear)) && (
            <p role="alert" className="text-xs font-medium text-red-600" data-testid="exact-error">
              {futureError ??
                `سال باید بین ${toPersianDigits(MIN_JALALI_YEAR)} تا ${toPersianDigits(MAX_JALALI_YEAR)} باشد.`}
            </p>
          )}
          {hasInput && dayNum > maxDay && (
            <p role="alert" className="text-xs font-medium text-red-600">
              این ماه حداکثر {toPersianDigits(maxDay)} روز دارد.
            </p>
          )}
        </div>
      </ToolPanel>

      <ToolPanel
        title="سن دقیق"
        description="تا همین لحظه، به سال، ماه، روز، ساعت و دقیقه"
        icon={<Clock3 className="h-4 w-4 text-brand-600" aria-hidden="true" />}
      >
        {result ? (
          <div className="space-y-3">
            <div className="rounded-xl border border-brand-200 bg-brand-50 px-4 py-4 text-center">
              <div className="text-xs font-medium text-brand-700">شما دقیقاً</div>
              <div className="mt-1 flex flex-wrap items-center justify-center gap-1 text-lg font-extrabold text-brand-900" data-testid="exact-age">
                <span>{formatFa(result.years, 0)} سال</span>
                <span className="text-brand-400">و</span>
                <span>{formatFa(result.months, 0)} ماه</span>
                <span className="text-brand-400">و</span>
                <span>{formatFa(result.days, 0)} روز</span>
              </div>
              <div className="mt-1 text-sm font-semibold text-brand-800">
                و {formatFa(result.hours, 0)} ساعت و {formatFa(result.minutes, 0)} دقیقه
              </div>
            </div>

            <ResultRow label="مجموع روزها" value={`${formatFa(result.totalDays, 0)} روز`} emphasize />
            <ResultRow label="مجموع هفته‌ها" value={`${formatFa(result.totalWeeks, 0)} هفته`} />
            <ResultRow label="مجموع ساعت‌ها" value={`${formatFa(Math.round(result.totalHours), 0)} ساعت`} />
            <ResultRow label="مجموع دقیقه‌ها" value={`${formatFa(result.totalMinutes, 0)} دقیقه`} />

            <div className="grid grid-cols-2 gap-2">
              <div className="rounded-xl border border-ink-200 bg-ink-50 px-3 py-2.5 text-center">
                <div className="flex items-center justify-center gap-1 text-[10px] text-ink-500">
                  <Cake className="h-3 w-3" aria-hidden="true" />
                  تا تولد بعدی
                </div>
                <div className="mt-0.5 text-xs font-bold text-ink-900" data-testid="exact-next-birthday">
                  {result.nextBirthdayInDays === 0
                    ? "امروز تولدتان است! 🎂"
                    : `${formatFa(result.nextBirthdayInDays, 0)} روز`}
                </div>
              </div>
              <div className="rounded-xl border border-ink-200 bg-ink-50 px-3 py-2.5 text-center">
                <div className="flex items-center justify-center gap-1 text-[10px] text-ink-500">
                  <Sparkles className="h-3 w-3" aria-hidden="true" />
                  برج و روز هفته
                </div>
                <div className="mt-0.5 text-xs font-bold text-ink-900">
                  {toPersianDigits(result.sign)} · {toPersianDigits(result.weekday)}
                </div>
              </div>
            </div>
          </div>
        ) : (
          <ResultHint>
            تاریخ تولد (و در صورت تمایل ساعت) را وارد کنید.
          </ResultHint>
        )}
      </ToolPanel>
    </div>
  );
}
