/**
 * Pull emails, phone numbers and URLs out of arbitrary pasted text.
 *
 * Persian text routinely mixes three digit sets and three separator styles, so
 * everything is normalised before matching and the original span is reported
 * back alongside the value — the user must be able to see what was matched.
 */

export interface Found {
  value: string;
  /** The exact substring in the source, so it can be highlighted. */
  raw: string;
  index: number;
}

export interface ContactScan {
  emails: Found[];
  phones: Found[];
  urls: Found[];
  /** Iranian mobile numbers only (09xxxxxxxxx after normalisation). */
  mobiles: Found[];
  /** Landline numbers, including area code. */
  landlines: Found[];
}

const PERSIAN_DIGITS = /[\u06F0-\u06F9]/g;
const ARABIC_DIGITS = /[\u0660-\u0669]/g;

export function toLatinDigits(text: string): string {
  return text
    .replace(PERSIAN_DIGITS, (d) => String(d.charCodeAt(0) - 0x06f0))
    .replace(ARABIC_DIGITS, (d) => String(d.charCodeAt(0) - 0x0660));
}

const EMAIL_RE = /[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}/g;

/**
 * URLs: scheme'd URLs plus bare domains. A trailing punctuation mark is not part
 * of the URL, so it is trimmed rather than included.
 */
const URL_RE =
  /\b(?:(?:https?|ftp):\/\/|www\.)[^\s<>"'«»،؛()]+|\b(?:[a-z0-9](?:[a-z0-9-]*[a-z0-9])?\.)+(?:ir|com|net|org|io|dev|me|co|info|biz|site|online|app|ai|tech)(?:\/[^\s<>"'«»،؛()]*)?/gi;

function collect(
  text: string,
  re: RegExp,
  map: (raw: string) => string | null,
): Found[] {
  const out: Found[] = [];
  const pattern = new RegExp(re.source, re.flags.includes("g") ? re.flags : re.flags + "g");
  let match: RegExpExecArray | null;
  while ((match = pattern.exec(text))) {
    const raw = match[0];
    const value = map(raw);
    if (value !== null) out.push({ value, raw, index: match.index });
  }
  return out;
}

/** Normalise a phone number to digits only, with the Iranian country code removed. */
export function normalisePhone(raw: string): string {
  let digits = toLatinDigits(raw).replace(/[^\d+]/g, "");
  if (digits.startsWith("+98")) digits = "0" + digits.slice(3);
  else if (digits.startsWith("0098")) digits = "0" + digits.slice(4);
  else if (digits.startsWith("98") && digits.length === 12) digits = "0" + digits.slice(2);
  else if (digits.startsWith("9") && digits.length === 10) digits = "0" + digits;
  return digits;
}

export function scanContacts(text: string): ContactScan {
  const normalised = toLatinDigits(text);

  const emails = collect(normalised, EMAIL_RE, (raw) => raw.toLowerCase());

  // "info@example.com" must not also be reported as the URL "example.com".
  const urls = collect(normalised, URL_RE, (raw) => raw.replace(/[.,;:!?]+$/, "")).filter(
    (url) =>
      !/(^|\s)[A-Za-z0-9._%+-]+@$/.test(
        normalised.slice(Math.max(0, url.index - 40), url.index),
      ),
  );

  const phones = collect(normalised, /\d[\d\s()+-]{6,}\d/g, (raw) => {
    if (/^\d{4}-\d{2}-\d{2}$/.test(raw)) return null; // a date, not a phone
    const digits = raw.replace(/\D/g, "");
    if (digits.length < 8 || digits.length > 15) return null;
    return normalisePhone(raw);
  });

  const mobiles = phones.filter((phone) => /^09\d{9}$/.test(phone.value));
  const landlines = phones.filter(
    (phone) => /^0\d{9,10}$/.test(phone.value) && !/^09/.test(phone.value),
  );

  return { emails, phones, urls, mobiles, landlines };
}

/** Deduplicate while keeping the first occurrence order. */
export function unique(items: Found[]): Found[] {
  const seen = new Set<string>();
  return items.filter((item) => {
    if (seen.has(item.value)) return false;
    seen.add(item.value);
    return true;
  });
}

export type ContactKind = "emails" | "mobiles" | "landlines" | "urls";

export const CONTACT_LABEL: Record<ContactKind, string> = {
  emails: "ایمیل",
  mobiles: "موبایل",
  landlines: "تلفن ثابت",
  urls: "آدرس وب",
};
