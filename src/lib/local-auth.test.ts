import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { AUTH_ERRORS, normaliseIdentifier, validateIdentifier } from "@/lib/local-auth";

describe("local-auth: identifier normalisation", () => {
  it("lower-cases and trims an email", () => {
    assert.equal(normaliseIdentifier("  Mehdi@Example.COM "), "mehdi@example.com");
  });

  it("treats a Persian-digit mobile as the same identifier", () => {
    assert.equal(normaliseIdentifier("۰۹۱۲۳۴۵۶۷۸۹"), "09123456789");
  });

  it("folds +98, 0098 and 9-prefixed numbers into one form", () => {
    const forms = ["09123456789", "+989123456789", "00989123456789", "9123456789"];
    const ids = forms.map(normaliseIdentifier);
    assert.equal(new Set(ids).size, 1, ids.join(" | "));
  });

  it("normalises separators inside a phone number", () => {
    assert.equal(normaliseIdentifier("0912 345 6789"), "09123456789");
  });
});

describe("local-auth: validation", () => {
  it("accepts a normal email", () => {
    assert.equal(validateIdentifier("name@example.com"), true);
  });

  it("rejects an email without a dot in the domain", () => {
    assert.equal(validateIdentifier("name@example"), false);
  });

  it("accepts an 11-digit mobile starting with zero", () => {
    assert.equal(validateIdentifier("09123456789"), true);
  });

  it("rejects a 10-digit number without the leading zero", () => {
    assert.equal(validateIdentifier("9123456789"), false);
  });

  it("rejects a local part with spaces", () => {
    assert.equal(validateIdentifier("a b@example.com"), false);
  });
});

describe("local-auth: error copy", () => {
  it("has a Persian message for every error code", () => {
    for (const [code, message] of Object.entries(AUTH_ERRORS)) {
      assert.ok(message.length > 5, code);
      assert.match(message, /[\u0600-\u06FF]/, `${code} is not Persian`);
    }
  });

  it("never claims the password is stored", () => {
    for (const message of Object.values(AUTH_ERRORS)) {
      assert.ok(!/ذخیره شد/.test(message));
    }
  });
});
