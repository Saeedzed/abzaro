import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { jalaliToJdn } from "@/lib/jalali";
import {
  addWorkingDays,
  describeDate,
  getHolidays,
  holidayStats,
  upcomingHolidays,
  weekdayIndex,
  weekdayName,
  isFriday,
} from "@/lib/holidays";

/**
 * These weekdays were copied from the *published* calendars, which print the day
 * of week next to each date. If our Jalali→weekday maths disagrees with any of
 * them, either the date or the conversion is wrong — so they act as an
 * independent check on both.
 */
const PUBLISHED_1405: Array<[number, number, string]> = [
  [1, 1, "شنبه"], // نوروز + عید فطر
  [1, 2, "یکشنبه"],
  [1, 3, "دوشنبه"],
  [1, 4, "سه‌شنبه"],
  [1, 12, "چهارشنبه"],
  [1, 13, "پنجشنبه"],
  [1, 25, "سه‌شنبه"],
  [3, 6, "چهارشنبه"],
  [3, 14, "پنجشنبه"],
  [3, 15, "جمعه"],
  [4, 3, "چهارشنبه"],
  [4, 4, "پنجشنبه"],
  [5, 13, "سه‌شنبه"],
  [5, 21, "چهارشنبه"],
  [5, 22, "پنجشنبه"],
  [5, 30, "جمعه"],
  [6, 8, "یکشنبه"],
  [8, 22, "جمعه"],
  [10, 2, "چهارشنبه"],
  [10, 16, "چهارشنبه"],
  [11, 4, "یکشنبه"],
  [11, 22, "پنجشنبه"],
  [12, 9, "یکشنبه"],
  [12, 19, "چهارشنبه"],
  [12, 20, "پنجشنبه"],
  [12, 29, "شنبه"],
];

const PUBLISHED_1404: Array<[number, number, string]> = [
  [1, 1, "جمعه"],
  [1, 11, "دوشنبه"], // عید فطر
  [1, 13, "چهارشنبه"],
  [2, 4, "پنجشنبه"],
  [3, 14, "چهارشنبه"],
  [3, 15, "پنجشنبه"],
  [3, 16, "جمعه"], // عید قربان
  [3, 24, "شنبه"], // عید غدیر
  [4, 14, "شنبه"], // تاسوعا
  [4, 15, "یکشنبه"], // عاشورا
  [5, 23, "پنجشنبه"], // اربعین
  [6, 2, "یکشنبه"],
  [6, 19, "چهارشنبه"],
  [10, 13, "شنبه"],
  // The weekday printed for 22 Bahman 1404 differs between outlets; it must be
  // Wednesday: 1404/1/1 is a Friday (the year "starts and ends on a Friday").
  [11, 22, "چهارشنبه"],
  [12, 29, "جمعه"],
];

describe("holidays: weekday parity with published calendars", () => {
  it("1405 dates fall on the printed weekday", () => {
    for (const [jm, jd, day] of PUBLISHED_1405) {
      assert.equal(weekdayName(1405, jm, jd), day, `1405/${jm}/${jd}`);
    }
  });

  it("1404 dates fall on the printed weekday", () => {
    for (const [jm, jd, day] of PUBLISHED_1404) {
      assert.equal(weekdayName(1404, jm, jd), day, `1404/${jm}/${jd}`);
    }
  });

  it("every published holiday is present in the table", () => {
    for (const [jm, jd] of PUBLISHED_1405) {
      const info = describeDate(1405, jm, jd);
      assert.ok(info.holiday, `1405/${jm}/${jd} should be a holiday`);
    }
  });
});

describe("holidays: year registry", () => {
  it("1404 and 1405 are marked verified", () => {
    assert.equal(getHolidays(1404).verified, true);
    assert.equal(getHolidays(1405).verified, true);
  });

  it("an untabulated year returns only fixed holidays and is unverified", () => {
    const y = getHolidays(1410);
    assert.equal(y.verified, false);
    assert.equal(y.holidays.length, 10); // the ten solar holidays
    assert.ok(y.holidays.every((h) => h.kind === "fixed"));
  });

  it("holidays are sorted by date", () => {
    const list = getHolidays(1405).holidays;
    for (let i = 1; i < list.length; i += 1) {
      const a = list[i - 1]!;
      const b = list[i]!;
      assert.ok(a.jm < b.jm || (a.jm === b.jm && a.jd <= b.jd), "sorted");
    }
  });

  it("no duplicate date inside a year", () => {
    const list = getHolidays(1405).holidays;
    const keys = new Set(list.map((h) => `${h.jm}/${h.jd}`));
    assert.equal(keys.size, list.length);
  });

  it("1405 has 26 distinct holiday dates (1 Farvardin carries two occasions)", () => {
    const list = getHolidays(1405).holidays;
    assert.equal(list.length, 26);
    const first = list.find((h) => h.jm === 1 && h.jd === 1);
    assert.ok(first, "1/1 exists");
    assert.ok(first.title.includes("نوروز") && first.title.includes("فطر"), first.title);
  });

  it("1405 has 75 days off: 26 holidays + 52 Fridays − 3 that coincide", () => {
    const s = holidayStats(1405);
    assert.equal(s.fridays, 52);
    assert.equal(s.onFriday, 3);
    assert.equal(s.daysOff, 75);
  });

  it("1404 has 75 days off too, via 53 Fridays and 4 coinciding holidays", () => {
    const s = holidayStats(1404);
    assert.equal(s.fridays, 53);
    assert.equal(s.onFriday, 4);
    assert.equal(s.daysOff, 75);
  });
});

describe("holidays: statistics are computed, not typed in", () => {
  it("days off = holidays + Fridays that are not holidays", () => {
    for (const year of [1404, 1405]) {
      const s = holidayStats(year);
      assert.equal(s.daysOff, s.total + (s.fridays - s.onFriday));
    }
  });

  it("a year has 52 or 53 Fridays", () => {
    for (const year of [1404, 1405]) {
      const s = holidayStats(year);
      assert.ok(s.fridays === 52 || s.fridays === 53, `fridays=${s.fridays}`);
    }
  });

  it("1405 days off is in the plausible range for an Iranian year", () => {
    // Iran's weekend is Friday only, so a year is ~52 Fridays + ~26 holidays,
    // minus the holidays that already fall on a Friday.
    const s = holidayStats(1405);
    assert.ok(s.daysOff > 60 && s.daysOff < 90, `daysOff=${s.daysOff}`);
  });

  it("1 Farvardin 1404 is a Friday, so it is a day off without an occasion", () => {
    const info = describeDate(1404, 1, 1);
    assert.equal(info.friday, true);
    assert.equal(info.dayOff, true);
  });
});

describe("holidays: working-day arithmetic", () => {
  it("skips Friday", () => {
    // 1405/3/15 is both a Friday and قیام ۱۵ خرداد; from Thursday the next
    // working day is Saturday 3/16.
    const next = addWorkingDays(1405, 3, 14, 1);
    assert.deepEqual([next.jy, next.jm, next.jd], [1405, 3, 16]);
    assert.equal(next.skipped.length, 1);
  });

  it("jumps over the Nowruz break", () => {
    // 1404/12/29 and 1405/1/1…1/4 are all off, so the next working day is 1/5.
    const next = addWorkingDays(1404, 12, 28, 1);
    assert.deepEqual([next.jy, next.jm, next.jd], [1405, 1, 5]);
    assert.equal(next.skipped.length, 5);
    assert.ok(next.skipped[0]!.includes("نفت"), "29 Esfand is the oil-nationalisation day");
  });

  it("is reversible for a plain week", () => {
    const forward = addWorkingDays(1405, 5, 10, 5);
    const back = addWorkingDays(forward.jy, forward.jm, forward.jd, -5);
    assert.deepEqual([back.jy, back.jm, back.jd], [1405, 5, 10]);
  });

  it("adding zero days stays put", () => {
    const same = addWorkingDays(1405, 5, 10, 0);
    assert.deepEqual([same.jy, same.jm, same.jd], [1405, 5, 10]);
  });
});

describe("holidays: upcoming list", () => {
  it("returns future holidays in order", () => {
    const list = upcomingHolidays(1405, 8, 1, 4);
    assert.equal(list.length, 4);
    for (let i = 1; i < list.length; i += 1) {
      const prev = list[i - 1]!;
      const cur = list[i]!;
      assert.ok(
        jalaliToJdn(prev.jy, prev.jm, prev.jd) < jalaliToJdn(cur.jy, cur.jm, cur.jd),
        "strictly increasing",
      );
    }
  });

  it("does not return a holiday before the given date", () => {
    const list = upcomingHolidays(1405, 6, 9, 1);
    const first = list[0]!;
    assert.ok(first.jm > 6 || (first.jm === 6 && first.jd >= 9));
  });

  it("a non-holiday weekday reports no occasion", () => {
    const info = describeDate(1405, 5, 14);
    assert.equal(info.weekday, "چهارشنبه");
    assert.equal(info.holiday, undefined);
    assert.equal(info.dayOff, false);
  });
});

describe("holidays: weekday helpers", () => {
  it("index 0 is Saturday, 6 is Friday", () => {
    assert.equal(weekdayIndex(1405, 1, 1), 0);
    assert.equal(isFriday(1405, 3, 15), true);
    assert.equal(isFriday(1405, 3, 16), false);
  });
});
