import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { normalisePersian, transliterateAddress } from "@/lib/transliterate";

describe("transliterate: normalisation", () => {
  it("unifies Arabic yeh/kaf, drops ZWNJ and diacritics", () => {
    assert.equal(normalisePersian("خيابان كوچهٔ"), "خیابان کوچه");
  });

  it("converts digits and collapses spaces", () => {
    assert.equal(normalisePersian("پلاک  ۱۲"), "پلاک 12");
  });
});

describe("transliterate: addresses", () => {
  it("uses the dictionary for common address words", () => {
    const { latin, words } = transliterateAddress("خیابان ولیعصر");
    assert.equal(latin, "Khiaban Valiasr");
    assert.ok(words.every((w) => w.fromDictionary));
  });

  it("keeps numbers in place", () => {
    const { latin } = transliterateAddress("پلاک ۱۲");
    assert.equal(latin, "Pelak 12");
  });

  it("transliterates city names", () => {
    for (const [fa, en] of [
      ["تهران", "Tehran"],
      ["مشهد", "Mashhad"],
      ["اصفهان", "Isfahan"],
      ["تبریز", "Tabriz"],
      ["رشت", "Rasht"],
    ] as const) {
      assert.equal(transliterateAddress(fa).latin, en, fa);
    }
  });

  it("falls back to a letter map for unknown words", () => {
    const { words } = transliterateAddress("گلستان");
    assert.equal(words.length, 1);
    assert.match(words[0]!.latin, /^[A-Za-z]+$/);
  });

  it("handles an empty input", () => {
    assert.deepEqual(transliterateAddress("   "), { latin: "", words: [] });
  });

  it("handles a full address", () => {
    const { latin } = transliterateAddress("تهران، خیابان ولیعصر، کوچه بهار، پلاک ۱۲");
    assert.ok(latin.startsWith("Tehran"));
    assert.ok(latin.includes("Valiasr"));
    assert.ok(latin.includes("12"));
  });
});
