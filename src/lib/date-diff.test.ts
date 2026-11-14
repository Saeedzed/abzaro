import { test } from "node:test";
import assert from "node:assert/strict";
import {
  addDays,
  diffDates,
  exactAge,
  parseIsoJalali,
  splitClock,
  weekdayOf,
  ymdDifference,
  zodiacSign,
} from "./dates";

test("ymdDifference: 1400-01-01 → 1403-05-15", () => {
  assert.deepEqual(ymdDifference({ y: 1400, m: 1, d: 1 }, { y: 1403, m: 5, d: 15 }), {
    years: 3,
    months: 4,
    days: 14,
  });
});

test("ymdDifference: order does not matter for y/m/d", () => {
  assert.deepEqual(
    ymdDifference({ y: 1403, m: 5, d: 15 }, { y: 1400, m: 1, d: 1 }),
    { years: 3, months: 4, days: 14 },
  );
});

test("ymdDifference: borrowing across a month boundary", () => {
  // 31 Farvardin → 1 Ordibehesht = 0 months 1 day (Farvardin has 31 days).
  assert.deepEqual(ymdDifference({ y: 1402, m: 1, d: 31 }, { y: 1402, m: 2, d: 1 }), {
    years: 0,
    months: 0,
    days: 1,
  });
});

test("diffDates: same date is zero in every unit", () => {
  const result = diffDates({ y: 1403, m: 6, d: 31 }, { y: 1403, m: 6, d: 31 });
  assert.ok(result);
  assert.equal(result.totalDays, 0);
  assert.equal(result.direction, "same");
  assert.equal(result.totalHours, 0);
});

test("diffDates: knows which date is later and counts days", () => {
  const result = diffDates({ y: 1403, m: 1, d: 1 }, { y: 1403, m: 1, d: 11 });
  assert.ok(result);
  assert.equal(result.totalDays, 10);
  assert.equal(result.absDays, 10);
  assert.equal(result.direction, "later");
  assert.equal(result.weeks, 1);
  assert.equal(result.leftoverDays, 3);
  assert.equal(result.totalHours, 240);
  assert.equal(result.totalMinutes, 14400);

  const reversed = diffDates({ y: 1403, m: 1, d: 11 }, { y: 1403, m: 1, d: 1 });
  assert.ok(reversed);
  assert.equal(reversed.totalDays, -10);
  assert.equal(reversed.direction, "earlier");
  assert.equal(reversed.absDays, 10);
});

test("diffDates: rejects invalid Jalali dates", () => {
  assert.equal(diffDates({ y: 1402, m: 12, d: 30 }, { y: 1403, m: 1, d: 1 }), null); // 1402 has 29 days in Esfand
  assert.equal(diffDates({ y: 1403, m: 13, d: 1 }, { y: 1403, m: 1, d: 1 }), null);
});

test("weekdayOf: 1404-01-01 is a Friday (2025-03-21)", () => {
  assert.equal(weekdayOf({ y: 1404, m: 1, d: 1 }), "جمعه");
  assert.equal(weekdayOf({ y: 1370, m: 5, d: 12 }), "شنبه");
});

test("addDays: rolls over the month and the year", () => {
  // 1403 is a leap year (Esfand has 30 days), 1402 is not.
  assert.deepEqual(addDays({ y: 1403, m: 12, d: 29 }, 1), { y: 1403, m: 12, d: 30 });
  assert.deepEqual(addDays({ y: 1402, m: 12, d: 29 }, 1), { y: 1403, m: 1, d: 1 });
  assert.deepEqual(addDays({ y: 1403, m: 1, d: 1 }, 0), { y: 1403, m: 1, d: 1 });
  assert.deepEqual(addDays({ y: 1403, m: 1, d: 1 }, -1), { y: 1402, m: 12, d: 29 });
});

test("splitClock: converts 24h to 12h with Persian meridiem", () => {
  assert.deepEqual(splitClock(0, 5), { hour12: 12, minute: 5, meridiem: "ق.ظ", hour24: 0 });
  assert.deepEqual(splitClock(9, 30), { hour12: 9, minute: 30, meridiem: "ق.ظ", hour24: 9 });
  assert.deepEqual(splitClock(12, 0), { hour12: 12, minute: 0, meridiem: "ب.ظ", hour24: 12 });
  assert.deepEqual(splitClock(21, 45), { hour12: 9, minute: 45, meridiem: "ب.ظ", hour24: 21 });
});

test("exactAge: birth 1370-05-12 08:30 → 1403-08-23 14:45", () => {
  const age = exactAge(
    { date: { y: 1370, m: 5, d: 12 }, hour: 8, minute: 30 },
    { date: { y: 1403, m: 8, d: 23 }, hour: 14, minute: 45 },
  );
  assert.ok(age);
  assert.equal(age.years, 33);
  assert.equal(age.months, 3);
  assert.equal(age.days, 11);
  assert.equal(age.hours, 6);
  assert.equal(age.minutes, 15);
  assert.equal(age.weekday, "شنبه");
  assert.equal(age.sign, "اسد"); // 12 Mordad → اسد
});

test("exactAge: future birth date is rejected", () => {
  assert.equal(
    exactAge(
      { date: { y: 1410, m: 1, d: 1 }, hour: 0, minute: 0 },
      { date: { y: 1403, m: 1, d: 1 }, hour: 0, minute: 0 },
    ),
    null,
  );
});

test("exactAge: same day later clock time is positive", () => {
  const age = exactAge(
    { date: { y: 1403, m: 5, d: 1 }, hour: 10, minute: 0 },
    { date: { y: 1403, m: 5, d: 1 }, hour: 12, minute: 30 },
  );
  assert.ok(age);
  assert.equal(age.totalDays, 0);
  assert.equal(age.hours, 2);
  assert.equal(age.minutes, 30);
});

test("zodiacSign: one sign per Jalali month", () => {
  assert.equal(zodiacSign({ y: 1403, m: 1, d: 1 }), "حمل");
  assert.equal(zodiacSign({ y: 1403, m: 1, d: 31 }), "حمل");
  assert.equal(zodiacSign({ y: 1403, m: 5, d: 12 }), "اسد");
  assert.equal(zodiacSign({ y: 1403, m: 9, d: 1 }), "قوس");
  assert.equal(zodiacSign({ y: 1403, m: 12, d: 29 }), "حوت");
});

test("parseIsoJalali: accepts Persian digits and rejects junk", () => {
  assert.deepEqual(parseIsoJalali("1403-05-12"), { y: 1403, m: 5, d: 12 });
  assert.deepEqual(parseIsoJalali("۱۴۰۳-۵-۱۲"), { y: 1403, m: 5, d: 12 });
  assert.deepEqual(parseIsoJalali("1403-12-30"), { y: 1403, m: 12, d: 30 }); // leap year
  assert.equal(parseIsoJalali("1402-12-30"), null); // 1402 is not a leap year
  assert.equal(parseIsoJalali("abc"), null);
  assert.equal(parseIsoJalali(""), null);
});
