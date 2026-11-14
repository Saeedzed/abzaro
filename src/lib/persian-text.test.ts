import { test } from "node:test";
import assert from "node:assert/strict";
import { cleanPersianText, defaultCleanOptions, normalizeArabicLetters } from "./persian-text";

const ALL_OFF = {
  normalizeArabicLetters: false,
  persianDigits: false,
  collapseSpaces: false,
  spaceBeforePunctuation: false,
  removeInvisible: false,
  collapseBlankLines: false,
};

test("normalizeArabicLetters maps Arabic yeh/kaf to Persian", () => {
  assert.equal(normalizeArabicLetters("علي كتاب"), "علی کتاب");
});

test("collapseSpaces trims lines and squeezes runs", () => {
  const result = cleanPersianText("  سلام   دنیا  \n\n  خط دوم   ", {
    ...ALL_OFF,
    collapseSpaces: true,
  });
  assert.equal(result.text, "سلام دنیا\n\nخط دوم");
});

test("spaceBeforePunctuation removes the space before ، and ؟", () => {
  const result = cleanPersianText("سلام ، دنیا ؟ خوبی !", {
    ...ALL_OFF,
    spaceBeforePunctuation: true,
  });
  assert.equal(result.text, "سلام، دنیا؟ خوبی!");
});

test("removeInvisible strips ZWNJ-adjacent marks and directional controls", () => {
  const withMarks = "متن\u200F با\uFEFF کاراکتر\u200B نامرئی";
  const result = cleanPersianText(withMarks, { ...ALL_OFF, removeInvisible: true });
  assert.equal(result.text, "متن با کاراکتر نامرئی");
});

test("persianDigits option converts Latin and Arabic digits", () => {
  const result = cleanPersianText("سال 1403 و ٤٥", { ...ALL_OFF, persianDigits: true });
  assert.equal(result.text, "سال ۱۴۰۳ و ۴۵");
});

test("persianDigits off leaves digits untouched", () => {
  const result = cleanPersianText("سال 1403", { ...ALL_OFF, persianDigits: false });
  assert.equal(result.text, "سال 1403");
});

test("collapseBlankLines reduces 3+ newlines to one blank line", () => {
  const result = cleanPersianText("a\n\n\n\n\nb", { ...ALL_OFF, collapseBlankLines: true });
  assert.equal(result.text, "a\n\nb");
});

test("default options clean a messy Persian paragraph", () => {
  const messy = "  علي  كتابش را   خواند ، و رفت .\u200F  \n\n\n\n  پایان  ";
  const { text, stats } = cleanPersianText(messy, defaultCleanOptions);
  assert.equal(text, "علی کتابش را خواند، و رفت.\n\nپایان");
  assert.ok(stats.total > 0, "stats.total should report changes");
});

test("empty input is a no-op", () => {
  const { text, stats } = cleanPersianText("", defaultCleanOptions);
  assert.equal(text, "");
  assert.equal(stats.total, 0);
});

test("already-clean text reports zero changes", () => {
  const clean = "این متن از قبل تمیز است.";
  const { text, stats } = cleanPersianText(clean, defaultCleanOptions);
  assert.equal(text, clean);
  assert.equal(stats.total, 0);
});

test("ZWNJ (نیم‌فاصله) is preserved by space collapsing", () => {
  const { text } = cleanPersianText("می‌خواهم   بروم", defaultCleanOptions);
  assert.equal(text, "می‌خواهم بروم");
  assert.ok(text.includes("\u200C"), "ZWNJ must survive cleaning");
});
