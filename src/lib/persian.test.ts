import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  formatPersianNumberFromString,
  normalizeDigits,
  toEnglishDigits,
  toPersianDigits,
} from "./persian";

describe("toPersianDigits", () => {
  it("converts Latin digits", () => {
    assert.equal(toPersianDigits("1234567890"), "۱۲۳۴۵۶۷۸۹۰");
  });

  it("leaves non-digits untouched", () => {
    assert.equal(toPersianDigits("قیمت: 42 تومان"), "قیمت: ۴۲ تومان");
  });
});

describe("toEnglishDigits", () => {
  it("converts Persian digits", () => {
    assert.equal(toEnglishDigits("۱۲۳"), "123");
  });

  it("converts Arabic digits", () => {
    assert.equal(toEnglishDigits("١٢٣"), "123");
  });
});

describe("normalizeDigits", () => {
  it("removes separators and converts scripts", () => {
    assert.equal(normalizeDigits("۱٬۲۳۴,۵۶۷"), "1234567");
  });
});

describe("formatPersianNumberFromString", () => {
  it("formats integers with Persian separators", () => {
    assert.equal(formatPersianNumberFromString("1234567"), "۱٬۲۳۴٬۵۶۷");
  });

  it("accepts Persian digits as input", () => {
    assert.equal(formatPersianNumberFromString("۱۲۳۴"), "۱٬۲۳۴");
  });

  it("returns null for invalid input", () => {
    assert.equal(formatPersianNumberFromString("abc"), null);
    assert.equal(formatPersianNumberFromString(""), null);
  });
});
