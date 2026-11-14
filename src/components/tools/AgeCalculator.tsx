"use client";

import { useEffect, useMemo, useState } from "react";
import { CalendarDays, Cake, PartyPopper } from "lucide-react";
import {
  JALALI_MONTHS,
  MAX_JALALI_YEAR,
  MIN_JALALI_YEAR,
  calculateAge,
  isValidJalaliDate,
  jalaliMonthLength,
  todayJalali,
} from "@/lib/jalali";
import { toEnglishDigits, toPersianDigits } from "@/lib/persian";
import { ResultHint, ResultRow, ToolPanel, formatFa } from "./shared";

function parseInt10(value: string): number | null {
  const normalized = toEnglishDigits(value.trim());
  if (!/^\d+$/.test(normalized)) return null;
  return Number(normalized);
}

/**
 * Age calculator based on the Jalali (Solar Hijri) calendar.
 * Everything is computed locally from the visitor's clock.
 */
export function AgeCalculator() {
  const [birthYear, setBirthYear] = useState("");
  const [birthMonth, setBirthMonth] = useState("1");
  const [birthDay, setBirthDay] = useState("");
  const [today, setToday] = useState<{ jy: number; jm: number; jd: number } | null>(null);

  // Read "today" on the client only, so server and client markup agree.
  useEffect(() => {
    setToday(todayJalali());
  }, []);

  const year = parseInt10(birthYear);
  const day = parseInt10(birthDay);
  const month = Number(birthMonth);

  const dayCount = year && isValidJalaliDate(year, 1, 1) ? jalaliMonthLength(year, month) : 31;

  const invalidReason = useMemo(() => {
    if (year === null) return "سال تولد را وارد کنید.";
    if (year < MIN_JALALI_YEAR || year > MAX_JALALI_YEAR) {
      return `سال تولد باید بین ${toPersianDigits(MIN_JALALI_YEAR)} تا ${toPersianDigits(MAX_JALALI_YEAR)} باشد.`;
    }
    if (day === null) return "روز تولد را وارد کنید.";
    if (day > dayCount) {
      return `این ماه حداکثر ${toPersianDigits(dayCount)} روز دارد.`;
    }
    return null;
  }, [year, day, dayCount]);

  const age = useMemo(() => {
    if (!today || year === null || day === null) return null;
    return calculateAge({ jy: year, jm: month, jd: day }, today);
  }, [today, year, month, day]);

  const isFuture = useMemo(() => {
    if (!today || year === null || day === null) return false;
    if (!isValidJalaliDate(year, month, day)) return false;
    return calculateAge({ jy: year, jm: month, jd: day }, today) === null;
  }, [today, year, month, day]);

  const months = JALALI_MONTHS;
  const hasInput = birthYear.trim() !== "" || birthDay.trim() !== "";
  const showError = hasInput && (invalidReason !== null || isFuture);

  return (
    <div>
      <div className="grid gap-4 md:grid-cols-2">
        <ToolPanel
          title="تاریخ تولد (شمسی)"
          description="تاریخ تولد خود را به هجری شمسی وارد کنید."
          icon={<CalendarDays className="h-4 w-4 text-brand-600" aria-hidden="true" />}
        >
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label htmlFor="birth-day" className="mb-1.5 block text-xs font-semibold text-ink-700">
                روز
              </label>
              <input
                id="birth-day"
                type="text"
                inputMode="numeric"
                value={toPersianDigits(birthDay)}
                onChange={(event) => setBirthDay(toEnglishDigits(event.target.value).replace(/\D/g, ""))}
                placeholder="۱۲"
                aria-describedby="birth-day-hint"
                className="w-full rounded-xl border border-ink-200 bg-white px-3 py-3 text-center text-lg font-semibold text-ink-900 outline-none transition placeholder:font-normal placeholder:text-ink-300 focus:border-brand-400 focus:ring-4 focus:ring-brand-100"
              />
              <span id="birth-day-hint" className="sr-only">
                روز تولد، بین ۱ تا {toPersianDigits(dayCount)}
              </span>
            </div>
            <div>
              <label htmlFor="birth-month" className="mb-1.5 block text-xs font-semibold text-ink-700">
                ماه
              </label>
              <select
                id="birth-month"
                value={birthMonth}
                onChange={(event) => setBirthMonth(event.target.value)}
                className="w-full rounded-xl border border-ink-200 bg-white px-2 py-3 text-center text-base font-semibold text-ink-900 outline-none transition focus:border-brand-400 focus:ring-4 focus:ring-brand-100"
              >
                {months.map((name, index) => (
                  <option key={name} value={index + 1}>
                    {name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label htmlFor="birth-year" className="mb-1.5 block text-xs font-semibold text-ink-700">
                سال
              </label>
              <input
                id="birth-year"
                type="text"
                inputMode="numeric"
                value={toPersianDigits(birthYear)}
                onChange={(event) => setBirthYear(toEnglishDigits(event.target.value).replace(/\D/g, ""))}
                placeholder="۱۳۷۰"
                className="w-full rounded-xl border border-ink-200 bg-white px-3 py-3 text-center text-lg font-semibold text-ink-900 outline-none transition placeholder:font-normal placeholder:text-ink-300 focus:border-brand-400 focus:ring-4 focus:ring-brand-100"
              />
            </div>
          </div>

          {showError && (
            <p role="alert" className="mt-3 text-xs font-medium text-red-600">
              {isFuture ? "تاریخ تولد نمی‌تواند در آینده باشد." : invalidReason}
            </p>
          )}

          <p className="mt-3 text-xs leading-6 text-ink-400">
            {today ? (
              <>
                امروز <span className="font-semibold text-ink-600">{toPersianDigits(today.jd)} {months[today.jm - 1]} {toPersianDigits(today.jy)}</span> است
              </>
            ) : (
              "در حال خواندن تاریخ امروز…"
            )}
          </p>
        </ToolPanel>

        <ToolPanel title="سن دقیق">
          {age === null ? (
            <ResultHint>
              {showError ? "تاریخ را اصلاح کنید." : "تاریخ تولد را وارد کنید تا سن محاسبه شود."}
            </ResultHint>
          ) : (
            <div className="space-y-3">
              <div className="rounded-2xl border border-brand-200 bg-brand-50 p-5 text-center">
                <div className="text-xs font-medium text-brand-700">سن شما</div>
                <div className="mt-1 text-3xl font-extrabold text-brand-900">
                  {formatFa(age.years, 0)}
                  <span className="mx-1 text-lg font-bold">سال</span>
                  {age.months > 0 && (
                    <>
                      {formatFa(age.months, 0)}
                      <span className="mx-1 text-lg font-bold">ماه</span>
                    </>
                  )}
                  {age.days > 0 && (
                    <>
                      {formatFa(age.days, 0)}
                      <span className="mx-1 text-lg font-bold">روز</span>
                    </>
                  )}
                </div>
                {age.daysToBirthday === 0 ? (
                  <p className="mt-3 inline-flex items-center gap-1.5 rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-800">
                    <PartyPopper className="h-3.5 w-3.5" aria-hidden="true" />
                    امروز تولدتان است! تبریک
                  </p>
                ) : (
                  <p className="mt-3 inline-flex items-center gap-1.5 text-xs text-brand-700">
                    <Cake className="h-3.5 w-3.5" aria-hidden="true" />
                    {formatFa(age.daysToBirthday, 0)} روز تا تولد بعدی
                  </p>
                )}
              </div>

              <div className="grid gap-2">
                <ResultRow
                  label="مجموع روزها"
                  value={`${formatFa(age.totalDays, 0)} روز`}
                  copyable={false}
                />
                <ResultRow
                  label="مجموع هفته‌ها"
                  value={`${formatFa(age.totalWeeks, 0)} هفته`}
                  copyable={false}
                />
                <ResultRow
                  label="مجموع ماه‌ها"
                  value={`${formatFa(age.totalMonths, 0)} ماه`}
                  copyable={false}
                />
                <ResultRow
                  label="روز هفتهٔ تولد"
                  value={age.birthWeekday}
                  copyable={false}
                />
              </div>
            </div>
          )}
        </ToolPanel>
      </div>

      <p className="mt-4 text-xs leading-6 text-ink-400">
        تبدیل تاریخ شمسی به‌صورت محلی و بدون ارسال اطلاعات به سرور انجام می‌شود؛
        تاریخ تولد شما جایی ذخیره نمی‌گردد.
      </p>
    </div>
  );
}
