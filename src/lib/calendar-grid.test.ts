import { test } from "node:test";
import assert from "node:assert/strict";
import { WEEKDAY_HEADERS, buildMonthGrid, saturdayIndexFromJdn } from "./calendar-grid";
import { jalaliMonthLength, jalaliToJdn } from "./jalali";

test("weekday headers start on Saturday", () => {
  assert.equal(WEEKDAY_HEADERS[0], "شنبه");
  assert.equal(WEEKDAY_HEADERS[6], "جمعه");
});

test("۱ آبان ۱۴۰۴ is at the right weekday offset", () => {
  const grid = buildMonthGrid(1404, 8);
  assert.ok(grid);
  // 1 Aban 1404 = 23 Oct 2025 = Thursday → index 5 (شنبه=0)
  const offset = grid.cells.findIndex((cell) => cell.day === 1);
  assert.equal(offset, saturdayIndexFromJdn(jalaliToJdn(1404, 8, 1)));
  assert.equal(grid.cells[offset]?.weekday, "پنجشنبه");
});

test("grid covers every day of the month exactly once", () => {
  const grid = buildMonthGrid(1404, 12);
  assert.ok(grid);
  const days = grid.cells.map((cell) => cell.day).filter((day): day is number => day !== null);
  const expected = Array.from({ length: jalaliMonthLength(1404, 12) }, (_, i) => i + 1);
  assert.deepEqual(days, expected);
});

test("grid rows are always full weeks and Fridays are flagged", () => {
  const grid = buildMonthGrid(1404, 1);
  assert.ok(grid);
  assert.equal(grid.cells.length % 7, 0);
  const friday = grid.cells.find((cell) => cell.day !== null && cell.isFriday);
  assert.equal(friday?.weekday, "جمعه");
});

test("invalid months return null", () => {
  assert.equal(buildMonthGrid(1404, 0), null);
  assert.equal(buildMonthGrid(1404, 13), null);
});
