/**
 * Official Iranian public holidays + weekday helpers.
 *
 * Every date below was cross-checked against at least two published calendars
 * (parsine, khabaronline, bahesab, pishkhanak, digipostal). Where the sources
 * disagreed the date is recorded with a note rather than silently picked.
 *
 * Two kinds of holidays:
 *   fixed   — a Gregorian/Jalali solar date that never moves (نوروز، ۲۲ بهمن …)
 *   lunar   — follows the Hijri calendar and slides ~11 days earlier each year,
 *             so it must be tabulated per Jalali year (عید فطر، عاشورا …)
 *
 * The tool never guesses a lunar date: years without a table report
 * `verified: false` and the UI says so.
 */

import {
  isJalaliLeapYear,
  jalaliToJdn,
  jdnToJalali,
  WEEKDAYS,
  weekdayIndexOfJdn,
  type JalaliDate,
} from "@/lib/jalali";

export interface Holiday {
  /** Stable id, used when the same day carries more than one occasion. */
  id?: string;
  /** Jalali month (1–12). */
  jm: number;
  /** Jalali day. */
  jd: number;
  /** Name as printed in official calendars. */
  title: string;
  kind: "fixed" | "lunar";
}

export interface HolidayYear {
  year: number;
  /** true only when a published calendar was read for *this* year. */
  verified: boolean;
  /** Where the lunar portion came from — shown in the UI for transparency. */
  source?: string;
  holidays: Holiday[];
}

/**
 * Solar (fixed) holidays. These repeat every year on the same Jalali date.
 * Note ۱–۴ فروردین are the Nowruz break; ۱۲ و ۱۳ فروردین are separate.
 */
const FIXED: Holiday[] = [
  { jm: 1, jd: 1, title: "جشن نوروز", kind: "fixed" },
  { jm: 1, jd: 2, title: "عید نوروز", kind: "fixed" },
  { jm: 1, jd: 3, title: "عید نوروز", kind: "fixed" },
  { jm: 1, jd: 4, title: "عید نوروز", kind: "fixed" },
  { jm: 1, jd: 12, title: "روز جمهوری اسلامی ایران", kind: "fixed" },
  { jm: 1, jd: 13, title: "روز طبیعت (سیزده‌بدر)", kind: "fixed" },
  { jm: 3, jd: 14, title: "رحلت حضرت امام خمینی (ره)", kind: "fixed" },
  { jm: 3, jd: 15, title: "قیام ۱۵ خرداد", kind: "fixed" },
  { jm: 11, jd: 22, title: "پیروزی انقلاب اسلامی ایران", kind: "fixed" },
  { jm: 12, jd: 29, title: "روز ملی شدن صنعت نفت ایران", kind: "fixed" },
];

/** Lunar holidays as printed in the official calendar of each year. */
const LUNAR: Record<number, Holiday[]> = {
  1404: [
    { jm: 1, jd: 11, title: "عید سعید فطر", kind: "lunar" },
    { jm: 1, jd: 12, title: "تعطیل به مناسبت عید سعید فطر", kind: "lunar" },
    { jm: 2, jd: 4, title: "شهادت امام جعفر صادق (ع)", kind: "lunar" },
    { jm: 3, jd: 16, title: "عید سعید قربان", kind: "lunar" },
    { jm: 3, jd: 24, title: "عید سعید غدیر خم", kind: "lunar" },
    { jm: 4, jd: 14, title: "تاسوعای حسینی", kind: "lunar" },
    { jm: 4, jd: 15, title: "عاشورای حسینی", kind: "lunar" },
    { jm: 5, jd: 23, title: "اربعین حسینی", kind: "lunar" },
    { jm: 5, jd: 31, title: "رحلت رسول اکرم (ص) و شهادت امام حسن مجتبی (ع)", kind: "lunar" },
    { jm: 6, jd: 2, title: "شهادت امام رضا (ع)", kind: "lunar" },
    { jm: 6, jd: 10, title: "شهادت امام حسن عسکری (ع)", kind: "lunar" },
    { jm: 6, jd: 19, title: "ولادت رسول اکرم (ص) و امام جعفر صادق (ع)", kind: "lunar" },
    { jm: 9, jd: 3, title: "شهادت حضرت فاطمه زهرا (س)", kind: "lunar" },
    { jm: 10, jd: 13, title: "ولادت امام علی (ع) و روز پدر", kind: "lunar" },
    { jm: 10, jd: 27, title: "مبعث رسول اکرم (ص)", kind: "lunar" },
    { jm: 11, jd: 15, title: "ولادت حضرت قائم (عج) و جشن نیمهٔ شعبان", kind: "lunar" },
    { jm: 12, jd: 20, title: "شهادت حضرت علی (ع)", kind: "lunar" },
  ],
  1405: [
    { jm: 1, jd: 1, title: "عید سعید فطر", kind: "lunar" },
    { jm: 1, jd: 2, title: "تعطیل به مناسبت عید سعید فطر", kind: "lunar" },
    { jm: 1, jd: 25, title: "شهادت امام جعفر صادق (ع)", kind: "lunar" },
    { jm: 3, jd: 6, title: "عید سعید قربان", kind: "lunar" },
    { jm: 3, jd: 14, title: "عید سعید غدیر خم", kind: "lunar" },
    { jm: 4, jd: 3, title: "تاسوعای حسینی", kind: "lunar" },
    { jm: 4, jd: 4, title: "عاشورای حسینی", kind: "lunar" },
    { jm: 5, jd: 13, title: "اربعین حسینی", kind: "lunar" },
    { jm: 5, jd: 21, title: "رحلت رسول اکرم (ص) و شهادت امام حسن مجتبی (ع)", kind: "lunar" },
    { jm: 5, jd: 22, title: "شهادت امام رضا (ع)", kind: "lunar" },
    { jm: 5, jd: 30, title: "شهادت امام حسن عسکری (ع)", kind: "lunar" },
    { jm: 6, jd: 8, title: "ولادت رسول اکرم (ص) و امام جعفر صادق (ع)", kind: "lunar" },
    { jm: 8, jd: 22, title: "شهادت حضرت فاطمه زهرا (س)", kind: "lunar" },
    { jm: 10, jd: 2, title: "ولادت امام علی (ع) و روز پدر", kind: "lunar" },
    { jm: 10, jd: 16, title: "مبعث رسول اکرم (ص)", kind: "lunar" },
    { jm: 11, jd: 4, title: "ولادت حضرت قائم (عج) و جشن نیمهٔ شعبان", kind: "lunar" },
    { jm: 12, jd: 9, title: "شهادت حضرت علی (ع)", kind: "lunar" },
    { jm: 12, jd: 19, title: "عید سعید فطر", kind: "lunar" },
    { jm: 12, jd: 20, title: "تعطیل به مناسبت عید سعید فطر", kind: "lunar" },
  ],
};

/** Years for which a full official calendar is tabulated. */
export const HOLIDAY_YEARS: readonly number[] = [1404, 1405];

/**
 * All holidays of a Jalali year, sorted by date. For a year without a lunar
 * table only the fixed holidays are returned and `verified` is false — the UI
 * must not present that as a complete list.
 */
export function getHolidays(year: number): HolidayYear {
  const lunar = LUNAR[year];
  // One calendar day can carry two occasions (e.g. ۱ فروردین ۱۴۰۵ is both
  // Nowruz and Eid-e-Fetr). Merge them so a day is never listed twice.
  const merged = new Map<string, Holiday>();
  for (const h of [...FIXED, ...(lunar ?? [])]) {
    const key = `${h.jm}/${h.jd}`;
    const existing = merged.get(key);
    if (existing) {
      if (!existing.title.includes(h.title)) {
        existing.title = `${existing.title} + ${h.title}`;
      }
      existing.kind = existing.kind === h.kind ? existing.kind : "lunar";
    } else {
      merged.set(key, { ...h, id: key });
    }
  }
  const holidays = [...merged.values()].sort((a, b) => a.jm - b.jm || a.jd - b.jd);
  return {
    year,
    verified: lunar !== undefined,
    source: lunar ? "تقویم رسمی منتشرشده (پارسی‌نیوز/خبرآنلاین/به‌حساب)" : undefined,
    holidays,
  };
}

/** The holiday falling on an exact Jalali date, or undefined. */
export function holidayOn(year: number, jm: number, jd: number): Holiday | undefined {
  return getHolidays(year).holidays.find((h) => h.jm === jm && h.jd === jd);
}

/** Weekday index: 0 = شنبه … 6 = جمعه. */
export function weekdayIndex(jy: number, jm: number, jd: number): number {
  return weekdayIndexOfJdn(jalaliToJdn(jy, jm, jd));
}

/** Persian weekday name for a Jalali date. */
export function weekdayName(jy: number, jm: number, jd: number): string {
  return WEEKDAYS[weekdayIndex(jy, jm, jd)] ?? "";
}

/** Friday is the weekly holiday in Iran. */
export function isFriday(jy: number, jm: number, jd: number): boolean {
  return weekdayIndex(jy, jm, jd) === 6;
}

export interface DayInfo {
  jy: number;
  jm: number;
  jd: number;
  weekday: string;
  /** Official holiday (fixed or lunar). */
  holiday?: Holiday;
  /** Friday — the weekly day off, not an "occasion". */
  friday: boolean;
  /** holiday || friday — the day you actually don't work. */
  dayOff: boolean;
}

export function describeDate(jy: number, jm: number, jd: number): DayInfo {
  const holiday = holidayOn(jy, jm, jd);
  const friday = isFriday(jy, jm, jd);
  return {
    jy,
    jm,
    jd,
    weekday: weekdayName(jy, jm, jd),
    holiday,
    friday,
    dayOff: holiday !== undefined || friday,
  };
}

export interface HolidayStat {
  year: number;
  verified: boolean;
  /** Number of officially named holidays. */
  total: number;
  /** How many of them already fall on a Friday (so add no extra day off). */
  onFriday: number;
  /** Distinct days off = holidays + Fridays that are not holidays. */
  daysOff: number;
  fridays: number;
}

/** Counting facts for a year — all computed, none hard-coded. */
export function holidayStats(year: number): HolidayStat {
  const { holidays, verified } = getHolidays(year);
  const jdns = new Set(holidays.map((h) => jalaliToJdn(year, h.jm, h.jd)));
  const onFriday = holidays.filter((h) => isFriday(year, h.jm, h.jd)).length;

  // Count Fridays in the year from 1/1 to 12/29 or 12/30.
  const startJdn = jalaliToJdn(year, 1, 1);
  const endJdn = jalaliToJdn(year, 12, isJalaliLeapYear(year) ? 30 : 29);
  let fridays = 0;
  for (let j = startJdn; j <= endJdn; j += 1) {
    if (weekdayIndexOfJdn(j) === 6) fridays += 1;
  }

  return {
    year,
    verified,
    total: holidays.length,
    onFriday,
    daysOff: jdns.size + (fridays - onFriday),
    fridays,
  };
}

/**
 * Working-day arithmetic: add `days` working days to a date, skipping Fridays
 * and official holidays. `days` may be negative.
 */
export function addWorkingDays(
  jy: number,
  jm: number,
  jd: number,
  days: number,
): { jy: number; jm: number; jd: number; skipped: string[] } {
  const step = days >= 0 ? 1 : -1;
  let remaining = Math.abs(days);
  let jdn = jalaliToJdn(jy, jm, jd);
  const skipped: string[] = [];
  while (remaining > 0) {
    jdn += step;
    const d: JalaliDate = jdnToJalali(jdn);
    const info = describeDate(d.jy, d.jm, d.jd);
    if (info.dayOff) {
      if (skipped.length < 40) {
        skipped.push(`${d.jy}/${d.jm}/${d.jd} — ${info.holiday?.title ?? "جمعه"}`);
      }
      continue;
    }
    remaining -= 1;
  }
  const end = jdnToJalali(jdn);
  return { jy: end.jy, jm: end.jm, jd: end.jd, skipped };
}

/** Next upcoming holidays from a given date (inclusive), across year tables. */
export function upcomingHolidays(
  jy: number,
  jm: number,
  jd: number,
  limit = 5,
): DayInfo[] {
  const from = jalaliToJdn(jy, jm, jd);
  const out: DayInfo[] = [];
  for (const year of HOLIDAY_YEARS) {
    for (const h of getHolidays(year).holidays) {
      const jdn = jalaliToJdn(year, h.jm, h.jd);
      if (jdn >= from) out.push({ ...describeDate(year, h.jm, h.jd) });
    }
  }
  out.sort((a, b) => jalaliToJdn(a.jy, a.jm, a.jd) - jalaliToJdn(b.jy, b.jm, b.jd));
  return out.slice(0, limit);
}

/** Days from one date to another (positive when `to` is later). */
export function daysBetween(fromJdn: number, toJdn: number): number {
  return toJdn - fromJdn;
}
