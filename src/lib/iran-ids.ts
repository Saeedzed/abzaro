/**
 * Iranian identifier validation and normalisation.
 *
 * Everything here is pure and synchronous so it can be unit-tested without a
 * browser, and so the tools never need a network round-trip.
 *
 * Two ideas run through the whole file:
 *  - **Normalise first, validate second.** Users paste numbers with Persian or
 *    Arabic-Indic digits, ZWNJ, spaces and dashes. `normalizeDigits` folds all of
 *    that into ASCII before any checksum is computed.
 *  - **Report *why* it failed.** A checksum is not a useful answer to a human;
 *    "رقم کنترل درست نیست" is.
 */

/** Map Persian (۰-۹) and Arabic-Indic (٠-٩) digits to ASCII, drop separators. */
export function normalizeDigits(input: string): string {
  return input
    .replace(/[۰-۹]/g, (d) => String(d.charCodeAt(0) - 0x06f0))
    .replace(/[٠-٩]/g, (d) => String(d.charCodeAt(0) - 0x0660))
    .replace(/[\s\u200c\u200f\u200e\-_.]/g, "");
}

/** Persian letters that look different but are the same character for plates. */
const PLATE_LETTERS = "ابپتثجچحخدذرزژسشصضطظعغفقکگلمنوهی";

export interface CheckResult {
  ok: boolean;
  /** Normalised value (digits folded, separators removed) — show this back. */
  value: string;
  /** Human-readable Persian reason when `ok` is false. */
  error: string | null;
  /** Extra facts extracted for display (city, bank, province…). */
  meta?: Record<string, string>;
}

/* ─────────────────────────── کد ملی (10 digits) ─────────────────────────── */

/**
 * Iranian national ID: 10 digits, last one is a check digit.
 *
 *   sum = Σ d[i] × (10 − i)  for i = 0..8
 *   r   = sum % 11
 *   check digit must equal r if r < 2, else 11 − r
 *
 * Also rejects the obvious fake IDs where all ten digits are identical — the
 * checksum happens to pass for those, so every validator special-cases them.
 */
export function validateNationalId(raw: string): CheckResult {
  const value = normalizeDigits(raw);
  if (value.length === 0) return { ok: false, value, error: "کد ملی را وارد کنید." };
  if (!/^\d{10}$/.test(value)) {
    return { ok: false, value, error: "کد ملی باید دقیقاً ۱۰ رقم باشد." };
  }
  if (/^(\d)\1{9}$/.test(value)) {
    return { ok: false, value, error: "کد ملی ۱۱۱۱۱۱۱۱۱۱ معتبر نیست." };
  }
  const sum = value
    .slice(0, 9)
    .split("")
    .reduce((acc, digit, index) => acc + Number(digit) * (10 - index), 0);
  const remainder = sum % 11;
  const expected = remainder < 2 ? remainder : 11 - remainder;
  const check = Number(value[9]);
  if (check !== expected) {
    return { ok: false, value, error: "رقم کنترل درست نیست؛ احتمالاً یکی از ارقام اشتباه تایپ شده." };
  }
  return { ok: true, value, error: null };
}

/** Convenience boolean for other tools/tests. */
export function isValidNationalId(raw: string): boolean {
  return validateNationalId(raw).ok;
}

/* ──────────────────────────── شمارهٔ موبایل ──────────────────────────── */

/**
 * Iranian mobiles are always 09x. The 0x1x / 0x2x–0x3x numbers that look similar
 * are landline area codes (021 Tehran, 031 Isfahan…), so they are deliberately
 * *not* in this list — a landline must fail validation.
 */
const MOBILE_PREFIXES = ["90", "91", "92", "93", "94", "95", "96", "97", "98", "99"];

/**
 * Iranian mobile numbers: `09xxxxxxxxx` (11 digits).
 * Accepts +98 / 0098 / 98 / 9xxxxxxxxx prefixes and returns the canonical
 * `09xxxxxxxxx` form, because that is what every Persian form expects.
 */
export function normalizeMobile(raw: string): { value: string; error: string | null } {
  let value = normalizeDigits(raw).replace(/^\+/, "");
  if (value.startsWith("0098")) value = value.slice(4);
  else if (value.startsWith("98") && value.length === 12) value = value.slice(2);
  if (value.length === 10 && value.startsWith("9")) value = `0${value}`;
  if (value.length === 0) return { value, error: "شمارهٔ موبایل را وارد کنید." };
  if (!/^0\d{10}$/.test(value)) {
    return { value, error: "شمارهٔ موبایل باید ۱۱ رقم و با ۰۹ شروع شود." };
  }
  if (!MOBILE_PREFIXES.includes(value.slice(1, 3))) {
    return { value, error: "پیش‌شمارهٔ موبایل شناخته‌شده نیست (۰۹۱x، ۰۹۳x، ۰۹۹x…)." };
  }
  return { value, error: null };
}

export function validateMobile(raw: string): CheckResult {
  const { value, error } = normalizeMobile(raw);
  return { ok: error === null, value, error };
}

/** Operator name for a normalised mobile number. */
export function mobileOperator(normalized: string): string {
  if (!/^09\d{9}$/.test(normalized)) return "نامشخص";
  const prefix = normalized.slice(1, 4);
  if (["901", "902", "903", "904", "905", "941"].includes(prefix)) return "ایرانسل";
  if (["910", "911", "912", "913", "914", "915", "916", "917", "918", "919", "990", "991", "992", "993", "994", "995", "996"].includes(prefix)) return "همراه اول";
  if (["930", "931", "932", "933", "934", "935", "936", "937", "938", "939", "920", "921", "922"].includes(prefix)) return "رایتل";
  if (["998", "999", "900", "909", "908"].includes(prefix)) return "شاتل موبایل / سایر";
  return "اپراتور مجازی یا نامشخص";
}

/* ───────────────────────── کارت بانکی (Luhn) ───────────────────────── */

const BANK_BINS: Array<{ prefix: string; bank: string }> = [
  { prefix: "636214", bank: "بانک آینده" },
  { prefix: "636949", bank: "بانک حکمت ایرانیان" },
  { prefix: "639370", bank: "بانک مهراقتصاد" },
  { prefix: "639347", bank: "بانک پاسارگاد" },
  { prefix: "627412", bank: "بانک اقتصاد نوین" },
  { prefix: "627381", bank: "بانک انصار" },
  { prefix: "505785", bank: "بانک ایران زمین" },
  { prefix: "622106", bank: "بانک پارسیان" },
  { prefix: "627884", bank: "بانک پارسیان" },
  { prefix: "639194", bank: "بانک پارسیان" },
  { prefix: "502229", bank: "بانک پاسارگاد" },
  { prefix: "639347", bank: "بانک پاسارگاد" },
  { prefix: "627760", bank: "پست بانک ایران" },
  { prefix: "502938", bank: "بانک تجارت" },
  { prefix: "585983", bank: "بانک تجارت" },
  { prefix: "627353", bank: "بانک تجارت" },
  { prefix: "589463", bank: "بانک رفاه کارگران" },
  { prefix: "621986", bank: "بانک سامان" },
  { prefix: "639346", bank: "بانک سینا" },
  { prefix: "639607", bank: "بانک سرمایه" },
  { prefix: "636795", bank: "بانک شهر" },
  { prefix: "502806", bank: "بانک شهر" },
  { prefix: "504706", bank: "بانک شهر" },
  { prefix: "603769", bank: "بانک صادرات" },
  { prefix: "627648", bank: "بانک صادرات" },
  { prefix: "603770", bank: "بانک کشاورزی" },
  { prefix: "639217", bank: "بانک کشاورزی" },
  { prefix: "628023", bank: "بانک مسکن" },
  { prefix: "639599", bank: "بانک قوامین" },
  { prefix: "639604", bank: "بانک قرض‌الحسنه مهر ایران" },
  { prefix: "627488", bank: "بانک کارآفرین" },
  { prefix: "502910", bank: "بانک کارآفرین" },
  { prefix: "639369", bank: "بانک گردشگری" },
  { prefix: "636901", bank: "بانک قرض‌الحسنه مهر ایران" },
  { prefix: "627961", bank: "بانک صنعت و معدن" },
  { prefix: "639371", bank: "بانک دی" },
  { prefix: "505416", bank: "بانک دی" },
  { prefix: "627393", bank: "بانک توسعهٔ تعاون" },
  { prefix: "639186", bank: "بانک توسعهٔ تعاون" },
  { prefix: "636785", bank: "بانک رفاه کارگران" },
  { prefix: "610433", bank: "بانک ملت" },
  { prefix: "991020", bank: "بانک ملت" },
  { prefix: "603799", bank: "بانک ملی ایران" },
  { prefix: "603798", bank: "بانک ملی ایران" },
];

/** Luhn mod-10: double every second digit from the right, sum digits, ≡ 0 mod 10. */
export function luhnCheck(digits: string): boolean {
  if (!/^\d+$/.test(digits)) return false;
  let sum = 0;
  let double = false;
  for (let i = digits.length - 1; i >= 0; i -= 1) {
    let digit = Number(digits[i]);
    if (double) {
      digit *= 2;
      if (digit > 9) digit -= 9;
    }
    sum += digit;
    double = !double;
  }
  return sum % 10 === 0;
}

export function validateBankCard(raw: string): CheckResult {
  const value = normalizeDigits(raw);
  if (value.length === 0) return { ok: false, value, error: "شمارهٔ کارت را وارد کنید." };
  if (!/^\d{16}$/.test(value)) {
    return { ok: false, value, error: "شمارهٔ کارت باید ۱۶ رقم باشد." };
  }
  if (!luhnCheck(value)) {
    return { ok: false, value, error: "شمارهٔ کارت با الگوریتم Luhn معتبر نیست؛ رقمی اشتباه است." };
  }
  const bin = value.slice(0, 6);
  const match = BANK_BINS.filter((item) => item.prefix === bin).at(0);
  return {
    ok: true,
    value,
    error: null,
    meta: { bank: match?.bank ?? "بانک ناشناخته (شماره از نظر ساختاری درست است)" },
  };
}

/** 6037 9912 3456 7890 style grouping for display. */
export function groupCard(value: string): string {
  return value.replace(/(\d{4})(?=\d)/g, "$1 ");
}

/* ─────────────────────────────── شبا (IBAN) ─────────────────────────────── */

/**
 * Iranian IBAN (شبا): `IR` + 24 digits. Total length 26 chars.
 * Mod-97 (ISO 13616): move the first 4 chars to the end, map IR → 18 27,
 * then the whole number mod 97 must equal 1.
 */
export function validateSheba(raw: string): CheckResult {
  const cleaned = normalizeDigits(raw).toUpperCase().replace(/[^0-9A-Z]/g, "");
  if (cleaned.length === 0) return { ok: false, value: cleaned, error: "شمارهٔ شبا را وارد کنید." };
  if (!cleaned.startsWith("IR")) {
    return { ok: false, value: cleaned, error: "شبا باید با IR شروع شود." };
  }
  const digits = cleaned.slice(2);
  if (!/^\d{24}$/.test(digits)) {
    return { ok: false, value: cleaned, error: "شبا باید ۲۴ رقم بعد از IR داشته باشد (۲۶ نویسه در کل)." };
  }
  // ISO 13616 mod-97: move the first 4 chars to the end, IR → 18 27.
  const rearrangedFull = `${cleaned.slice(4)}${cleaned.slice(0, 4)}`
    .replace(/[A-Z]/g, (ch) => String(ch.charCodeAt(0) - 55));
  // Big-number modulo without BigInt overflow issues.
  let remainder = 0;
  for (const digit of rearrangedFull) remainder = (remainder * 10 + Number(digit)) % 97;
  if (remainder !== 1) {
    return { ok: false, value: cleaned, error: "رقم کنترل شبای وارد‌شده درست نیست." };
  }
  return {
    ok: true,
    value: cleaned,
    error: null,
    meta: { bban: digits, bankCode: digits.slice(0, 3) },
  };
}

/** IR120170000000123456789012 → IR12 0170 0000 0012 3456 7890 12 */
export function groupSheba(value: string): string {
  const body = value.replace(/^IR/, "");
  return `IR${body.replace(/(\d{4})(?=\d)/g, "$1 ")}`;
}

/* ─────────────────────────────── کد پستی ─────────────────────────────── */

/**
 * Iranian postal code: exactly 10 digits, with two structural rules:
 *  1. digits 1–5 must not all be identical (e.g. 1111111111 is invalid),
 *  2. no more than two consecutive identical digits anywhere.
 * There is no checksum, so these structural rules are the whole validation.
 */
export function validatePostalCode(raw: string): CheckResult {
  const value = normalizeDigits(raw);
  if (value.length === 0) return { ok: false, value, error: "کد پستی را وارد کنید." };
  if (!/^\d{10}$/.test(value)) {
    return { ok: false, value, error: "کد پستی باید دقیقاً ۱۰ رقم باشد." };
  }
  if (/^(\d)\1{4,}/.test(value)) {
    return { ok: false, value, error: "کد پستی نمی‌تواند رقم‌های تکراری پشت‌سرهم داشته باشد (مثل ۱۱۱۱۱۱...)." };
  }
  if (/(\d)\1{2,}/.test(value)) {
    return { ok: false, value, error: "در کد پستی، بیش از دو رقم یکسان پشت‌سرهم مجاز نیست." };
  }
  return { ok: true, value, error: null };
}

/** 1234567890 → 12345-67890 */
export function formatPostalCode(value: string): string {
  return /^\d{10}$/.test(value) ? `${value.slice(0, 5)}-${value.slice(5)}` : value;
}

/* ─────────────────────────── پلاک خودرو ─────────────────────────── */

/**
 * Iranian licence plates have two shapes:
 *  - private cars: `۱۲ ب ۳۴۵ — ۶۷`  → two digits, one letter, three digits, province (2 digits)
 *  - free/other:   `۳۴۵ ب ۱۲`
 *
 * We validate the *shape* and the legal letter set, not the province number.
 */
export interface PlateResult extends CheckResult {
  meta?: { letter: string; left: string; right: string; province: string };
}

export function validatePlate(raw: string): PlateResult {
  const compact = normalizeDigits(raw).toUpperCase().replace(/[\s\-_|/]/g, "");
  const value = compact;
  if (value.length === 0) return { ok: false, value, error: "پلاک را وارد کنید." };

  // Two-part (national style): [2 digits][letter][3 digits][2 digit province]
  const national = value.match(/^(\d{2})([A-Z\u0600-\u06FF])(\d{3})(\d{2})$/);
  if (national) {
    const [, left = "", letter = "", right = "", province = ""] = national;
    if (!isPlateLetter(letter)) {
      return { ok: false, value, error: "حرف پلاک باید یکی از حروف مجاز فارسی باشد." };
    }
    return {
      ok: true,
      value,
      error: null,
      meta: { letter, left, right, province },
    };
  }
  // Free plates (ماشین‌های مناطق آزاد): [3 digits][letter][2 digits]
  const free = value.match(/^(\d{3})([A-Z\u0600-\u06FF])(\d{2})$/);
  if (free) {
    const [, left = "", letter = "", right = ""] = free;
    if (!isPlateLetter(letter)) {
      return { ok: false, value, error: "حرف پلاک باید یکی از حروف مجاز فارسی باشد." };
    }
    return { ok: true, value, error: null, meta: { letter, left, right, province: "" } };
  }
  return {
    ok: false,
    value,
    error: "قالب پلاک شناسایی نشد. نمونه: ۱۲ب۳۴۵۶۷ (پلاک ملی) یا ۳۴۵ب۱۲ (منطقهٔ آزاد).",
  };
}

/** Latin plate letters that Persian keyboards emit, folded to their Persian twin. */
const LATIN_TO_PERSIAN: Record<string, string> = {
  A: "ا", B: "ب", P: "پ", T: "ت", S: "س", J: "ج", D: "د", Z: "ز", R: "ر",
  F: "ف", Q: "ق", K: "ک", G: "گ", L: "ل", M: "م", N: "ن", V: "و", H: "ه", Y: "ی",
};

export function isPlateLetter(letter: string): boolean {
  const folded = LATIN_TO_PERSIAN[letter.toUpperCase()] ?? letter;
  return PLATE_LETTERS.includes(folded);
}

/** Allowed plate letters, exported for the UI legend. */
export const plateLetters = PLATE_LETTERS;

/* ─────────────────────────── نام کاربری ─────────────────────────── */

/**
 * Iranian username conventions vary; this checks the common shape used by most
 * forms: 5–32 chars, letters (Persian or Latin), digits, dot, underscore, dash;
 * must start with a letter.
 */
export function validateUsername(raw: string): CheckResult {
  const value = raw.trim().replace(/[\u200c]/g, "");
  if (value.length === 0) return { ok: false, value, error: "نام کاربری را وارد کنید." };
  if (value.length < 5) return { ok: false, value, error: "نام کاربری باید حداقل ۵ نویسه باشد." };
  if (value.length > 32) return { ok: false, value, error: "نام کاربری حداکثر ۳۲ نویسه می‌تواند باشد." };
  if (!/^[A-Za-z\u0600-\u06FF][A-Za-z0-9\u0600-\u06FF._-]*$/.test(value)) {
    return { ok: false, value, error: "نام کاربری باید با حرف شروع شود و فقط حرف، رقم، نقطه، خط تیره یا _ داشته باشد." };
  }
  return { ok: true, value, error: null };
}
