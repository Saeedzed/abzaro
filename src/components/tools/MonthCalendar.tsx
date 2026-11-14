"use client";

import { useEffect, useMemo, useState } from "react";
import { CalendarDays, ChevronLeft, ChevronRight } from "lucide-react";
import { buildMonthGrid, WEEKDAY_HEADERS } from "@/lib/calendar-grid";
import { JALALI_MONTHS, todayJalali } from "@/lib/jalali";
import { toPersianDigits } from "@/lib/persian";
import { ToolPanel } from "./shared";
import { cn } from "@/lib/utils";

/**
 * تقویم ماهانهٔ شمسی — نمای کامل ماه با تعطیلی جمعه‌ها و امروزِ برجسته.
 * مکمل ابزار «تبدیل تاریخ» است.
 */
export function MonthCalendar() {
  // The server renders in its own timezone, so «today» is applied only after
  // mount — otherwise the prerendered HTML and the first client render differ
  // (React hydration error #418).
  const [today, setToday] = useState(() => todayJalali());
  const [start, setStart] = useState<{ year: number; month: number } | null>(null);

  useEffect(() => {
    const now = todayJalali();
    setToday(now);
    setStart({ year: now.jy, month: now.jm });
  }, []);

  if (!start) {
    return (
      <div className="rounded-2xl border border-ink-200 bg-white p-10 text-center text-sm text-ink-400 shadow-card">
        در حال آماده‌سازی تقویم…
      </div>
    );
  }

  return <CalendarBody today={today} initialYear={start.year} initialMonth={start.month} />;
}

/** The real calendar — rendered only after «today» is known on the client. */
function CalendarBody({
  today,
  initialYear,
  initialMonth,
}: {
  today: { jy: number; jm: number; jd: number };
  initialYear: number;
  initialMonth: number;
}) {
  const [year, setYear] = useState(initialYear);
  const [month, setMonth] = useState(initialMonth);

  const grid = useMemo(() => buildMonthGrid(year, month), [year, month]);
  const isCurrentMonth = year === today.jy && month === today.jm;

  function shift(delta: number) {
    let nextMonth = month + delta;
    let nextYear = year;
    if (nextMonth < 1) {
      nextMonth = 12;
      nextYear -= 1;
    } else if (nextMonth > 12) {
      nextMonth = 1;
      nextYear += 1;
    }
    setMonth(nextMonth);
    setYear(nextYear);
  }

  const monthName = JALALI_MONTHS[month - 1] ?? "";

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-ink-200 bg-white p-3 shadow-card">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => shift(-1)}
            aria-label="ماه قبل"
            data-testid="calendar-prev"
            className="flex h-9 w-9 items-center justify-center rounded-lg border border-ink-200 text-ink-600 transition hover:bg-ink-100"
          >
            <ChevronRight className="h-4 w-4" aria-hidden="true" />
          </button>
          <div className="min-w-32 text-center">
            <div className="flex items-center justify-center gap-1.5 text-base font-extrabold text-ink-900">
              <CalendarDays className="h-4 w-4 text-brand-600" aria-hidden="true" />
              <span data-testid="calendar-title">
                {monthName} {toPersianDigits(year)}
              </span>
            </div>
          </div>
          <button
            type="button"
            onClick={() => shift(1)}
            aria-label="ماه بعد"
            data-testid="calendar-next"
            className="flex h-9 w-9 items-center justify-center rounded-lg border border-ink-200 text-ink-600 transition hover:bg-ink-100"
          >
            <ChevronLeft className="h-4 w-4" aria-hidden="true" />
          </button>
        </div>

        <div className="flex items-center gap-2">
          <select
            value={month}
            onChange={(event) => setMonth(Number(event.target.value))}
            aria-label="ماه"
            className="rounded-lg border border-ink-200 px-2 py-1.5 text-xs outline-none focus:border-brand-400"
          >
            {JALALI_MONTHS.map((name, index) => (
              <option key={name} value={index + 1}>
                {name}
              </option>
            ))}
          </select>
          <input
            type="number"
            value={year}
            onChange={(event) => setYear(Number(event.target.value) || today.jy)}
            aria-label="سال"
            data-testid="calendar-year"
            className="w-20 rounded-lg border border-ink-200 px-2 py-1.5 text-xs outline-none focus:border-brand-400"
          />
          <button
            type="button"
            onClick={() => {
              setYear(today.jy);
              setMonth(today.jm);
            }}
            className="rounded-lg bg-brand-50 px-3 py-1.5 text-[11px] font-bold text-brand-700 transition hover:bg-brand-100"
          >
            امروز
          </button>
        </div>
      </div>

      <ToolPanel
        title={`تقویم ${monthName} ${toPersianDigits(year)}`}
        description={
          grid
            ? `${toPersianDigits(grid.monthLength)} روز${isCurrentMonth ? " · ماه جاری" : ""}`
            : undefined
        }
      >
        {grid ? (
          <div className="overflow-hidden rounded-xl border border-ink-200">
            <div className="grid grid-cols-7 bg-brand-600 text-center text-[11px] font-bold text-white">
              {WEEKDAY_HEADERS.map((day) => (
                <div key={day} className="px-1 py-2">
                  {day}
                </div>
              ))}
            </div>
            <div className="grid grid-cols-7" data-testid="calendar-grid">
              {grid.cells.map((cell, index) => {
                const isToday = isCurrentMonth && cell.day === today.jd;
                return (
                  <div
                    key={index}
                    className={cn(
                      "flex h-12 flex-col items-center justify-center border-b border-l border-ink-100 text-sm sm:h-14",
                      cell.day === null && "bg-ink-50/40",
                      cell.isFriday && cell.day !== null && "text-rose-600",
                      isToday && "bg-brand-50 font-extrabold text-brand-800 ring-2 ring-inset ring-brand-500",
                    )}
                  >
                    {cell.day !== null && toPersianDigits(cell.day)}
                  </div>
                );
              })}
            </div>
          </div>
        ) : (
          <p className="rounded-xl border border-dashed border-ink-200 bg-ink-50/60 px-4 py-6 text-center text-sm text-ink-400">
            سال و ماه معتبر وارد کنید.
          </p>
        )}

        <p className="mt-3 text-[11px] leading-6 text-ink-400">
          هفته از شنبه شروع می‌شود. جمعه‌ها با رنگ قرمز و امروز با پس‌زمینهٔ آبی
          مشخص شده‌اند.
        </p>
      </ToolPanel>
    </div>
  );
}
