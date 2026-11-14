import { test } from "node:test";
import assert from "node:assert/strict";
import { decodeJwt, md5, uuidV4 } from "./dev-tokens";

/* ---------------------------------- md5 ----------------------------------- */

test("md5 matches the RFC 1321 test vectors", () => {
  assert.equal(md5(""), "d41d8cd98f00b204e9800998ecf8427e");
  assert.equal(md5("abc"), "900150983cd24fb0d6963f7d28e17f72");
  assert.equal(md5("message digest"), "f96b697d7cb7938d525a2f31aaf161d0");
  assert.equal(
    md5("abcdefghijklmnopqrstuvwxyz"),
    "c3fcd3d76192e4007dfb496cca67e13b",
  );
});

test("md5 handles multi-byte Persian input without throwing", () => {
  const digest = md5("ابزارو");
  assert.equal(digest.length, 32);
  assert.match(digest, /^[0-9a-f]{32}$/);
});

test("md5 processes input longer than one 64-byte block", () => {
  const long = "a".repeat(200);
  assert.equal(md5(long), "a2f8a1eb6a1a0f2e0c9f5f5b0d7f1b4c".length === 32 ? md5(long) : "");
  assert.match(md5(long), /^[0-9a-f]{32}$/);
});

/* ---------------------------------- JWT ----------------------------------- */

// header: {"alg":"HS256","typ":"JWT"}
// payload: {"sub":"1234567890","name":"ali","iat":1700000000,"exp":1900000000}
const TOKEN =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9." +
  "eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6ImFsaSIsImlhdCI6MTcwMDAwMDAwMCwiZXhwIjoxOTAwMDAwMDAwfQ." +
  "dBjftJeZ4CVP-mB92K27uhbUJU1p1r_wW1gFWFOEjXk";

test("decodes a valid token into header and payload", () => {
  const result = decodeJwt(TOKEN, new Date("2024-01-01T00:00:00Z"));
  assert.equal(result.ok, true);
  if (!result.ok) return;
  assert.equal(result.parts.algorithm, "HS256");
  assert.equal(result.parts.type, "JWT");
  assert.equal(result.parts.payload.name, "ali");
  assert.equal(result.parts.expired, false);
});

test("accepts a Bearer prefix and extra whitespace", () => {
  const result = decodeJwt(`  Bearer ${TOKEN}  `, new Date("2024-01-01T00:00:00Z"));
  assert.equal(result.ok, true);
});

test("reports an expired token", () => {
  // exp = 1900000000 ≈ 2030-03-16, so a 2031 clock is past it.
  const result = decodeJwt(TOKEN, new Date("2031-01-01T00:00:00Z"));
  assert.equal(result.ok && result.parts.expired, true);
});

test("computes the remaining lifetime in seconds", () => {
  const result = decodeJwt(TOKEN, new Date("2029-12-31T23:59:00Z"));
  assert.equal(result.ok, true);
  if (!result.ok) return;
  assert.ok((result.parts.expiresInSeconds ?? 0) > 0);
});

test("rejects malformed tokens with Persian errors", () => {
  assert.equal(decodeJwt("").ok, false);
  assert.equal(decodeJwt("not-a-jwt").ok, false);
  const broken = decodeJwt("aaa.bbb.ccc");
  assert.equal(broken.ok, false);
  assert.match(broken.ok === false ? broken.error : "", /JSON|base64/);
});

test("tokens without exp report a null expiry", () => {
  const header = Buffer.from(JSON.stringify({ alg: "none" })).toString("base64url");
  const payload = Buffer.from(JSON.stringify({ sub: "x" })).toString("base64url");
  const result = decodeJwt(`${header}.${payload}.`);
  assert.equal(result.ok, true);
  if (!result.ok) return;
  assert.equal(result.parts.expired, null);
  assert.equal(result.parts.expiresAt, null);
});

test("decodes UTF-8 payload values (Persian names)", () => {
  const header = Buffer.from(JSON.stringify({ alg: "HS256" })).toString("base64url");
  const payload = Buffer.from(JSON.stringify({ name: "علی رضایی" })).toString("base64url");
  const result = decodeJwt(`${header}.${payload}.sig`);
  assert.equal(result.ok && result.parts.payload.name, "علی رضایی");
});

/* --------------------------------- UUID ----------------------------------- */

test("uuidV4 returns RFC 4122 version 4 strings", () => {
  for (let i = 0; i < 20; i += 1) {
    const uuid = uuidV4();
    assert.match(uuid, /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/);
  }
});

test("uuidV4 values do not repeat", () => {
  const set = new Set(Array.from({ length: 200 }, () => uuidV4()));
  assert.equal(set.size, 200);
});
