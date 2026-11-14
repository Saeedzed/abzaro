/**
 * Persian text normalization helpers.
 *
 * Pure string functions — no DOM, no dependencies, fully testable.
 * Every transformation is opt-in so the cleaner stays predictable: the user
 * sees exactly which rules ran and how many characters each one touched.
 */

export interface CleanOptions {
  /** Arabic ي/ك → Persian ی/ک (and ٱ → ا). */
  normalizeArabicLetters: boolean;
  /** Arabic-Indic digits (٠-٩) and Latin digits → Persian digits (۰-۹). */
  persianDigits: boolean;
  /** Collapse runs of spaces/tabs and trim every line. */
  collapseSpaces: boolean;
  /** Remove spaces that sit before punctuation like «،» or «؟». */
  spaceBeforePunctuation: boolean;
  /** Strip invisible control marks (RLM, LRM, ZWJ, BOM, soft hyphen…). */
  removeInvisible: boolean;
  /** Collapse 3+ consecutive newlines into a single blank line. */
  collapseBlankLines: boolean;
}

export const defaultCleanOptions: CleanOptions = {
  normalizeArabicLetters: true,
  persianDigits: false,
  collapseSpaces: true,
  spaceBeforePunctuation: true,
  removeInvisible: true,
  collapseBlankLines: true,
};

export const cleanOptionLabels: Record<keyof CleanOptions, string> = {
  normalizeArabicLetters: "یکسان‌سازی «ی» و «ک» عربی",
  persianDigits: "تبدیل ارقام به فارسی",
  collapseSpaces: "حذف فاصله‌های اضافی",
  spaceBeforePunctuation: "حذف فاصله قبل از علائم",
  removeInvisible: "حذف کاراکترهای نامرئی",
  collapseBlankLines: "حذف خطوط خالی اضافی",
};

/** Invisible / directional formatting characters that break Persian text. */
const INVISIBLE = /[\u200B\u200E\u200F\u202A-\u202E\u2066-\u2069\uFEFF\u00AD]/g;
/** Punctuation that should never be preceded by a space in Persian. */
const PUNCT_BEFORE = /[ \t\u00A0]+([،؛,.!?:؟»\)\]])/g;
/** Multiple spaces or tabs (not newlines). */
const MULTI_SPACE = /[ \t\u00A0]{2,}/g;
/** Trailing/leading spaces on each line. */
const LINE_EDGE = /^[ \t\u00A0]+|[ \t\u00A0]+$/gm;
/** Three or more newlines. */
const MANY_BLANK_LINES = /\n[ \t]*\n[ \t]*\n+/g;

const ARABIC_DIGITS = "٠١٢٣٤٥٦٧٨٩";
const PERSIAN_DIGITS = "۰۱۲۳۴۵۶۷۸۹";

export interface CleanStats {
  arabicLetters: number;
  digits: number;
  extraSpaces: number;
  punctuationSpaces: number;
  invisible: number;
  blankLines: number;
  total: number;
}

export interface CleanResult {
  text: string;
  stats: CleanStats;
}

function countMatches(text: string, regex: RegExp): number {
  return text.match(new RegExp(regex.source, regex.flags.includes("g") ? regex.flags : `${regex.flags}g`))
    ?.length ?? 0;
}

/** Normalize Arabic letter variants used by Persian. */
export function normalizeArabicLetters(text: string): string {
  return text.replace(/[يكٱ]/g, (char) => {
    if (char === "ي") return "ی";
    if (char === "ك") return "ک";
    return "ا";
  });
}

/** Convert Arabic-Indic and Latin digits to Persian digits. */
export function toPersianDigitsOnly(text: string): string {
  return text.replace(/[0-9٠-٩]/g, (char) => {
    const arabicIndex = ARABIC_DIGITS.indexOf(char);
    if (arabicIndex >= 0) return PERSIAN_DIGITS[arabicIndex] ?? char;
    const latin = Number(char);
    return PERSIAN_DIGITS[latin] ?? char;
  });
}

/**
 * Clean Persian text according to the selected rules.
 * Returns the cleaned text plus a per-rule change count (based on the input,
 * which is what users intuitively expect to see).
 */
export function cleanPersianText(input: string, options: CleanOptions): CleanResult {
  const stats: CleanStats = {
    arabicLetters: 0,
    digits: 0,
    extraSpaces: 0,
    punctuationSpaces: 0,
    invisible: 0,
    blankLines: 0,
    total: 0,
  };

  if (!input) return { text: "", stats };

  let text = input;

  if (options.normalizeArabicLetters) {
    stats.arabicLetters = countMatches(text, /[يكٱ]/g);
    text = normalizeArabicLetters(text);
  }

  if (options.persianDigits) {
    stats.digits = countMatches(text, /[0-9٠-٩]/g);
    text = toPersianDigitsOnly(text);
  }

  if (options.removeInvisible) {
    stats.invisible = countMatches(text, INVISIBLE);
    text = text.replace(INVISIBLE, "");
  }

  if (options.spaceBeforePunctuation) {
    stats.punctuationSpaces = countMatches(text, PUNCT_BEFORE);
    text = text.replace(PUNCT_BEFORE, "$1");
  }

  if (options.collapseSpaces) {
    // Count runs that will actually shrink (2+ spaces inside a line) plus
    // lines that carry leading/trailing spaces.
    stats.extraSpaces =
      countMatches(text, MULTI_SPACE) +
      text.split("\n").filter((line) => line !== line.trim()).length;
    text = text.replace(MULTI_SPACE, " ").replace(LINE_EDGE, "");
  }

  if (options.collapseBlankLines) {
    stats.blankLines = countMatches(text, MANY_BLANK_LINES);
    text = text.replace(MANY_BLANK_LINES, "\n\n");
  }

  // Final overall trim — never leaves a leading/trailing newline behind.
  text = text.trim();

  stats.total =
    stats.arabicLetters +
    stats.digits +
    stats.extraSpaces +
    stats.punctuationSpaces +
    stats.invisible +
    stats.blankLines;

  return { text, stats };
}
