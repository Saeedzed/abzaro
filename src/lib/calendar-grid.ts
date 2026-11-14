/**
 * Month grid for the «تقویم ماهانه» view: a Jalali month laid out as a
 * 7-column table starting on Saturday (شنبه). Pure → unit-tested.
 */

import { jalaliMonthLength, jalaliToJdn, weekdayFromJdn } from "@/lib/jalali";

export const WEEKDAY_HEADERS = ["شنبه", "یکشنبه", "دوشنبه", "سه‌شنبه", "چهارشنبه", "پنجشنبه", "جمعه"];

export interface CalendarCell {
  /** روز شمسی، یا null برای خانهٔ خالی ابتدای ماه. */
  day: number | null;
  /** نام روز هفته (برای خانه‌های پر). */
  weekday: string | null;
  /** جمعه؟ */
  isFriday: boolean;
}

export interface MonthGrid {
  year: number;
  month: number;
  monthLength: number;
  cells: CalendarCell[];
}

/** Saturday-first index (0 = شنبه … 6 = جمعه) for a JDN. */
export function saturdayIndexFromJdn(jdn: number): number {
  const name = weekdayFromJdn(jdn);
  const index = WEEKDAY_HEADERS.indexOf(name);
  if (index >= 0) return index;
  // Defensive fallback: JDN mod 7 — JDN 0 was a Monday.
  return (jdn + 2) % 7;
}

export function buildMonthGrid(year: number, month: number): MonthGrid | null {
  if (!Number.isFinite(year) || !Number.isFinite(month)) return null;
  if (month < 1 || month > 12) return null;

  const monthLength = jalaliMonthLength(year, month);
  const firstJdn = jalaliToJdn(year, month, 1);
  const offset = saturdayIndexFromJdn(firstJdn);

  const cells: CalendarCell[] = [];
  for (let i = 0; i < offset; i += 1) {
    cells.push({ day: null, weekday: null, isFriday: false });
  }
  for (let day = 1; day <= monthLength; day += 1) {
    const index = saturdayIndexFromJdn(firstJdn + day - 1);
    cells.push({
      day,
      weekday: WEEKDAY_HEADERS[index] ?? null,
      isFriday: index === 6,
    });
  }
  // Pad the last week so the table is always a rectangle.
  while (cells.length % 7 !== 0) {
    cells.push({ day: null, weekday: null, isFriday: false });
  }

  return { year, month, monthLength, cells };
}
