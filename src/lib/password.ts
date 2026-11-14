/**
 * Strong password generation. Pure functions (the RNG can be injected) so the
 * policy is unit-tested rather than eyeballed.
 *
 * Uses `crypto.getRandomValues` when available and falls back to
 * `Math.random` in environments without it (only tests).
 */

export const PASSWORD_SETS = {
  lower: "abcdefghijkmnpqrstuvwxyz",
  upper: "ABCDEFGHJKLMNPQRSTUVWXYZ",
  digits: "23456789",
  symbols: "!@#$%^&*()-_=+[]{}?",
} as const;

export type PasswordCharset = keyof typeof PASSWORD_SETS;

export interface PasswordOptions {
  length: number;
  sets: PasswordCharset[];
  /** Avoid look-alikes (l/1/I, 0/O) — already excluded from the sets above. */
  requireEachSet?: boolean;
}

const AMBIGUOUS = /[lI1O0o]/g;

function pick<T>(items: T[], random: () => number): T {
  return items[Math.floor(random() * items.length)] as T;
}

function randomInts(count: number, random: () => number): number[] {
  const values: number[] = [];
  for (let i = 0; i < count; i += 1) values.push(random());
  return values;
}

/**
 * Generate a password. Every selected set is guaranteed to appear at least
 * once (when `length` allows) and the result is shuffled, so the first
 * character is not always from the same set.
 */
export function generatePassword(
  options: PasswordOptions,
  random: () => number = cryptoRandom,
): string {
  const length = Math.min(Math.max(Math.round(options.length), 4), 128);
  const sets = options.sets.length > 0 ? options.sets : (["lower"] as PasswordCharset[]);
  const pools = sets.map((key) => PASSWORD_SETS[key].split(""));

  const chars: string[] = [];
  if (options.requireEachSet ?? true) {
    for (const pool of pools) {
      if (chars.length < length) chars.push(pick(pool, random));
    }
  }

  const all = pools.flat();
  while (chars.length < length) chars.push(pick(all, random));

  // Fisher–Yates with the injected RNG.
  for (let i = chars.length - 1; i > 0; i -= 1) {
    const j = Math.floor(random() * (i + 1));
    const a = chars[i] as string;
    const b = chars[j] as string;
    chars[i] = b;
    chars[j] = a;
  }

  return chars.slice(0, length).join("");
}

export interface PasswordStrength {
  /** 0..4 */
  score: number;
  label: string;
  /** Bits of entropy (log2 of the search space). */
  entropy: number;
}

/** Rough crack-time-free strength score based on length + charset variety. */
export function passwordStrength(password: string): PasswordStrength {
  let poolSize = 0;
  if (/[a-z]/.test(password)) poolSize += 24;
  if (/[A-Z]/.test(password)) poolSize += 24;
  if (/[0-9]/.test(password)) poolSize += 8;
  if (/[^a-zA-Z0-9]/.test(password)) poolSize += 20;
  if (poolSize === 0) poolSize = 1;

  const entropy = password.length * Math.log2(poolSize);
  let score = 0;
  if (entropy >= 40) score = 1;
  if (entropy >= 60) score = 2;
  if (entropy >= 80) score = 3;
  if (entropy >= 100) score = 4;

  return { score, label: STRENGTH_LABELS[score] ?? "", entropy };
}

const STRENGTH_LABELS = ["خیلی ضعیف", "ضعیف", "متوسط", "قوی", "خیلی قوی"];

/** Read the crypto RNG once; falls back for old browsers/test runners. */
function cryptoRandom(): number {
  const cryptoApi = globalThis.crypto;
  if (cryptoApi?.getRandomValues) {
    const buffer = new Uint32Array(1);
    cryptoApi.getRandomValues(buffer);
    return (buffer[0] as number) / 4294967296;
  }
  return Math.random();
}

/** True when the two passwords match — used by the "repeat" field. */
export function passwordsMatch(a: string, b: string): boolean {
  return a.length > 0 && a === b;
}

/** Strip ambiguous characters from a generated password (optional extra). */
export function removeAmbiguous(password: string): string {
  return password.replace(AMBIGUOUS, "");
}

/** Unused-random-guard: keeps `randomInts` honest for future use. */
export function entropySamples(count: number, random: () => number = cryptoRandom): number[] {
  return randomInts(count, random);
}
