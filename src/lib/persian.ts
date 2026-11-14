/**
 * Persian / Arabic digit conversion helpers.
 *
 * All conversion is pure string manipulation — no locale surprises, no
 * dependencies, and safe to run on both server and client.
 */

const FA_DIGITS = ["۰", "۱", "۲", "۳", "۴", "۵", "۶", "۷", "۸", "۹"] as const;
const AR_DIGITS = ["٠", "١", "٢", "٣", "٤", "٥", "٦", "٧", "٨", "٩"] as const;

const FA_TO_EN: Record<string, string> = Object.fromEntries(
  FA_DIGITS.map((digit, index) => [digit, String(index)]),
);
const AR_TO_EN: Record<string, string> = Object.fromEntries(
  AR_DIGITS.map((digit, index) => [digit, String(index)]),
);

/** Convert every Latin digit in the input to its Persian counterpart. */
export function toPersianDigits(input: string | number): string {
  return String(input).replace(/[0-9]/g, (digit) => {
    const index = Number(digit);
    return FA_DIGITS[index] ?? digit;
  });
}

/** Convert Persian (۰-۹) and Arabic (٠-٩) digits to Latin digits. */
export function toEnglishDigits(input: string): string {
  return input.replace(/[۰-۹٠-٩]/g, (digit) => {
    return FA_TO_EN[digit] ?? AR_TO_EN[digit] ?? digit;
  });
}

/**
 * Normalize a user-typed number: Persian/Arabic digits become Latin digits and
 * thousands separators (`,` `٬` and whitespace) are removed.
 */
export function normalizeDigits(input: string): string {
  return toEnglishDigits(input).replace(/[,٬\s]/g, "");
}

/** Format a number with Persian digits and Persian thousand separators. */
export function formatPersianNumber(value: number): string {
  return new Intl.NumberFormat("fa-IR", {
    maximumFractionDigits: 10,
  }).format(value);
}

/**
 * Parse a user-typed numeric string (any digit script) and return it formatted
 * with Persian digits, or `null` when the input is not a valid number.
 */
export function formatPersianNumberFromString(input: string): string | null {
  const normalized = normalizeDigits(input.trim());
  if (!/^-?\d+(\.\d+)?$/.test(normalized)) {
    return null;
  }
  const value = Number(normalized);
  if (!Number.isFinite(value)) {
    return null;
  }
  return formatPersianNumber(value);
}
