/**
 * Jalali ↔ Gregorian date conversion for the date-converter tool.
 *
 * Thin, typed wrappers around the arithmetic already tested in `jalali.ts`
 * (no new calendar implementation — one source of truth), plus the derived
 * facts a user expects to see: weekday, day-of-year, ISO week, and whether the
 * Jalali year is a leap year.
 */

import {
  JALALI_MONTHS,
  WEEKDAYS,
  gregorianToJalali,
  isJalaliLeapYear,
  jalaliMonthLength,
  jalaliToGregorian,
  jalaliToJdn,
  weekdayFromJdn,
} from "@/lib/jalali";

const GREGORIAN_MONTHS = [
  "ژانویه",
  "فوریه",
  "مارس",
  "آوریل",
  "مه",
  "ژوئن",
  "ژوئیه",
  "اوت",
  "سپتامبر",
  "اکتبر",
  "نوامبر",
  "دسامبر",
];

export { JALALI_MONTHS, GREGORIAN_MONTHS };

export interface DateFacts {
  jalali: { year: number; month: number; day: number };
  gregorian: { year: number; month: number; day: number };
  weekday: string;
  /** Persian text, e.g. «۱۴ آبان ۱۴۰۵». */
  jalaliLabel: string;
  /** Persian text, e.g. «۵ نوامبر ۲۰۲۶». */
  gregorianLabel: string;
  /** «چهارشنبه ۱۴ آبان ۱۴۰۵». */
  fullLabel: string;
  /** ISO date (Gregorian), e.g. 2026-11-05 — handy for `<time datetime>`. */
  iso: string;
  dayOfYearJalali: number;
  daysInJalaliMonth: number;
  daysInJalaliYear: number;
  isJalaliLeap: boolean;
}

/** Persian digits, no grouping. */
function fa(value: number): string {
  const digits = ["۰", "۱", "۲", "۳", "۴", "۵", "۶", "۷", "۸", "۹"];
  return String(value).replace(/[0-9]/g, (d) => digits[Number(d)] ?? d);
}

function pad(value: number): string {
  return String(value).padStart(2, "0");
}

/** Build every derived fact from a pair of calendars (single JDN source). */
function factsFromJdn(
  jalali: { year: number; month: number; day: number },
  gregorian: { year: number; month: number; day: number },
  jdn: number,
): DateFacts {
  const weekday = weekdayFromJdn(jdn);
  const jalaliLabel = `${fa(jalali.day)} ${JALALI_MONTHS[jalali.month - 1] ?? ""} ${fa(jalali.year)}`;
  const gregorianLabel = `${fa(gregorian.day)} ${GREGORIAN_MONTHS[gregorian.month - 1] ?? ""} ${fa(gregorian.year)}`;


  let dayOfYearJalali = jalali.day;
  for (let month = 1; month < jalali.month; month += 1) {
    dayOfYearJalali += jalaliMonthLength(jalali.year, month);
  }

  return {
    jalali,
    gregorian,
    weekday,
    jalaliLabel,
    gregorianLabel,
    fullLabel: `${weekday} ${jalaliLabel}`,
    iso: `${gregorian.year}-${pad(gregorian.month)}-${pad(gregorian.day)}`,
    dayOfYearJalali,
    daysInJalaliMonth: jalaliMonthLength(jalali.year, jalali.month),
    daysInJalaliYear: isJalaliLeapYear(jalali.year) ? 366 : 365,
    isJalaliLeap: isJalaliLeapYear(jalali.year),
  };
}

/** Convert a Jalali date to every derived fact. Returns null if out of range. */
export function fromJalali(year: number, month: number, day: number): DateFacts | null {
  if (!Number.isInteger(year) || !Number.isInteger(month) || !Number.isInteger(day)) return null;
  if (month < 1 || month > 12 || day < 1) return null;
  if (day > jalaliMonthLength(year, month)) return null;
  if (year < 1200 || year > 1600) return null;

  const jdn = jalaliToJdn(year, month, day);
  const g = jalaliToGregorian(year, month, day);
  const gregorian = { year: g.gy, month: g.gm, day: g.gd };
  return factsFromJdn({ year, month, day }, gregorian, jdn);
}

/** Convert a Gregorian date to every derived fact. Returns null if invalid. */
export function fromGregorian(year: number, month: number, day: number): DateFacts | null {
  if (!Number.isInteger(year) || !Number.isInteger(month) || !Number.isInteger(day)) return null;
  if (month < 1 || month > 12 || day < 1 || day > 31) return null;

  const probe = new Date(Date.UTC(year, month - 1, day));
  if (
    probe.getUTCFullYear() !== year ||
    probe.getUTCMonth() !== month - 1 ||
    probe.getUTCDate() !== day
  ) {
    return null; // e.g. 31 February
  }

  const j = gregorianToJalali(year, month, day);
  if (j.jy < 1200 || j.jy > 1600) return null;

  const jalali = { year: j.jy, month: j.jm, day: j.jd };
  const jdn = jalaliToJdn(jalali.year, jalali.month, jalali.day);
  return factsFromJdn(jalali, { year, month, day }, jdn);
}

/** Today, in both calendars (used to prefill the form). */
export function todayFacts(): DateFacts {
  const now = new Date();
  const facts = fromGregorian(now.getFullYear(), now.getMonth() + 1, now.getDate());
  if (facts) return facts;
  // Unreachable in practice; keeps the return type honest.
  const fallback = fromJalali(1404, 1, 1);
  if (!fallback) throw new Error("calendar init failed");
  return fallback;
}

export { WEEKDAYS };
