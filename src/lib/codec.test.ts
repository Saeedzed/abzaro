import { test } from "node:test";
import assert from "node:assert/strict";
import {
  decodeBase64,
  decodeUrl,
  encodeBase64,
  encodeUrl,
  escapeHtml,
  formatJson,
  looksLikeText,
  minifyJson,
  repairJson,
  sortJsonKeys,
  translateJsonError,
} from "./codec";

test("base64: round-trips ASCII and Persian text", () => {
  const samples = ["hello world", "ابزارو", "سلام دنیا ۱۲۳", "line1\nline2", "🎉 emoji"];
  for (const sample of samples) {
    const encoded = encodeBase64(sample);
    const decoded = decodeBase64(encoded);
    assert.equal(decoded.error, null);
    assert.equal(decoded.text, sample);
  }
});

test("base64: known value", () => {
  assert.equal(encodeBase64("ابزارو"), "2KfYqNiy2KfYsdmI");
  assert.equal(encodeBase64("a"), "YQ==");
});

test("base64: tolerates missing padding and URL-safe characters", () => {
  assert.equal(decodeBase64("YQ").text, "a");
  assert.equal(decodeBase64("YQ==").text, "a");
  assert.equal(decodeBase64("-_-_").error, null);
  assert.equal(decodeBase64("").text, "");
});

test("base64: rejects invalid input", () => {
  const result = decodeBase64("a$b#c");
  assert.notEqual(result.error, null);
  assert.equal(result.text, "");
});

test("looksLikeText: detects binary junk", () => {
  assert.equal(looksLikeText("سلام"), true);
  assert.equal(looksLikeText("\u0000\u0001"), false);
});

test("url: encode/decode round-trip in both modes", () => {
  const text = "سلام دنیا & test?a=1";
  for (const mode of ["component", "uri", "safe"] as const) {
    const encoded = encodeUrl(text, mode);
    assert.equal(encoded.error, null);
    const decoded = decodeUrl(encoded.value, mode === "uri" ? "uri" : "component");
    assert.equal(decoded.value, text);
  }
});

test("url: encodeURI keeps separators, encodeURIComponent does not", () => {
  assert.equal(encodeUrl("a b/c", "uri").value, "a%20b/c");
  assert.equal(encodeUrl("a b/c", "safe").value, "a%20b%2Fc");
});

test("url: rejects a malformed escape", () => {
  assert.notEqual(decodeUrl("%E0%A4%A", "safe").error, null);
});

test("json: pretty prints with 2 spaces and reports metadata", () => {
  const result = formatJson('{"a":1,"b":[1,2,3]}');
  assert.equal(result.error, null);
  assert.equal(result.formatted, '{\n  "a": 1,\n  "b": [\n    1,\n    2,\n    3\n  ]\n}');
  assert.equal(result.meta?.keys, 2); // "a" and "b"
  assert.equal(result.meta?.arrays, 1);
  assert.equal(result.meta?.values, 4); // 1, 1, 2, 3
  assert.equal(result.meta?.depth, 2);
});

test("json: tab indent works", () => {
  const result = formatJson('{"a":1}', "tab");
  assert.equal(result.formatted, '{\n\t"a": 1\n}');
});

test("json: reports line and column for invalid input", () => {
  const result = formatJson('{\n  "a": 1\n  "b": 2\n}');
  assert.notEqual(result.error, null);
  assert.equal(result.line, 3);
  assert.ok((result.column ?? 0) > 0);
});

test("json: repairJson rewrites JS literals but leaves valid JSON alone", () => {
  assert.equal(repairJson('{"a": 1}'), '{"a": 1}');
  assert.equal(repairJson("{'a': 'b',}"), '{"a": "b"}');
  assert.equal(repairJson("{a: 1, b: 2}"), '{"a": 1, "b": 2}');
  assert.equal(repairJson("{'name': 'ابزارو' , 'id': 3}"), '{"name": "ابزارو" , "id": 3}');
  assert.equal(repairJson("{'tags': ['a', 'b',],}"), '{"tags": ["a", "b"]}');
});

test("json: translateJsonError is Persian and never leaks English", () => {
  const persian = /[\u0600-\u06FF]/;
  assert.ok(persian.test(translateJsonError("Unexpected end of JSON input")));
  assert.ok(persian.test(translateJsonError("Unexpected token } in JSON")));
  assert.ok(persian.test(translateJsonError("Expected property name")));
});

test("json: empty input is not an error", () => {
  assert.deepEqual(formatJson("  "), { formatted: "", error: null });
  assert.deepEqual(minifyJson(""), { formatted: "", error: null });
});

test("json: repair fixes trailing commas and single quotes", () => {
  const broken = "{'name': 'ابزارو', 'tags': ['a', 'b',],}";
  assert.notEqual(formatJson(broken).error, null);
  const repaired = formatJson(broken, 2, true);
  assert.equal(repaired.error, null);
  assert.match(repaired.formatted, /"name": "ابزارو"/);
  assert.match(repaired.formatted, /"tags"/);
});

test("json: repair handles a BOM and unquoted keys", () => {
  const repaired = formatJson('\uFEFF{name: "abzaro"}', 2, true);
  assert.equal(repaired.error, null);
  assert.equal(repaired.formatted, '{\n  "name": "abzaro"\n}');
});

test("json: minify strips all whitespace", () => {
  const result = minifyJson('{\n  "a": 1 ,\n  "b": [ 1, 2 ]\n}');
  assert.equal(result.error, null);
  assert.equal(result.formatted, '{"a":1,"b":[1,2]}');
});

test("json: sortJsonKeys sorts recursively but keeps array order", () => {
  const result = sortJsonKeys('{"z":1,"a":{"y":2,"b":3},"list":[3,1,2]}');
  assert.equal(result.error, null);
  assert.equal(
    result.formatted,
    '{\n  "a": {\n    "b": 3,\n    "y": 2\n  },\n  "list": [\n    3,\n    1,\n    2\n  ],\n  "z": 1\n}',
  );
});

test("escapeHtml escapes all five entities", () => {
  assert.equal(
    escapeHtml('<a href="x">&\'</a>'),
    "&lt;a href=&quot;x&quot;&gt;&amp;&#39;&lt;/a&gt;",
  );
});
