import { test } from "node:test";
import assert from "node:assert/strict";
import { numberToPersianWords } from "./number-to-words";

test("single digits", () => {
  assert.equal(numberToPersianWords("0").words, "صفر");
  assert.equal(numberToPersianWords("1").words, "یک");
  assert.equal(numberToPersianWords("9").words, "نه");
});

test("teens use the fused forms", () => {
  assert.equal(numberToPersianWords("11").words, "یازده");
  assert.equal(numberToPersianWords("15").words, "پانزده");
  assert.equal(numberToPersianWords("19").words, "نوزده");
});

test("tens and hundreds join with و", () => {
  assert.equal(numberToPersianWords("21").words, "بیست و یک");
  assert.equal(numberToPersianWords("99").words, "نود و نه");
  assert.equal(numberToPersianWords("100").words, "یکصد");
  assert.equal(numberToPersianWords("345").words, "سیصد و چهل و پنج");
});

test("thousand: 1000 is «هزار» without «یک»", () => {
  assert.equal(numberToPersianWords("1000").words, "هزار");
  assert.equal(numberToPersianWords("1001").words, "هزار و یک");
  assert.equal(numberToPersianWords("2500").words, "دو هزار و پانصد");
});

test("million and billion", () => {
  assert.equal(numberToPersianWords("1000000").words, "یک میلیون");
  assert.equal(numberToPersianWords("1234567").words, "یک میلیون و دویست و سی و چهار هزار و پانصد و شصت و هفت");
  assert.equal(numberToPersianWords("1000000000").words, "یک میلیارد");
});

test("banknote-style amount", () => {
  assert.equal(
    numberToPersianWords("1250000").words,
    "یک میلیون و دویست و پنجاه هزار",
  );
});

test("Persian digits in the input are accepted", () => {
  assert.equal(numberToPersianWords("۱۲۳").words, "یکصد و بیست و سه");
});

test("thousands separators are ignored", () => {
  assert.equal(numberToPersianWords("1,234,567").words, numberToPersianWords("1234567").words);
  assert.equal(numberToPersianWords("۱٬۲۳۴").words, "هزار و دویست و سی و چهار");
});

test("decimals are read digit by digit after «ممیز»", () => {
  assert.equal(numberToPersianWords("12.5").words, "دوازده ممیز پنج");
  assert.equal(numberToPersianWords("3.14").words, "سه ممیز یک و چهار");
});

test("negative numbers get «منفی»", () => {
  assert.equal(numberToPersianWords("-250").words, "منفی دویست و پنجاه");
});

test("invalid input returns an error", () => {
  assert.equal(numberToPersianWords("abc").ok, false);
  assert.equal(numberToPersianWords("").ok, false);
  assert.equal(numberToPersianWords("1..2").ok, false);
  assert.ok(numberToPersianWords("12a").error);
});

test("number beyond the supported range is rejected", () => {
  assert.equal(numberToPersianWords("1".repeat(25)).ok, false);
});
