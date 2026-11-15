"use client";

import { useMemo, useState } from "react";

import {
  describeDate,
  getHolidays,
  holidayStats,
  HOLIDAY_YEARS,
  upcomingHolidays,
} from "@/lib/holidays";
import { JALALI_MONTHS, todayJalali, weekdayFromJdn, jalaliToJdn } from "@/lib/jalali";
import { toPersianDigits } from "@/lib/persian";

const fa = (value: number | string) => toPersianDigits(String(value));

export default function HolidayCalendar() {
  const today = useMemo(() => todayJalali(), []);
  const [year, setYear] = useState<number>(
    HOLIDAY_YEARS.includes(today.jy) ? today.jy : (HOLIDAY_YEARS.at(-1) ?? 1405),
  );

  const data = useMemo(() => getHolidays(year), [year]);
  const stats = useMemo(() => holidayStats(year), [year]);
  const upcoming = useMemo(
    () => upcomingHolidays(today.jy, today.jm, today.jd, 5),
    [today],
  );

  const todayInfo = describeDate(today.jy, today.jm, today.jd);
  const todayJdn = jalaliToJdn(today.jy, today.jm, today.jd);

  return (
    <div className="space-y-6">
      {/* ── today ── */}
      <section
        data-testid="holiday-today"
        className={`rounded-2xl border p-5 ${
          todayInfo.dayOff
            ? "border-emerald-300 bg-emerald-50 dark:border-emerald-800 dark:bg-emerald-950/40"
            : "border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-900"
        }`}
      >
        <h3 className="mb-2 text-base font-bold text-slate-900 dark:text-slate-100">
          امروز
        </h3>
        <p className="text-sm text-slate-700 dark:text-slate-300">
          {fa(today.jy)}/{fa(today.jm)}/{fa(today.jd)} — {todayInfo.weekday}
          {todayInfo.holiday ? ` — ${todayInfo.holiday.title}` : ""}
        </p>
        <p
          data-testid="holiday-today-verdict"
          className={`mt-2 inline-flex rounded-full px-3 py-1 text-sm font-semibold ${
            todayInfo.dayOff
              ? "bg-emerald-600 text-white"
              : "bg-slate-200 text-slate-700 dark:bg-slate-700 dark:text-slate-200"
          }`}
        >
          {todayInfo.dayOff ? "تعطیل است" : "روز کاری است"}
        </p>
        {todayInfo.friday && !todayInfo.holiday ? (
          <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">
            جمعه است؛ تعطیلی هفتگی، نه مناسبت رسمی.
          </p>
        ) : null}
      </section>

      {/* ── year picker ── */}
      <section className="rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-700 dark:bg-slate-900">
        <div className="mb-4 flex flex-wrap items-center gap-2">
          <span className="text-sm font-semibold text-slate-700 dark:text-slate-300">
            سال:
          </span>
          <div data-testid="holiday-year-tabs" className="flex gap-2">
            {HOLIDAY_YEARS.map((y) => (
              <button
                key={y}
                type="button"
                data-testid={`holiday-year-${y}`}
                aria-selected={y === year}
                onClick={() => setYear(y)}
                className={`rounded-lg px-4 py-1.5 text-sm font-semibold transition ${
                  y === year
                    ? "bg-emerald-600 text-white"
                    : "bg-slate-100 text-slate-700 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300"
                }`}
              >
                {fa(y)}
              </button>
            ))}
          </div>
        </div>

        <dl className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {[
            { label: "تعطیلات رسمی", value: stats.total },
            { label: "از این تعداد، جمعه", value: stats.onFriday },
            { label: "روزهای جمعه", value: stats.fridays },
            { label: "مجموع روزهای تعطیل", value: stats.daysOff },
          ].map((item) => (
            <div
              key={item.label}
              className="rounded-xl bg-slate-50 p-3 dark:bg-slate-800/60"
            >
              <dt className="text-xs text-slate-500 dark:text-slate-400">{item.label}</dt>
              <dd className="mt-1 text-xl font-bold text-slate-900 dark:text-slate-100">
                {fa(item.value)}
              </dd>
            </div>
          ))}
        </dl>

        <p
          data-testid="holiday-source"
          className={`mt-3 rounded-lg px-3 py-2 text-xs ${
            data.verified
              ? "bg-emerald-50 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300"
              : "bg-amber-50 text-amber-800 dark:bg-amber-950/40 dark:text-amber-300"
          }`}
        >
          {data.verified
            ? `تعطیلات مناسبتی ${fa(year)} از تقویم رسمی منتشرشده خوانده شده است.`
            : `برای ${fa(year)} تقویم رسمی را در دست نداریم؛ فقط تعطیلات ثابت (نوروز، ۲۲ بهمن و …) فهرست شده و تعطیلات مذهبی نمایش داده نمی‌شود.`}
        </p>

        <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">
          «مجموع روزهای تعطیل» = تعطیلات رسمی + جمعه‌ها − تعطیلاتی که خودشان جمعه‌اند. در
          ایران فقط جمعه تعطیل هفتگی است.
        </p>
      </section>

      {/* ── upcoming ── */}
      <section className="rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-700 dark:bg-slate-900">
        <h3 className="mb-3 text-base font-bold text-slate-900 dark:text-slate-100">
          نزدیک‌ترین تعطیلات پیش رو
        </h3>
        <ul data-testid="holiday-upcoming" className="space-y-2">
          {upcoming.map((day) => {
            const jdn = jalaliToJdn(day.jy, day.jm, day.jd);
            const diff = jdn - todayJdn;
            return (
              <li
                key={`${day.jy}-${day.jm}-${day.jd}`}
                className="flex flex-wrap items-center justify-between gap-2 rounded-lg bg-slate-50 px-3 py-2 text-sm dark:bg-slate-800/60"
              >
                <span className="font-semibold text-slate-900 dark:text-slate-100">
                  {fa(day.jd)} {JALALI_MONTHS[day.jm - 1]} {fa(day.jy)}
                  <span className="ms-2 font-normal text-slate-500 dark:text-slate-400">
                    {day.weekday}
                  </span>
                </span>
                <span className="text-slate-700 dark:text-slate-300">
                  {day.holiday?.title}
                </span>
                <span className="rounded-full bg-white px-2 py-0.5 text-xs font-semibold text-slate-600 dark:bg-slate-900 dark:text-slate-300">
                  {diff === 0 ? "همین امروز" : `${fa(diff)} روز بعد`}
                </span>
              </li>
            );
          })}
          {upcoming.length === 0 ? (
            <li className="text-sm text-slate-500">تعطیلات بازی در جدول‌ها پیدا نشد.</li>
          ) : null}
        </ul>
      </section>

      {/* ── full list ── */}
      <section className="rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-700 dark:bg-slate-900">
        <h3 className="mb-3 text-base font-bold text-slate-900 dark:text-slate-100">
          فهرست کامل تعطیلات {fa(year)}
        </h3>
        <div className="overflow-x-auto">
          <table data-testid="holiday-table" className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-200 text-start text-xs text-slate-500 dark:border-slate-700 dark:text-slate-400">
                <th className="pb-2 text-start font-medium">تاریخ</th>
                <th className="pb-2 text-start font-medium">روز</th>
                <th className="pb-2 text-start font-medium">مناسبت</th>
                <th className="pb-2 text-start font-medium">نوع</th>
              </tr>
            </thead>
            <tbody>
              {data.holidays.map((h) => {
                const jdn = jalaliToJdn(year, h.jm, h.jd);
                const weekday = weekdayFromJdn(jdn);
                return (
                  <tr
                    key={`${h.jm}/${h.jd}`}
                    className="border-b border-slate-100 last:border-0 dark:border-slate-800"
                  >
                    <td className="py-2 text-slate-900 dark:text-slate-100">
                      {fa(h.jd)} {JALALI_MONTHS[h.jm - 1]}
                    </td>
                    <td className="py-2 text-slate-600 dark:text-slate-400">{weekday}</td>
                    <td className="py-2 text-slate-700 dark:text-slate-300">{h.title}</td>
                    <td className="py-2">
                      <span
                        className={`rounded-full px-2 py-0.5 text-xs ${
                          h.kind === "fixed"
                            ? "bg-sky-100 text-sky-800 dark:bg-sky-950/50 dark:text-sky-300"
                            : "bg-violet-100 text-violet-800 dark:bg-violet-950/50 dark:text-violet-300"
                        }`}
                      >
                        {h.kind === "fixed" ? "ثابت" : "قمری"}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        <p className="mt-3 text-xs text-slate-500 dark:text-slate-400">
          تعطیلات «قمری» هر سال حدود ۱۱ روز جابه‌جا می‌شوند؛ به همین دلیل برای هر سال جدا
          ثبت شده‌اند و هرگز حدس زده نمی‌شوند.
        </p>
      </section>
    </div>
  );
}
