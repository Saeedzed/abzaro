import { test } from "node:test";
import assert from "node:assert/strict";
import { PASSWORD_SETS, generatePassword, passwordStrength, passwordsMatch } from "./password";

/** Deterministic RNG so the tests describe behaviour, not luck. */
function seeded(seed: number): () => number {
  let state = seed >>> 0;
  return () => {
    state = (state * 1664525 + 1013904223) >>> 0;
    return state / 4294967296;
  };
}

test("generated password has the requested length", () => {
  const password = generatePassword({ length: 20, sets: ["lower", "upper", "digits"] }, seeded(1));
  assert.equal(password.length, 20);
});

test("every selected character set appears at least once", () => {
  const password = generatePassword(
    { length: 12, sets: ["lower", "upper", "digits", "symbols"] },
    seeded(7),
  );
  assert.match(password, /[a-z]/);
  assert.match(password, /[A-Z]/);
  assert.match(password, /[0-9]/);
  assert.match(password, /[^a-zA-Z0-9]/);
});

test("only characters from the allowed sets are used", () => {
  const allowed = new Set((PASSWORD_SETS.lower + PASSWORD_SETS.digits).split(""));
  const password = generatePassword({ length: 40, sets: ["lower", "digits"] }, seeded(3));
  assert.ok([...password].every((char) => allowed.has(char)));
});

test("ambiguous characters are never generated", () => {
  const password = generatePassword(
    { length: 60, sets: ["lower", "upper", "digits", "symbols"] },
    seeded(11),
  );
  assert.doesNotMatch(password, /[lI1O0o]/);
});

test("length is clamped to a sane range", () => {
  assert.equal(generatePassword({ length: 1, sets: ["lower"] }, seeded(2)).length, 4);
  assert.equal(generatePassword({ length: 500, sets: ["lower"] }, seeded(2)).length, 128);
});

test("strength grows with length", () => {
  const weak = passwordStrength("abcd");
  const strong = passwordStrength("aB3$xY9!kLm2#Qw7");
  assert.ok(strong.score > weak.score);
  assert.ok(strong.entropy > weak.entropy);
  assert.ok(["قوی", "خیلی قوی"].includes(strong.label));
});

test("passwordsMatch rejects empty and mismatched values", () => {
  assert.equal(passwordsMatch("", ""), false);
  assert.equal(passwordsMatch("abc", "abd"), false);
  assert.equal(passwordsMatch("abc", "abc"), true);
});
