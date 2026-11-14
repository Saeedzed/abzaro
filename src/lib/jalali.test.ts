import { test } from "node:test";
import assert from "node:assert/strict";
import {
  calculateAge,
  gregorianToJalali,
  isJalaliLeapYear,
  isValidJalaliDate,
  jalaliMonthLength,
  jalaliToGregorian,
  weekdayFromJdn,
  jalaliToJdn,
} from "./jalali";

test("1403-01-01 is 2024-03-20", () => {
  assert.deepEqual(jalaliToGregorian(1403, 1, 1), { gy: 2024, gm: 3, gd: 20 });
});

test("1403-12-30 exists because 1403 is a leap year", () => {
  assert.equal(isJalaliLeapYear(1403), true);
  assert.equal(jalaliMonthLength(1403, 12), 30);
  assert.deepEqual(jalaliToGregorian(1403, 12, 30), { gy: 2025, gm: 3, gd: 20 });
});

test("1402 is not a leap year — Esfand has 29 days", () => {
  assert.equal(isJalaliLeapYear(1402), false);
  assert.equal(jalaliMonthLength(1402, 12), 29);
});

test("round-trip Jalali → Gregorian → Jalali", () => {
  const samples = [
    [1370, 5, 12],
    [1400, 1, 1],
    [1404, 8, 23],
    [1399, 12, 30],
  ] as const;
  for (const [jy, jm, jd] of samples) {
    const g = jalaliToGregorian(jy, jm, jd);
    assert.deepEqual(gregorianToJalali(g.gy, g.gm, g.gd), { jy, jm, jd });
  }
});

test("known conversion: 2000-01-01 was 1378-10-11", () => {
  assert.deepEqual(gregorianToJalali(2000, 1, 1), { jy: 1378, jm: 10, jd: 11 });
});

test("known conversion: 2021-03-21 was 1400-01-01", () => {
  assert.deepEqual(gregorianToJalali(2021, 3, 21), { jy: 1400, jm: 1, jd: 1 });
});

test("weekday: 1403-01-01 was a Wednesday", () => {
  assert.equal(weekdayFromJdn(jalaliToJdn(1403, 1, 1)), "چهارشنبه");
});

test("isValidJalaliDate rejects bad dates", () => {
  assert.equal(isValidJalaliDate(1403, 1, 1), true);
  assert.equal(isValidJalaliDate(1403, 13, 1), false);
  assert.equal(isValidJalaliDate(1403, 1, 32), false);
  assert.equal(isValidJalaliDate(1402, 12, 30), false, "1402 Esfand has 29 days");
  assert.equal(isValidJalaliDate(1100, 1, 1), false, "out of supported range");
});

test("age is exact in years, months and days", () => {
  const age = calculateAge({ jy: 1370, jm: 5, jd: 12 }, { jy: 1403, jm: 5, jd: 12 });
  assert.ok(age);
  assert.equal(age.years, 33);
  assert.equal(age.months, 0);
  assert.equal(age.days, 0);
  assert.equal(age.daysToBirthday, 0, "birthday is today");
  assert.equal(age.totalMonths, 396);
});

test("age one day before the birthday", () => {
  const age = calculateAge({ jy: 1370, jm: 5, jd: 12 }, { jy: 1403, jm: 5, jd: 11 });
  assert.ok(age);
  assert.equal(age.years, 32);
  assert.equal(age.months, 11);
  assert.equal(age.days, 30);
  assert.equal(age.daysToBirthday, 1);
});

test("age across a month boundary counts exact days", () => {
  // Born 31 Farvardin, reference 1 Ordibehesht → Farvardin has 31 days,
  // so the baby is exactly one day old (not one month).
  const age = calculateAge({ jy: 1400, jm: 1, jd: 31 }, { jy: 1400, jm: 2, jd: 1 });
  assert.ok(age);
  assert.equal(age.years, 0);
  assert.equal(age.months, 0);
  assert.equal(age.days, 1);
  assert.equal(age.totalDays, 1);
});

test("age borrows days from a 30-day month", () => {
  // Born 31 Shahrivar, reference 1 Mehr → Shahrivar has 31 days → 1 day old
  const age = calculateAge({ jy: 1400, jm: 6, jd: 31 }, { jy: 1400, jm: 7, jd: 1 });
  assert.ok(age);
  assert.equal(age.months, 0);
  assert.equal(age.days, 1);
});

test("future birth date returns null", () => {
  assert.equal(calculateAge({ jy: 1450, jm: 1, jd: 1 }, { jy: 1403, jm: 1, jd: 1 }), null);
});

test("totalDays matches a known span", () => {
  // 1400-01-01 → 1401-01-01 = 365 days (1400 is not a leap year)
  const age = calculateAge({ jy: 1400, jm: 1, jd: 1 }, { jy: 1401, jm: 1, jd: 1 });
  assert.ok(age);
  assert.equal(age.totalDays, 365);
});
