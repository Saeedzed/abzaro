import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  countParagraphs,
  countSentences,
  countWords,
  formatDuration,
  getTextStats,
} from "./text-stats";

describe("countWords", () => {
  it("counts Persian words", () => {
    assert.equal(countWords("سلام دنیا"), 2);
  });

  it("treats نیم‌فاصله as part of a word", () => {
    assert.equal(countWords("می‌خواهم بروم"), 2);
  });

  it("returns 0 for empty text", () => {
    assert.equal(countWords("   "), 0);
  });
});

describe("countSentences", () => {
  it("counts Persian and Latin sentence terminators", () => {
    assert.equal(countSentences("سلام! خوبی؟ بله."), 3);
  });
});

describe("countParagraphs", () => {
  it("splits on blank lines", () => {
    assert.equal(countParagraphs("بند یک\n\nبند دو"), 2);
  });
});

describe("getTextStats", () => {
  it("computes all counters", () => {
    const stats = getTextStats("سلام دنیا");
    assert.equal(stats.words, 2);
    assert.equal(stats.charactersWithSpaces, 9);
    assert.equal(stats.charactersWithoutSpaces, 8);
    assert.equal(stats.lines, 1);
    assert.ok(stats.bytes > stats.charactersWithSpaces);
  });
});

describe("formatDuration", () => {
  it("formats seconds", () => {
    assert.equal(formatDuration(45), "۴۵ ثانیه");
  });

  it("formats minutes and seconds", () => {
    assert.equal(formatDuration(150), "۲ دقیقه و ۳۰ ثانیه");
  });
});
