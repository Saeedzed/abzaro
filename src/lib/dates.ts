/**
 * Date arithmetic between two Jalali dates (اختلاف دو تاریخ) plus a few
 * calendar helpers used by the "دقیق" age tool.
 *
 * Pure functions — unit-tested in date-diff.test.ts.
 */

import {
  jdnToJalali,
  jalaliMonthLength,
  jalaliToJdn,
  isValidJalaliDate,
  weekdayFromJdn,
} from "./jalali";

export interface Ymd {
  y: number;
  m: number;
  d: number;
}

export interface DateDifference {
  /** Signed difference in whole days (b − a). */
  totalDays: number;
  /** Absolute difference in days. */
  absDays: number;
  /** Whole years / months / days between the two dates. */
  years: number;
  months: number;
  days: number;
  /** Total weeks (and the leftover days). */
  weeks: number;
  leftoverDays: number;
  totalHours: number;
  totalMinutes: number;
  totalSeconds: number;
  /** Which date came first. */
  direction: "same" | "later" | "earlier";
  /** Weekday of each date (Persian name). */
  weekdayA: string;
  weekdayB: string;
  /** True when the date is a leap day (30 Esfand of a leap year). */
  leapA: boolean;
  leapB: boolean;
}

export function toJdn(date: Ymd): number {
  return jalaliToJdn(date.y, date.m, date.d);
}

/** Whole years/months/days between two JDN values, order-independent. */
export function ymdDifference(
  a: Ymd,
  b: Ymd,
): { years: number; months: number; days: number } {
  const [start, end] = toJdn(a) <= toJdn(b) ? [a, b] : [b, a];
  let years = end.y - start.y;
  let months = end.m - start.m;
  let days = end.d - start.d;

  if (days < 0) {
    months -= 1;
    const prevMonth = end.m === 1 ? 12 : end.m - 1;
    const prevYear = end.m === 1 ? end.y - 1 : end.y;
    days += jalaliMonthLength(prevYear, prevMonth);
  }
  if (months < 0) {
    years -= 1;
    months += 12;
  }
  return { years, months, days };
}

/** Full comparison between two Jalali dates. Returns null if either is invalid. */
export function diffDates(a: Ymd, b: Ymd): DateDifference | null {
  if (!isValidJalaliDate(a.y, a.m, a.d)) return null;
  if (!isValidJalaliDate(b.y, b.m, b.d)) return null;

  const jdnA = toJdn(a);
  const jdnB = toJdn(b);
  const signed = jdnB - jdnA;
  const absDays = Math.abs(signed);
  const { years, months, days } = ymdDifference(a, b);

  return {
    totalDays: signed,
    absDays,
    years,
    months,
    days,
    weeks: Math.floor(absDays / 7),
    leftoverDays: absDays % 7,
    totalHours: absDays * 24,
    totalMinutes: absDays * 24 * 60,
    totalSeconds: absDays * 24 * 60 * 60,
    direction: signed === 0 ? "same" : signed > 0 ? "later" : "earlier",
    weekdayA: weekdayFromJdn(jdnA),
    weekdayB: weekdayFromJdn(jdnB),
    leapA: isLeapDay(a),
    leapB: isLeapDay(b),
  };
}

/** Is this 30 Esfand of a leap year? */
export function isLeapDay(date: Ymd): boolean {
  if (!isValidJalaliDate(date.y, date.m, date.d)) return false;
  return date.m === 12 && date.d === 30;
}

/** Weekday name for a Jalali date. */
export function weekdayOf(date: Ymd): string {
  return weekdayFromJdn(toJdn(date));
}

/** Add (or subtract) whole days to a Jalali date. */
export function addDays(date: Ymd, days: number): Ymd {
  const result = jdnToJalali(toJdn(date) + Math.trunc(days));
  return { y: result.jy, m: result.jm, d: result.jd };
}

export interface DateParts {
  /** 12-hour clock hour (1–12). */
  hour12: number;
  minute: number;
  /** «ق.ظ» or «ب.ظ». */
  meridiem: "ق.ظ" | "ب.ظ";
  hour24: number;
}

/** Split a 24-hour clock time into Persian-friendly parts. */
export function splitClock(hour24: number, minute: number): DateParts {
  const h = ((Math.trunc(hour24) % 24) + 24) % 24;
  const m = ((Math.trunc(minute) % 60) + 60) % 60;
  const isPm = h >= 12;
  const hour12 = h % 12 === 0 ? 12 : h % 12;
  return { hour12, minute: m, meridiem: isPm ? "ب.ظ" : "ق.ظ", hour24: h };
}

/**
 * Exact age down to the minute between a birth date/time and a reference
 * date/time, both interpreted in the visitor's local clock.
 */
export interface ExactAge {
  years: number;
  months: number;
  days: number;
  hours: number;
  minutes: number;
  totalDays: number;
  totalWeeks: number;
  totalHours: number;
  totalMinutes: number;
  nextBirthdayInDays: number;
  weekday: string;
  /** Zodiac sign in Persian, following the Jalali month boundaries. */
  sign: string;
}

/**
 * Persian zodiac signs start on the first day of each Jalali month, because
 * the Jalali calendar is solar (Nowruz = 1 Farvardin = start of حمل).
 */
const PERSIAN_SIGNS = [
  "حمل", "ثور", "جوزا", "سرطان", "اسد", "سنبله",
  "میزان", "عقرب", "قوس", "جدی", "دلو", "حوت",
] as const;

/** Persian zodiac sign (برج فلکی) for a Jalali birth date. */
export function zodiacSign(date: Ymd): string {
  return PERSIAN_SIGNS[Math.min(11, Math.max(0, date.m - 1))] ?? "حمل";
}

export function exactAge(
  birth: { date: Ymd; hour: number; minute: number },
  now: { date: Ymd; hour: number; minute: number },
): ExactAge | null {
  if (!isValidJalaliDate(birth.date.y, birth.date.m, birth.date.d)) return null;
  if (!isValidJalaliDate(now.date.y, now.date.m, now.date.d)) return null;

  const birthMinutes =
    toJdn(birth.date) * 1440 + birth.hour * 60 + birth.minute;
  const nowMinutes = toJdn(now.date) * 1440 + now.hour * 60 + now.minute;
  if (nowMinutes < birthMinutes) return null;

  const totalMinutes = nowMinutes - birthMinutes;
  const totalDays = Math.floor(totalMinutes / 1440);
  const leftoverMinutes = totalMinutes % 1440;

  const { years, months, days } = ymdDifference(birth.date, now.date);

  // Next birthday: same month/day in the current or next Jalali year.
  const thisYear = Math.min(
    birth.date.d,
    jalaliMonthLength(now.date.y, birth.date.m),
  );
  const candidateThisYear = jalaliToJdn(now.date.y, birth.date.m, thisYear);
  const candidateNextYear = jalaliToJdn(
    now.date.y + 1,
    birth.date.m,
    Math.min(birth.date.d, jalaliMonthLength(now.date.y + 1, birth.date.m)),
  );
  const todayJdn = toJdn(now.date);
  const nextBirthdayInDays =
    candidateThisYear >= todayJdn
      ? candidateThisYear - todayJdn
      : candidateNextYear - todayJdn;

  return {
    years,
    months,
    days,
    hours: Math.floor(leftoverMinutes / 60),
    minutes: leftoverMinutes % 60,
    totalDays,
    totalWeeks: Math.floor(totalDays / 7),
    totalHours: totalMinutes / 60,
    totalMinutes,
    nextBirthdayInDays,
    weekday: weekdayOf(birth.date),
    sign: zodiacSign(birth.date),
  };
}

/** Parse a "YYYY-MM-DD" input into a Jalali Ymd (year may be Persian digits). */
export function parseIsoJalali(value: string): Ymd | null {
  const normalized = value
    .trim()
    .replace(/[۰-۹]/g, (d) => String("۰۱۲۳۴۵۶۷۸۹".indexOf(d)))
    .replace(/[٠-٩]/g, (d) => String("٠١٢٣٤٥٦٧٨٩".indexOf(d)));
  const match = /^(\d{4})-(\d{1,2})-(\d{1,2})$/.exec(normalized);
  if (!match) return null;
  const [, y, m, d] = match;
  const date = { y: Number(y), m: Number(m), d: Number(d) };
  return isValidJalaliDate(date.y, date.m, date.d) ? date : null;
}
