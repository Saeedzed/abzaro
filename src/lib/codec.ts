/**
 * Text/escaper helpers for the developer tools:
 * JSON formatter & validator, Base64, URL encoding, HTML escaping and
 * byte/pixel striping for QR codes.
 *
 * Pure functions — unit-tested in codec.test.ts.
 */

// ---------------------------------------------------------------------------
// Base64 (UTF-8 safe)
// ---------------------------------------------------------------------------

/** Encode a string to Base64 (handles Persian text correctly). */
export function encodeBase64(text: string): string {
  const bytes = new TextEncoder().encode(text);
  let binary = "";
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary);
}

export interface DecodeResult {
  text: string;
  error: string | null;
}

/** Decode Base64 back to a UTF-8 string. */
export function decodeBase64(input: string): DecodeResult {
  const cleaned = input
    .trim()
    .replace(/-/g, "+")
    .replace(/_/g, "/")
    .replace(/\s+/g, "");
  if (cleaned === "") return { text: "", error: null };
  if (!/^[A-Za-z0-9+/]*={0,2}$/.test(cleaned)) {
    return { text: "", error: "این متن Base64 معتبر نیست (کاراکتر ناشناخته دارد)." };
  }
  const padded = cleaned.padEnd(cleaned.length + ((4 - (cleaned.length % 4)) % 4), "=");
  try {
    const binary = atob(padded);
    const bytes = Uint8Array.from(binary, (char) => char.charCodeAt(0));
    const text = new TextDecoder("utf-8", { fatal: false }).decode(bytes);
    return { text, error: null };
  } catch {
    return { text: "", error: "رمزگشایی Base64 ممکن نشد." };
  }
}

/** True when the decoded bytes do not contain control characters. */
export function looksLikeText(value: string): boolean {
  // eslint-disable-next-line no-control-regex
  return !/[\u0000-\u0008\u000B\u000E-\u001F]/.test(value);
}

// ---------------------------------------------------------------------------
// URL encoding
// ---------------------------------------------------------------------------

export type UrlMode = "component" | "uri" | "safe";

export interface UrlResult {
  value: string;
  error: string | null;
}

export function encodeUrl(input: string, mode: UrlMode): UrlResult {
  try {
    if (mode === "uri") return { value: encodeURI(input), error: null };
    if (mode === "safe") return { value: encodeURIComponent(input), error: null };
    return { value: encodeURIComponent(input), error: null };
  } catch {
    return { value: "", error: "کدگذاری این متن ممکن نشد (کاراکتر نامعتبر)." };
  }
}

export function decodeUrl(input: string, mode: UrlMode): UrlResult {
  try {
    if (mode === "uri") return { value: decodeURI(input), error: null };
    return { value: decodeURIComponent(input), error: null };
  } catch {
    return {
      value: "",
      error: "این متن کدگذاری معتبری ندارد (مثلاً «%» تنها یا ٪ ناقص).",
    };
  }
}

/** Build a query string from parsed params. */
export function parseQueryString(input: string): URLSearchParams | null {
  try {
    const value = input.trim().replace(/^\?/, "");
    return new URLSearchParams(value);
  } catch {
    return null;
  }
}

// ---------------------------------------------------------------------------
// JSON
// ---------------------------------------------------------------------------

export type JsonIndent = 2 | 4 | "tab";

export interface JsonResult {
  formatted: string;
  error: string | null;
  /** Error position (1-based line/column) for display. */
  line?: number;
  column?: number;
  meta?: JsonMeta;
}

export interface JsonMeta {
  keys: number;
  arrays: number;
  values: number;
  depth: number;
  /** Byte size of the formatted output (UTF-8). */
  bytes: number;
}

/**
 * Walk a parsed JSON value and collect structural statistics:
 * `keys` = number of object members, `arrays` = number of arrays,
 * `values` = number of scalars, `depth` = nesting depth of containers.
 */
function countJson(
  node: unknown,
  depth = 1,
): { keys: number; arrays: number; values: number; depth: number } {
  if (Array.isArray(node)) {
    let keys = 0;
    let arrays = 1;
    let values = 0;
    let maxDepth = depth;
    for (const item of node) {
      const inner = countJson(item, depth + 1);
      keys += inner.keys;
      arrays += inner.arrays;
      values += inner.values;
      maxDepth = Math.max(maxDepth, inner.depth);
    }
    return { keys, arrays, values, depth: maxDepth };
  }
  if (node !== null && typeof node === "object") {
    const entries = Object.values(node as Record<string, unknown>);
    let keys = entries.length;
    let arrays = 0;
    let values = 0;
    let maxDepth = depth;
    for (const value of entries) {
      const inner = countJson(value, depth + 1);
      keys += inner.keys;
      arrays += inner.arrays;
      values += inner.values;
      maxDepth = Math.max(maxDepth, inner.depth);
    }
    return { keys, arrays, values, depth: maxDepth };
  }
  return { keys: 0, arrays: 0, values: 1, depth: 0 };
}

/** Rewrite JS-style object literals (`{ key: 'v', }`) into valid JSON. */
export function repairJson(text: string): string {
  return text
    .replace(/^\uFEFF/, "")
    .replace(/,\s*([}\]])/g, "$1")
    .replace(/([{,]\s*)'([^'\n\\]*)'(\s*:)/g, '$1"$2"$3')
    .replace(/([{,]\s*)([A-Za-z_$][\w$-]*)(\s*:)/g, '$1"$2"$3')
    // Single-quoted values — including inside arrays — become double-quoted.
    .replace(/'([^'\n\\]*)'/g, '"$1"');
}

/**
 * Validate and pretty-print JSON. When `repair` is true, common mistakes
 * (trailing commas, single-quoted keys, BOM) are fixed before parsing.
 */
export function formatJson(
  raw: string,
  indent: JsonIndent = 2,
  repair = false,
): JsonResult {
  const trimmed = raw.trim();
  if (trimmed === "") return { formatted: "", error: null };

  const text = repair ? repairJson(trimmed) : trimmed;

  try {
    const parsed: unknown = JSON.parse(text);
    const space = indent === "tab" ? "\t" : indent;
    const formatted = JSON.stringify(parsed, null, space);
    const counts = countJson(parsed);
    return {
      formatted,
      error: null,
      meta: {
        ...counts,
        bytes: new TextEncoder().encode(formatted).length,
      },
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    const position = /position (\d+)/.exec(message);
    let line: number | undefined;
    let column: number | undefined;
    if (position?.[1]) {
      const offset = Number(position[1]);
      const before = text.slice(0, offset).split("\n");
      line = before.length;
      column = (before[before.length - 1]?.length ?? 0) + 1;
    }
    return {
      formatted: "",
      error: translateJsonError(message),
      ...(line ? { line, column } : {}),
    };
  }
}

/** Turn V8's English JSON errors into a short Persian sentence. */
export function translateJsonError(message: string): string {
  if (/Unexpected end of JSON input|Unterminated/i.test(message)) {
    return "JSON ناتمام است — احتمالاً یک «}» یا «]» کم است.";
  }
  if (/Unexpected token/i.test(message)) {
    return "کاراکتر غیرمنتظره — احتمالاً کاما یا کوتیشن اضافه/کم است.";
  }
  if (/Expected property name/i.test(message)) {
    return "کلید باید داخل کوتیشن باشد، مثلاً «name»: نه name:";
  }
  if (/Expected ',' or '}'/i.test(message)) {
    return "بین دو عضو آبجکت باید کاما باشد.";
  }
  return "این متن JSON معتبر نیست.";
}

/** Minify JSON (validate + strip whitespace). */
export function minifyJson(raw: string, repair = false): JsonResult {
  const trimmed = raw.trim();
  if (trimmed === "") return { formatted: "", error: null };
  const text = repair ? repairJson(trimmed) : trimmed;
  try {
    const parsed: unknown = JSON.parse(text);
    return { formatted: JSON.stringify(parsed), error: null };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return { formatted: "", error: translateJsonError(message) };
  }
}

/** Sort object keys alphabetically, recursively. */
export function sortJsonKeys(raw: string): JsonResult {
  const base = formatJson(raw, 2, false);
  if (base.error) return base;
  if (!base.formatted) return base;
  const parsed: unknown = JSON.parse(base.formatted);
  const sorted = sortValue(parsed);
  const formatted = JSON.stringify(sorted, null, 2);
  return {
    formatted,
    error: null,
    meta: {
      ...countJson(sorted),
      bytes: new TextEncoder().encode(formatted).length,
    },
  };
}

function sortValue(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(sortValue);
  if (value !== null && typeof value === "object") {
    const entries = Object.entries(value as Record<string, unknown>).sort(([a], [b]) =>
      a.localeCompare(b),
    );
    return Object.fromEntries(entries.map(([key, inner]) => [key, sortValue(inner)]));
  }
  return value;
}

// ---------------------------------------------------------------------------
// QR codes
// ---------------------------------------------------------------------------

export type QrEcc = "L" | "M" | "Q" | "H";

export interface QrOptions {
  size: number;
  margin: number;
  dark: string;
  light: string;
  ecc: QrEcc;
}

/** Colour options for the QR tool. */
export const QR_COLORS = [
  { dark: "#0f172a", light: "#ffffff", label: "مشکی" },
  { dark: "#1d4ed8", light: "#ffffff", label: "آبی" },
  { dark: "#047857", light: "#ffffff", label: "سبز" },
  { dark: "#ffffff", light: "#0f172a", label: "معکوس" },
] as const;

// ---------------------------------------------------------------------------
// Misc
// ---------------------------------------------------------------------------

/** Escape a string for safe inclusion in HTML. */
export function escapeHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

/** Persian-friendly byte size (used by the JSON tool). */
export function bytesToPersian(bytes: number): string {
  if (bytes < 1024) return `${bytes} بایت`;
  return `${(bytes / 1024).toFixed(1)} کیلوبایت`;
}
