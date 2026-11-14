import { test } from "node:test";
import assert from "node:assert/strict";
import { dedupeLines, keywordDensity, slugify, sortLines } from "./text-tools";

/* ----------------------------- dedupeLines -------------------------------- */

test("dedupe keeps the first occurrence and original order", () => {
  const result = dedupeLines("تهران\nاصفهان\nتهران\nمشهد\nاصفهان");
  assert.deepEqual(result.unique, ["تهران", "اصفهان", "مشهد"]);
  assert.equal(result.before, 5);
  assert.equal(result.after, 3);
  assert.equal(result.removed.length, 2);
});

test("dedupe folds Arabic yeh/kaf and half-spaces when ignoring case", () => {
  const result = dedupeLines("فشرده‌سازي\nفشردهسازی", { ignoreCase: true });
  assert.equal(result.unique.length, 1);
});

test("dedupe with ignoreCase off keeps visually similar lines", () => {
  const result = dedupeLines("Tehran\nTEHRAN", { ignoreCase: false });
  assert.equal(result.unique.length, 2);
});

test("dedupe can keep empty lines when asked", () => {
  const result = dedupeLines("الف\n\nب\n\nالف", { removeEmpty: false });
  // first blank kept, second blank removed, second «الف» removed
  assert.deepEqual(result.unique, ["الف", "", "ب"]);
});

test("dedupe trims surrounding spaces by default", () => {
  const result = dedupeLines("  سلام  \nسلام");
  assert.deepEqual(result.unique, ["سلام"]);
});

/* ------------------------------- sortLines -------------------------------- */

test("alphabetical sort uses Persian collation", () => {
  assert.deepEqual(sortLines("پ\nا\nب", "alphabetical"), ["ا", "ب", "پ"]);
  assert.deepEqual(sortLines("ا\nب\nپ", "alphabetical-desc"), ["پ", "ب", "ا"]);
});

test("length sort is stable via alphabetical tie-break", () => {
  assert.deepEqual(sortLines("سه\nیکصد\nدو", "length"), ["دو", "سه", "یکصد"]);
  // equal lengths fall back to Persian alphabetical order
  assert.deepEqual(sortLines("پ\nب\nا", "length"), ["ا", "ب", "پ"]);
});

test("reverse sort flips the current order and drops blank lines", () => {
  assert.deepEqual(sortLines("یک\n\nدو\nسه", "reverse"), ["سه", "دو", "یک"]);
});

test("random sort keeps every line exactly once", () => {
  const input = ["a", "b", "c", "d", "e"].join("\n");
  const result = sortLines(input, "random");
  assert.equal(result.length, 5);
  assert.deepEqual([...result].sort(), ["a", "b", "c", "d", "e"]);
});

/* -------------------------------- slugify --------------------------------- */

test("slugify transliterates Persian to ASCII", () => {
  assert.equal(slugify("سلام دنیا"), "slam-dnya");
  assert.equal(slugify("چطور یک عکس را به PDF تبدیل کنیم؟"), "chtvr-yk-aks-ra-bh-pdf-tbdyl-knym");
});

test("slugify keeps Persian letters when asked", () => {
  assert.equal(slugify("سلام دنیا", { keepPersian: true }), "سلام-دنیا");
});

test("slugify supports a custom separator and trims edges", () => {
  assert.equal(slugify("  hello world  ", { separator: "_" }), "hello_world");
});

test("slugify strips punctuation and collapses separators", () => {
  assert.equal(slugify("A -- B, C!"), "a-b-c");
});

/* ----------------------------- keywordDensity ------------------------------ */

test("density counts words and drops stop words", () => {
  const result = keywordDensity("عکس به PDF تبدیل عکس به PDF", { dropStopWords: true });
  assert.equal(result.totalWords > 0, true);
  const words = result.keywords.map((item) => item.word);
  assert.ok(words.includes("عکس"));
  assert.ok(words.includes("pdf"));
  assert.ok(!words.includes("به"));
});

test("density treats half-space variants as one word", () => {
  const result = keywordDensity("می‌شود می‌شود میشود");
  const entry = result.keywords.find((item) => item.word.includes("شود"));
  assert.equal(entry?.count, 3);
});

test("density percentages stay in range and respect the limit", () => {
  const result = keywordDensity("alpha beta alpha gamma beta alpha", { limit: 2, dropStopWords: false });
  assert.equal(result.keywords.length, 2);
  for (const keyword of result.keywords) {
    assert.ok(keyword.density > 0 && keyword.density <= 1);
  }
});

test("density on empty input returns zeros rather than NaN", () => {
  const result = keywordDensity("");
  assert.equal(result.totalWords, 0);
  assert.deepEqual(result.keywords, []);
});
