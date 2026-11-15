"use client";

import { useMemo, useState } from "react";

import {
  addWorkingDays,
  describeDate,
  getHolidays,
  weekdayName,
} from "@/lib/holidays";
import {
  isValidJalaliDate,
  JALALI_MONTHS,
  jalaliMonthLength,
  jalaliToJdn,
  todayJalali,
} from "@/lib/jalali";
import { toEnglishDigits, toPersianDigits } from "@/lib/persian";

const fa = (value: number | string) => toPersianDigits(String(value));

/** Years whose holiday calendar is tabulated, so working-day counting is exact. */
const TABULATED = new Set(
  [1404, 1405].filter((year) => getHolidays(year).verified),
);

export default function WeekdayFinder() {
  const today = useMemo(() => todayJalali(), []);
  const [year, setYear] = useState(today.jy);
  const [month, setMonth] = useState(today.jm);
  const [day, setDay] = useState(today.jd);
  const [offset, setOffset] = useState(10);

  const y = Number(toEnglishDigits(String(year))) || 0;
  const m = Number(toEnglishDigits(String(month))) || 0;
  const d = Number(toEnglishDigits(String(day))) || 0;
  const valid = isValidJalaliDate(y, m, d);

  const info = valid ? describeDate(y, m, d) : null;
  const diffFromToday = valid
    ? jalaliToJdn(y, m, d) - jalaliToJdn(today.jy, today.jm, today.jd)
    : 0;
  const shifted = useMemo(() => {
    if (!valid || !TABULATED.has(y)) return null;
    return addWorkingDays(y, m, d, offset);
  }, [valid, y, m, d, offset]);

  return (
    <div className="space-y-6">
      <section className="rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-700 dark:bg-slate-900">
        <h3 className="mb-4 text-base font-bold text-slate-900 dark:text-slate-100">
          تاریخ شمسی
        </h3>
        <div className="grid grid-cols-3 gap-3">
          <label className="block">
            <span className="mb-1 block text-xs text-slate-500 dark:text-slate-400">سال</span>
            <input
              data-testid="weekday-year"
              value={year}
              inputMode="numeric"
              onChange={(event) => setYear(Number(toEnglishDigits(event.target.value)) || 0)}
              className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100"
            />
          </label>
          <label className="block">
            <span className="mb-1 block text-xs text-slate-500 dark:text-slate-400">ماه</span>
            <select
              data-testid="weekday-month"
              value={month}
              onChange={(event) => setMonth(Number(event.target.value))}
              className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100"
            >
              {JALALI_MONTHS.map((name, index) => (
                <option key={name} value={index + 1}>
                  {name}
                </option>
              ))}
            </select>
          </label>
          <label className="block">
            <span className="mb-1 block text-xs text-slate-500 dark:text-slate-400">روز</span>
            <input
              data-testid="weekday-day"
              value={day}
              inputMode="numeric"
              onChange={(event) => setDay(Number(toEnglishDigits(event.target.value)) || 0)}
              className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100"
            />
          </label>
        </div>

        <div className="mt-3 flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => {
              setYear(today.jy);
              setMonth(today.jm);
              setDay(today.jd);
            }}
            className="rounded-lg bg-slate-100 px-3 py-1.5 text-xs font-semibold text-slate-700 dark:bg-slate-800 dark:text-slate-300"
          >
            امروز
          </button>
          <button
            type="button"
            onClick={() => {
              setYear(today.jy);
              setMonth(1);
              setDay(1);
            }}
            className="rounded-lg bg-slate-100 px-3 py-1.5 text-xs font-semibold text-slate-700 dark:bg-slate-800 dark:text-slate-300"
          >
            اول سال جاری
          </button>
        </div>

        {!valid ? (
          <p
            data-testid="weekday-error"
            className="mt-4 rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-700 dark:bg-rose-950/40 dark:text-rose-300"
          >
            {m >= 1 && m <= 12 && Number.isFinite(y) && y > 0
              ? `${JALALI_MONTHS[m - 1]} ${fa(y)} فقط ${fa(jalaliMonthLength(y, m))} روز دارد.`
              : "تاریخ شمسی معتبر وارد کنید."}
          </p>
        ) : null}
      </section>

      {info ? (
        <>
          <section
            data-testid="weekday-result"
            className="rounded-2xl border border-emerald-200 bg-emerald-50 p-5 dark:border-emerald-800 dark:bg-emerald-950/30"
          >
            <p className="text-sm text-slate-600 dark:text-slate-400">
              {fa(info.jd)} {JALALI_MONTHS[info.jm - 1]} {fa(info.jy)}
            </p>
            <p
              data-testid="weekday-name"
              className="mt-1 text-3xl font-extrabold text-emerald-900 dark:text-emerald-200"
            >
              {info.weekday}
            </p>
            <ul className="mt-3 space-y-1 text-sm text-slate-700 dark:text-slate-300">
              <li>
                وضعیت:{" "}
                <strong>
                  {info.holiday
                    ? `تعطیل رسمی — ${info.holiday.title}`
                    : info.friday
                      ? "جمعه (تعطیل هفتگی)"
                      : "روز کاری"}
                </strong>
              </li>
              <li>نوع تعطیلی: {info.holiday ? (info.holiday.kind === "fixed" ? "ثابت (شمسی)" : "قمری") : "—"}</li>
              <li>
                فاصله از امروز:{" "}
                <strong>
                  {fa(Math.abs(diffFromToday))} روز {diffFromToday >= 0 ? "بعد" : "قبل"}
                </strong>
              </li>
            </ul>
          </section>

          <section className="rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-700 dark:bg-slate-900">
            <h3 className="mb-3 text-base font-bold text-slate-900 dark:text-slate-100">
              روز کاری بعدی / قبلی
            </h3>
            {TABULATED.has(y) ? (
              <>
                <div className="mb-3 flex flex-wrap items-center gap-2">
                  <span className="text-sm text-slate-600 dark:text-slate-400">
                    چند روز کاری:
                  </span>
                  {[-5, -1, 1, 5, 10].map((value) => (
                    <button
                      key={value}
                      type="button"
                      data-testid={`weekday-offset-${value}`}
                      onClick={() => setOffset(value)}
                      className={`rounded-lg px-3 py-1 text-sm font-semibold ${
                        offset === value
                          ? "bg-emerald-600 text-white"
                          : "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300"
                      }`}
                    >
                      {value > 0 ? `${fa(value)}+` : fa(value)}
                    </button>
                  ))}
                </div>
                {shifted ? (
                  <div data-testid="weekday-shifted" className="rounded-xl bg-slate-50 p-4 dark:bg-slate-800/60">
                    <p className="text-lg font-bold text-slate-900 dark:text-slate-100">
                      {fa(shifted.jd)} {JALALI_MONTHS[shifted.jm - 1]} {fa(shifted.jy)} —{" "}
                      {weekdayName(shifted.jy, shifted.jm, shifted.jd)}
                    </p>
                    {shifted.skipped.length > 0 ? (
                      <>
                        <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">
                          رد شده (تعطیل یا جمعه):
                        </p>
                        <ul className="mt-1 space-y-0.5 text-xs text-slate-600 dark:text-slate-400">
                          {shifted.skipped.map((line) => (
                            <li key={line}>{line}</li>
                          ))}
                        </ul>
                      </>
                    ) : (
                      <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">
                        در این بازه تعطیلی نبود.
                      </p>
                    )}
                  </div>
                ) : null}
              </>
            ) : (
              <p className="rounded-lg bg-amber-50 px-3 py-2 text-sm text-amber-800 dark:bg-amber-950/40 dark:text-amber-300">
                برای شمارش روز کاری، تقویم تعطیلات سال لازم است و فقط برای{" "}
                {fa(1404)} و {fa(1405)} در دسترس است.
              </p>
            )}
          </section>
        </>
      ) : null}

      <section className="rounded-2xl border border-slate-200 bg-white p-5 text-xs leading-6 text-slate-600 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-400">
        <h3 className="mb-2 text-sm font-bold text-slate-900 dark:text-slate-100">
          چطور محاسبه می‌شود؟
        </h3>
        <p>
          تاریخ شمسی به «روز ژولیوسی» تبدیل می‌شود و روز هفته از باقی‌ماندهٔ تقسیم آن بر ۷
          به دست می‌آید؛ مبدأ، شنبه است. همین تبدیل برای رفتن به روز کاری بعدی استفاده
          می‌شود و جمعه‌ها و تعطیلات رسمی رد می‌شوند.
        </p>
      </section>
    </div>
  );
}
