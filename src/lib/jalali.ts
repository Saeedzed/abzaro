/**
 * Jalali (Solar Hijri) ↔ Gregorian conversion and age maths.
 *
 * Pure functions, no dependencies. The conversion algorithm follows the
 * well-known jalaali-js approach (based on the official leap-year breaks table),
 * which is accurate for the years this app exposes (roughly 1178–3177 Jalali).
 */

function div(a: number, b: number): number {
  return Math.trunc(a / b);
}

function mod(a: number, b: number): number {
  return a - Math.trunc(a / b) * b;
}

/** Start years of each 33-year cycle group, per the official table. */
const BREAKS: readonly number[] = [
  -61, 9, 38, 199, 426, 686, 756, 818, 1111, 1181, 1210, 1635, 2060, 2097, 2192,
  2262, 2324, 2394, 2456, 3178,
];

export const MIN_JALALI_YEAR = 1200;
export const MAX_JALALI_YEAR = 1600;

interface JalCal {
  leap: number;
  gy: number;
  march: number;
}

function jalCal(jy: number, withoutLeap = false): JalCal {
  const bl = BREAKS.length;
  const gy = jy + 621;
  let leapJ = -14;
  let jp = BREAKS[0] ?? 0;
  let jump = 0;
  let leap = 0;

  for (let i = 1; i < bl; i++) {
    const jm = BREAKS[i] ?? 0;
    jump = jm - jp;
    if (jy < jm) break;
    leapJ = leapJ + div(jump, 33) * 8 + div(mod(jump, 33), 4);
    jp = jm;
  }

  let n = jy - jp;
  leapJ = leapJ + div(n, 33) * 8 + div(mod(n, 33) + 3, 4);
  if (mod(jump, 33) === 4 && jump - n === 4) leapJ += 1;

  const leapG = div(gy, 4) - div((div(gy, 100) + 1) * 3, 4) - 150;
  const march = 20 + leapJ - leapG;

  if (!withoutLeap) {
    if (jump - n < 6) n = n - jump + div(jump + 4, 33) * 33;
    leap = mod(mod(n + 1, 33) - 1, 4);
    if (leap === -1) leap = 4;
  }

  return { leap, gy, march };
}

/** Gregorian date → Julian Day Number. */
export function gregorianToJdn(gy: number, gm: number, gd: number): number {
  let d =
    div((gy + div(gm - 8, 6) + 100100) * 1461, 4) +
    div(153 * mod(gm + 9, 12) + 2, 5) +
    gd -
    34840408;
  d = d - div(div(gy + 100100 + div(gm - 8, 6), 100) * 3, 4) + 752;
  return d;
}

/** Julian Day Number → Gregorian date. */
export function jdnToGregorian(jdn: number): { gy: number; gm: number; gd: number } {
  let j = 4 * jdn + 139361631;
  j = j + div(div(4 * jdn + 183187720, 146097) * 3, 4) * 4 - 3908;
  const i = div(mod(j, 1461), 4) * 5 + 308;
  const gd = div(mod(i, 153), 5) + 1;
  const gm = mod(div(i, 153), 12) + 1;
  const gy = div(j, 1461) - 100100 + div(8 - gm, 6);
  return { gy, gm, gd };
}

/** Jalali date → Julian Day Number. */
export function jalaliToJdn(jy: number, jm: number, jd: number): number {
  const r = jalCal(jy, true);
  return (
    gregorianToJdn(r.gy, 3, r.march) + (jm - 1) * 31 - div(jm, 7) * (jm - 7) + jd - 1
  );
}

export interface JalaliDate {
  jy: number;
  jm: number;
  jd: number;
}

/** Julian Day Number → Jalali date. */
export function jdnToJalali(jdn: number): JalaliDate {
  const gy = jdnToGregorian(jdn).gy;
  let jy = gy - 621;
  const r = jalCal(jy, false);
  const jdn1f = gregorianToJdn(gy, 3, r.march);
  let k = jdn - jdn1f;

  if (k >= 0) {
    if (k <= 185) {
      return { jy, jm: 1 + div(k, 31), jd: mod(k, 31) + 1 };
    }
    k -= 186;
  } else {
    jy -= 1;
    k += 179;
    if (r.leap === 1) k += 1;
  }

  return { jy, jm: 7 + div(k, 30), jd: mod(k, 30) + 1 };
}

/** Is the given Jalali year a leap year (30-day Esfand)? */
export function isJalaliLeapYear(jy: number): boolean {
  return jalCal(jy).leap === 0;
}

/** Number of days in a Jalali month. */
export function jalaliMonthLength(jy: number, jm: number): number {
  if (jm <= 6) return 31;
  if (jm <= 11) return 30;
  return isJalaliLeapYear(jy) ? 30 : 29;
}

export function isValidJalaliDate(jy: number, jm: number, jd: number): boolean {
  if (!Number.isInteger(jy) || !Number.isInteger(jm) || !Number.isInteger(jd)) return false;
  if (jy < MIN_JALALI_YEAR || jy > MAX_JALALI_YEAR) return false;
  if (jm < 1 || jm > 12) return false;
  if (jd < 1) return false;
  return jd <= jalaliMonthLength(jy, jm);
}

/** Jalali date → Gregorian date. */
export function jalaliToGregorian(jy: number, jm: number, jd: number): {
  gy: number;
  gm: number;
  gd: number;
} {
  return jdnToGregorian(jalaliToJdn(jy, jm, jd));
}

/** Gregorian date → Jalali date. */
export function gregorianToJalali(gy: number, gm: number, gd: number): JalaliDate {
  return jdnToJalali(gregorianToJdn(gy, gm, gd));
}

/** Today's date as a Jalali date, based on the visitor's local clock. */
export function todayJalali(): JalaliDate {
  const now = new Date();
  return gregorianToJalali(now.getFullYear(), now.getMonth() + 1, now.getDate());
}

export const JALALI_MONTHS = [
  "فروردین",
  "اردیبهشت",
  "خرداد",
  "تیر",
  "مرداد",
  "شهریور",
  "مهر",
  "آبان",
  "آذر",
  "دی",
  "بهمن",
  "اسفند",
] as const;

export const WEEKDAYS = [
  "شنبه",
  "یکشنبه",
  "دوشنبه",
  "سه‌شنبه",
  "چهارشنبه",
  "پنجشنبه",
  "جمعه",
] as const;

/** JDN of a known reference date: 2000-01-01 was a Saturday. */
const REFERENCE_JDN = gregorianToJdn(2000, 1, 1);

/** Persian weekday name for a JDN (week starts on Saturday). */
export function weekdayFromJdn(jdn: number): string {
  const index = mod(jdn - REFERENCE_JDN, 7);
  return WEEKDAYS[index] ?? "";
}

export interface AgeResult {
  years: number;
  months: number;
  days: number;
  totalDays: number;
  totalWeeks: number;
  totalMonths: number;
  totalHours: number;
  /** Days until the next birthday (0 means today). */
  daysToBirthday: number;
  birthWeekday: string;
}

/**
 * Exact age between a birth date and a reference date, both Jalali.
 * Returns null when the birth date is invalid or in the future.
 */
export function calculateAge(
  birth: JalaliDate,
  reference: JalaliDate,
): AgeResult | null {
  if (!isValidJalaliDate(birth.jy, birth.jm, birth.jd)) return null;
  if (!isValidJalaliDate(reference.jy, reference.jm, reference.jd)) return null;

  const birthJdn = jalaliToJdn(birth.jy, birth.jm, birth.jd);
  const referenceJdn = jalaliToJdn(reference.jy, reference.jm, reference.jd);
  if (referenceJdn < birthJdn) return null;

  let years = reference.jy - birth.jy;
  let months = reference.jm - birth.jm;
  let days = reference.jd - birth.jd;

  if (days < 0) {
    months -= 1;
    const prevMonth = reference.jm === 1 ? 12 : reference.jm - 1;
    const prevYear = reference.jm === 1 ? reference.jy - 1 : reference.jy;
    days += jalaliMonthLength(prevYear, prevMonth);
  }
  if (months < 0) {
    years -= 1;
    months += 12;
  }

  // Next birthday, clamped for 30 Esfand born in a non-leap year.
  const clampDay = (jy: number) => Math.min(birth.jd, jalaliMonthLength(jy, birth.jm));
  let birthdayJdn = jalaliToJdn(reference.jy, birth.jm, clampDay(reference.jy));
  if (birthdayJdn < referenceJdn) {
    birthdayJdn = jalaliToJdn(reference.jy + 1, birth.jm, clampDay(reference.jy + 1));
  }

  const totalDays = referenceJdn - birthJdn;

  return {
    years,
    months,
    days,
    totalDays,
    totalWeeks: Math.floor(totalDays / 7),
    totalMonths: years * 12 + months,
    totalHours: totalDays * 24,
    daysToBirthday: birthdayJdn - referenceJdn,
    birthWeekday: weekdayFromJdn(birthJdn),
  };
}
