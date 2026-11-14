import { test } from "node:test";
import assert from "node:assert/strict";
import { applyReplaceRules, persianLorem } from "./text-tools";

test("applyReplaceRules applies rules in order", () => {
  const result = applyReplaceRules("سلام دنیا", [
    { find: "سلام", replace: "درود" },
    { find: "دنیا", replace: "جهان" },
  ]);
  assert.equal(result.output, "درود جهان");
  assert.equal(result.replacements, 2);
});

test("later rules see the output of earlier rules", () => {
  const result = applyReplaceRules("a", [
    { find: "a", replace: "b" },
    { find: "b", replace: "c" },
  ]);
  assert.equal(result.output, "c");
  assert.equal(result.replacements, 2);
});

test("ignoreCase replaces every case variant", () => {
  const result = applyReplaceRules("Tehran tehran TEHRAN", [{ find: "tehran", replace: "تهران" }], {
    ignoreCase: true,
  });
  assert.equal(result.output, "تهران تهران تهران");
  assert.equal(result.replacements, 3);
});

test("empty find values are ignored (no infinite-ish behaviour)", () => {
  const result = applyReplaceRules("abc", [{ find: "", replace: "x" }]);
  assert.equal(result.output, "abc");
  assert.equal(result.replacements, 0);
});

test("regex-special characters are treated literally", () => {
  const result = applyReplaceRules("قیمت 1.5 تومان", [{ find: "1.5", replace: "۲" }]);
  assert.equal(result.output, "قیمت ۲ تومان");
});

test("persianLorem is deterministic for a seed and respects counts", () => {
  const first = persianLorem({ paragraphs: 2, sentencesPerParagraph: 3, seed: 42 });
  const second = persianLorem({ paragraphs: 2, sentencesPerParagraph: 3, seed: 42 });
  assert.equal(first, second);
  assert.equal(first.split("\n\n").length, 2);
  assert.ok(first.split(".").filter((part) => part.trim() !== "").length >= 6);
  assert.match(first, /[\u0600-\u06FF]/);
});

test("different seeds produce different text", () => {
  assert.notEqual(
    persianLorem({ paragraphs: 1, sentencesPerParagraph: 2, seed: 1 }),
    persianLorem({ paragraphs: 1, sentencesPerParagraph: 2, seed: 2 }),
  );
});
