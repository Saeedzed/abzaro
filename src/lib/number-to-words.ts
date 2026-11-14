/**
 * Convert numbers to their Persian word form.
 *
 * Pure functions — no locale APIs, fully deterministic and testable.
 * Supports integers up to 10^18 and decimals (read digit-by-digit after «ممیز»),
 * which is what invoice / cheque forms need.
 */

const YEKAN = ["", "یک", "دو", "سه", "چهار", "پنج", "شش", "هفت", "هشت", "نه"] as const;
const DAHGAN = [
  "",
  "",
  "بیست",
  "سی",
  "چهل",
  "پنجاه",
  "شصت",
  "هفتاد",
  "هشتاد",
  "نود",
] as const;
const SADGAN = [
  "",
  "یکصد",
  "دویست",
  "سیصد",
  "چهارصد",
  "پانصد",
  "ششصد",
  "هفتصد",
  "هشتصد",
  "نهصد",
] as const;
const DAH_TA_NUZDAH = [
  "ده",
  "یازده",
  "دوازده",
  "سیزده",
  "چهارده",
  "پانزده",
  "شانزده",
  "هفده",
  "هجده",
  "نوزده",
] as const;

/** Scale names for each group of three digits. */
const SCALES = [
  "",
  "هزار",
  "میلیون",
  "میلیارد",
  "بیلیون",
  "بیلیارد",
  "تریلیون",
] as const;

/** Max integer digits we can name (6 groups of 3 = 10^18). */
export const MAX_INTEGER_DIGITS = 19;

/** Convert 0–999 to Persian words. */
function threeDigitsToWords(value: number): string {
  const parts: string[] = [];
  const hundreds = Math.floor(value / 100);
  const rest = value % 100;

  if (hundreds > 0) parts.push(SADGAN[hundreds] ?? "");

  if (rest >= 10 && rest < 20) {
    parts.push(DAH_TA_NUZDAH[rest - 10] ?? "");
  } else {
    const tens = Math.floor(rest / 10);
    const ones = rest % 10;
    if (tens > 0) parts.push(DAHGAN[tens] ?? "");
    if (ones > 0) parts.push(YEKAN[ones] ?? "");
  }

  return parts.filter(Boolean).join(" و ");
}

/** Convert a non-negative integer string to Persian words. */
function integerToWords(digits: string): string {
  const trimmed = digits.replace(/^0+(?=\d)/, "");
  if (trimmed === "0" || trimmed === "") return "صفر";

  const groups: string[] = [];
  for (let end = trimmed.length; end > 0; end -= 3) {
    groups.push(trimmed.slice(Math.max(0, end - 3), end));
  }

  const parts: string[] = [];
  for (let index = groups.length - 1; index >= 0; index--) {
    const group = groups[index] ?? "0";
    const value = Number(group);
    if (value === 0) continue;

    const scale = SCALES[index] ?? "";
    // «۱۰۰۰» reads as «هزار», not «یک هزار».
    if (value === 1 && index === 1) {
      parts.push(scale);
      continue;
    }
    const words = threeDigitsToWords(value);
    parts.push(scale ? `${words} ${scale}` : words);
  }

  return parts.join(" و ");
}

export interface NumberToWordsResult {
  ok: boolean;
  words: string;
  error?: string;
}

/**
 * Convert a numeric string (Latin or Persian digits, optional minus sign and
 * decimal point) to Persian words.
 */
export function numberToPersianWords(input: string): NumberToWordsResult {
  const raw = input.trim();
  if (!raw) {
    return { ok: false, words: "", error: "عددی وارد کنید." };
  }

  // Persian/Arabic digits → Latin, drop thousands separators and thin spaces.
  const normalized = raw
    .replace(/[۰-۹]/g, (d) => String("۰۱۲۳۴۵۶۷۸۹".indexOf(d)))
    .replace(/[٠-٩]/g, (d) => String("٠١٢٣٤٥٦٧٨٩".indexOf(d)))
    .replace(/[,٬\s]/g, "");

  if (!/^-?\d+(\.\d+)?$/.test(normalized)) {
    return { ok: false, words: "", error: "فقط رقم وارد کنید (بدون حرف یا علامت اضافه)." };
  }

  const negative = normalized.startsWith("-");
  const unsigned = negative ? normalized.slice(1) : normalized;
  const [integerPartRaw = "0", decimalPart] = unsigned.split(".");

  if (integerPartRaw.replace(/^0+/, "").length > MAX_INTEGER_DIGITS) {
    return { ok: false, words: "", error: "عدد بیش از حد بزرگ است." };
  }

  let words = integerToWords(integerPartRaw);

  if (decimalPart) {
    const decimalWords = decimalPart
      .split("")
      .map((digit) => {
        const value = Number(digit);
        return value === 0 ? "صفر" : (YEKAN[value] ?? "");
      })
      .join(" و ");
    words = `${words} ممیز ${decimalWords}`;
  }

  return { ok: true, words: negative ? `منفی ${words}` : words };
}

/** Convert a JS number to Persian words (convenience wrapper). */
export function numberToWords(value: number): string {
  return numberToPersianWords(String(value)).words;
}
