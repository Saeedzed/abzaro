import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { normalisePhone, scanContacts, toLatinDigits, unique } from "@/lib/extract-contacts";
import { normalisePersian, transliterateAddress } from "@/lib/transliterate";

describe("contacts: digit normalisation", () => {
  it("converts Persian and Arabic digits", () => {
    assert.equal(toLatinDigits("۰۱۲۳۴۵۶۷۸۹"), "0123456789");
    assert.equal(toLatinDigits("٠١٢٣٤٥٦٧٨٩"), "0123456789");
  });

  it("normalises every Iranian mobile form to 09xxxxxxxxx", () => {
    for (const raw of ["09123456789", "+989123456789", "00989123456789", "9123456789", "۰۹۱۲۳۴۵۶۷۸۹"]) {
      assert.equal(normalisePhone(raw), "09123456789", raw);
    }
  });
});

describe("contacts: scanning", () => {
  const text = `تماس: ۰۹۱۲۳۴۵۶۷۸۹ یا +98 912 345 6789
دفتر: 021-88776655 — ایمیل: Info@Example.com
سایت: https://example.ir/contact و www.test.com، تاریخ 1404-05-12`;

  it("finds and lowercases emails", () => {
    assert.deepEqual(unique(scanContacts(text).emails).map((e) => e.value), ["info@example.com"]);
  });

  it("finds mobile numbers and normalises them", () => {
    assert.deepEqual(unique(scanContacts(text).mobiles).map((e) => e.value), ["09123456789"]);
  });

  it("separates landlines from mobiles", () => {
    assert.deepEqual(unique(scanContacts(text).landlines).map((e) => e.value), ["02188776655"]);
  });

  it("finds both URLs and does not report an email domain as a URL", () => {
    assert.deepEqual(unique(scanContacts(text).urls).map((e) => e.value), [
      "https://example.ir/contact",
      "www.test.com",
    ]);
  });

  it("does not treat a date as a phone number", () => {
    const scan = scanContacts("تاریخ 1404-05-12 ثبت شد");
    assert.equal(scan.mobiles.length, 0);
    assert.ok(!scan.phones.some((p) => p.raw.includes("1404-05-12")));
  });

  it("returns empty lists for text with nothing in it", () => {
    const scan = scanContacts("سلام، حال شما چطور است؟");
    assert.deepEqual(scan, { emails: [], phones: [], urls: [], mobiles: [], landlines: [] });
  });

  it("unique() keeps the first occurrence and order", () => {
    const a = { value: "1", raw: "1", index: 0 };
    const b = { value: "2", raw: "2", index: 1 };
    const a2 = { value: "1", raw: "1", index: 5 };
    assert.deepEqual(unique([a, b, a2]).map((x) => x.value), ["1", "2"]);
  });
});

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
