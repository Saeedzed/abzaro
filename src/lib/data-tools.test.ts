import { test } from "node:test";
import assert from "node:assert/strict";
import {
  csvToJson,
  detectDelimiter,
  hslToRgb,
  jsonToCsv,
  parseCsv,
  parseHex,
  parseTimestamp,
  readableTextColor,
  rgbToHex,
  rgbToHsl,
} from "./data-tools";

test("parseCsv keeps quoted commas and newlines inside one field", () => {
  const { headers, rows } = parseCsv('نام,توضیح\nسعید,"تهران, ونک"\nمریم,"خط اول\nخط دوم"');
  assert.deepEqual(headers, ["نام", "توضیح"]);
  assert.equal(rows.length, 2);
  assert.equal(rows[0]?.[1], "تهران, ونک");
  assert.equal(rows[1]?.[1], "خط اول\nخط دوم");
});

test("parseCsv handles doubled quotes", () => {
  const { rows } = parseCsv('a\n"او گفت ""سلام"""');
  assert.equal(rows[0]?.[0], 'او گفت "سلام"');
});

test("detectDelimiter picks the most frequent candidate", () => {
  assert.equal(detectDelimiter("a;b;c\n1;2;3"), ";");
  assert.equal(detectDelimiter("a,b,c\n1,2,3"), ",");
  assert.equal(detectDelimiter("a\tb\tc"), "\t");
});

test("csvToJson coerces numbers, booleans and null", () => {
  const json = csvToJson("name,age,active,note\nAli,32,true,");
  assert.deepEqual(json, [{ name: "Ali", age: 32, active: true, note: "" }]);
});

test("jsonToCsv escapes separators and quotes", () => {
  const csv = jsonToCsv([{ a: "x,y", b: 'say "hi"' }]);
  assert.equal(csv, 'a,b\n"x,y","say ""hi"""');
});

test("jsonToCsv flattens nested objects to JSON text", () => {
  const csv = jsonToCsv([{ a: { b: 1 } }]);
  assert.equal(csv, 'a\n"{""b"":1}"');
});

test("jsonToCsv round-trips Persian headers", () => {
  const csv = jsonToCsv([{ نام: "سعید", شهر: "تهران" }]);
  const back = csvToJson(csv);
  assert.deepEqual(back, [{ نام: "سعید", شهر: "تهران" }]);
});

test("parseTimestamp understands seconds and milliseconds", () => {
  assert.equal(parseTimestamp("1704067200"), 1704067200000);
  assert.equal(parseTimestamp("1704067200000"), 1704067200000);
  assert.equal(parseTimestamp("", "auto"), null);
  assert.equal(parseTimestamp("not-a-number"), null);
});

test("parseTimestamp can be forced to a unit", () => {
  assert.equal(parseTimestamp("1704067200", "ms"), 1704067200);
});

test("parseHex accepts 3 and 6 digit codes", () => {
  assert.deepEqual(parseHex("#fff"), { r: 255, g: 255, b: 255 });
  assert.deepEqual(parseHex("2563eb"), { r: 37, g: 99, b: 235 });
  assert.equal(parseHex("#12345"), null);
  assert.equal(parseHex("zzz"), null);
});

test("rgbToHex clamps and pads", () => {
  assert.equal(rgbToHex({ r: 37, g: 99, b: 235 }), "#2563eb");
  assert.equal(rgbToHex({ r: 300, g: -5, b: 0 }), "#ff0000");
});

test("RGB ↔ HSL round-trips for the brand blue", () => {
  const hsl = rgbToHsl({ r: 37, g: 99, b: 235 });
  assert.equal(hsl.h, 221);
  assert.equal(hsl.s, 83);
  assert.equal(hsl.l, 53);
  // HSL is rounded to integers, so allow ±2 of drift on the way back.
  const back = hslToRgb(hsl);
  assert.ok(Math.abs(back.r - 37) <= 2);
  assert.ok(Math.abs(back.g - 99) <= 2);
  assert.ok(Math.abs(back.b - 235) <= 2);
});

test("hslToRgb handles greys and full saturation", () => {
  assert.deepEqual(hslToRgb({ h: 0, s: 0, l: 50 }), { r: 128, g: 128, b: 128 });
  assert.deepEqual(hslToRgb({ h: 0, s: 100, l: 50 }), { r: 255, g: 0, b: 0 });
  assert.deepEqual(hslToRgb({ h: 120, s: 100, l: 50 }), { r: 0, g: 255, b: 0 });
});

test("readableTextColor picks dark text on light backgrounds", () => {
  assert.equal(readableTextColor({ r: 255, g: 255, b: 255 }), "#111827");
  assert.equal(readableTextColor({ r: 0, g: 0, b: 0 }), "#ffffff");
});
