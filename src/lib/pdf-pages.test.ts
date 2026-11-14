import { test } from "node:test";
import assert from "node:assert/strict";
import {
  baseFileName,
  fitToPage,
  PAGE_SIZES,
  pageBox,
  parsePageRange,
} from "./pdf-pages";

test("parsePageRange: empty input selects every page", () => {
  assert.deepEqual(parsePageRange("", 3), { pages: [1, 2, 3], error: null });
  assert.deepEqual(parsePageRange("   ", 3), { pages: [1, 2, 3], error: null });
});

test("parsePageRange: single, list and range forms", () => {
  assert.deepEqual(parsePageRange("3", 5).pages, [3]);
  assert.deepEqual(parsePageRange("1-3", 5).pages, [1, 2, 3]);
  assert.deepEqual(parsePageRange("1-3, 5", 5).pages, [1, 2, 3, 5]);
  assert.deepEqual(parsePageRange("1-3، 7، 9-10", 10).pages, [1, 2, 3, 7, 9, 10]);
});

test("parsePageRange: duplicates collapse and order is normalised", () => {
  assert.deepEqual(parsePageRange("5, 1, 5, 2", 5).pages, [1, 2, 5]);
  assert.deepEqual(parsePageRange("5-3", 5).pages, [3, 4, 5]);
});

test("parsePageRange: rejects bad input with a Persian message", () => {
  const outOfRange = parsePageRange("9", 5);
  assert.equal(outOfRange.error !== null, true);
  assert.deepEqual(outOfRange.pages, []);

  assert.equal(parsePageRange("abc", 5).error !== null, true);
  assert.equal(parsePageRange("0-2", 5).error !== null, true);
  assert.equal(parsePageRange("1--2", 5).error !== null, true);
});

test("pageBox: fixed orientation and size", () => {
  assert.deepEqual(pageBox("a4", "portrait"), { width: 595.28, height: 841.89 });
  assert.deepEqual(pageBox("a4", "landscape"), { width: 841.89, height: 595.28 });
  assert.deepEqual(pageBox("letter", "portrait"), { width: 612, height: 792 });
});

test("pageBox: auto follows the content aspect ratio", () => {
  const wide = pageBox("a4", "auto", 2);
  assert.equal(Math.round(wide.width), Math.round(PAGE_SIZES.a4.height));
  assert.equal(Math.round(wide.height), Math.round(PAGE_SIZES.a4.height / 2));

  const tall = pageBox("a4", "auto", 0.5);
  assert.equal(Math.round(tall.height), Math.round(PAGE_SIZES.a4.height));
  assert.equal(Math.round(tall.width), Math.round(PAGE_SIZES.a4.height * 0.5));
});

test("baseFileName: strips extension and unsafe characters", () => {
  assert.equal(baseFileName("my photo.jpg"), "my-photo");
  assert.equal(baseFileName("گزارش/سال.pdf"), "گزارش-سال");
  assert.equal(baseFileName("", "file"), "file");
});

test("fitToPage: never upscales beyond the page and keeps the ratio", () => {
  const wide = fitToPage(1000, 500, 600, 600);
  assert.deepEqual(wide, { width: 600, height: 300 });

  const withMargin = fitToPage(1000, 500, 600, 600, 50);
  assert.deepEqual(withMargin, { width: 500, height: 250 });
});
