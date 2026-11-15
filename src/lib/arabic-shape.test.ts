import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  fixDigitOrder,
  normaliseArabic,
  prepareVisualText,
  shapeArabic,
} from "@/lib/arabic-shape";

/** Presentation forms the shaper is expected to emit. */
const P = {
  // م ه د ی (final)  →  ر ض ا ی ی
  mehdi: "ﻣﻬﺪﯼ",
  rezaei: "ﺭﺿﺎﯾﯽ",
  salam: "ﺳﻼﻡ",
  donya: "ﺩﻧﯿﺎ",
};

describe("arabic-shape: normalisation", () => {
  it("maps Arabic yeh/kaf to Persian", () => {
    assert.equal(normaliseArabic("ي"), "ی");
    assert.equal(normaliseArabic("ك"), "ک");
  });

  it("strips harakat", () => {
    assert.equal(normaliseArabic("مَدْرَسِه"), "مدرسه");
  });
});

describe("arabic-shape: joining", () => {
  it("uses initial, medial and final forms", () => {
    // سلام: س(initial) ل(medial) ا(final) م(final) — actually م is isolated-final
    assert.equal(shapeArabic("سلام"), P.salam);
  });

  it("keeps a non-joining final letter isolated after alef", () => {
    // دنیا ends in alef, which does not join forward
    assert.equal(shapeArabic("دنیا"), P.donya);
  });

  it("shapes a two-word phrase", () => {
    assert.equal(shapeArabic("مهدی"), P.mehdi);
    assert.equal(shapeArabic("رضایی"), P.rezaei);
  });

  it("forms the lam-alef ligature", () => {
    // لا is a single glyph, never two letters
    assert.equal([...shapeArabic("لا")].length, 1);
  });

  it("leaves Latin text alone", () => {
    assert.equal(shapeArabic("React 19"), "React 19");
  });

  it("does not shape digits", () => {
    assert.equal(shapeArabic("۱۴۰۵"), "۱۴۰۵");
  });
});

describe("arabic-shape: digit order", () => {
  it("reverses a Persian digit run so it survives the line flip", () => {
    assert.equal(fixDigitOrder("۲۵۰,۰۰۰"), "۰۰۰,۰۵۲");
  });

  it("reverses a Persian date as one run", () => {
    assert.equal(fixDigitOrder("۱۴۰۵/۰۸/۲۴"), "۴۲/۸۰/۵۰۴۱");
  });

  it("leaves an ASCII digit run alone (the run splitter already handles it)", () => {
    assert.equal(fixDigitOrder("1405/08/24"), "1405/08/24");
  });

  it("does not touch digits glued to a Latin letter", () => {
    assert.equal(fixDigitOrder("React ۱۹"), "React ۱۹");
  });
});

describe("arabic-shape: visual order", () => {
  it("reverses an RTL line into visual order", () => {
    assert.equal(prepareVisualText("سلام"), [...P.salam].reverse().join(""));
  });

  it("keeps a Latin tail at the left end", () => {
    const out = prepareVisualText("نام TypeScript");
    assert.ok(out.startsWith("TypeScript"), out);
  });

  it("keeps Persian digits readable", () => {
    const out = prepareVisualText("مبلغ ۲۵۰,۰۰۰ تومان");
    assert.ok(out.includes("۲۵۰,۰۰۰"), out);
  });

  it("keeps an ASCII date readable", () => {
    const out = prepareVisualText("تاریخ 1405/08/24");
    assert.ok(out.includes("1405/08/24"), out);
  });

  it("handles an empty string", () => {
    assert.equal(prepareVisualText(""), "");
  });

  it("leaves pure Latin untouched", () => {
    assert.equal(prepareVisualText("Hello world"), "Hello world");
  });
});
