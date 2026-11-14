/**
 * Small structured-data helpers for the data tools: CSV ⇄ JSON, timestamps,
 * colours. Pure functions → unit-tested in data-tools.test.ts.
 */

/* ------------------------------------------------------------------ */
/*  CSV ⇄ JSON                                                         */
/* ------------------------------------------------------------------ */

export interface CsvParseResult {
  headers: string[];
  rows: string[][];
}

/**
 * RFC-4180-ish CSV parser: handles quoted fields, embedded commas, newlines
 * and doubled quotes. `delimiter` can be `,` `;` or `\t`.
 */
export function parseCsv(input: string, delimiter = ","): CsvParseResult {
  const text = input.replace(/^\uFEFF/, "");
  const rows: string[][] = [];
  let row: string[] = [];
  let field = "";
  let inQuotes = false;

  for (let i = 0; i < text.length; i += 1) {
    const char = text[i];
    if (inQuotes) {
      if (char === '"') {
        if (text[i + 1] === '"') {
          field += '"';
          i += 1;
        } else {
          inQuotes = false;
        }
      } else {
        field += char;
      }
      continue;
    }

    if (char === '"') {
      inQuotes = true;
    } else if (char === delimiter) {
      row.push(field);
      field = "";
    } else if (char === "\n") {
      row.push(field);
      rows.push(row);
      row = [];
      field = "";
    } else if (char === "\r") {
      // handled by the following \n
    } else {
      field += char;
    }
  }

  if (field !== "" || row.length > 0) {
    row.push(field);
    rows.push(row);
  }

  const clean = rows.filter((r) => r.some((cell) => cell.trim() !== ""));
  const headers = (clean.shift() ?? []).map((cell) => cell.trim());
  return { headers, rows: clean };
}

/** Guess the delimiter by counting candidates in the header line. */
export function detectDelimiter(input: string): string {
  const firstLine = input.split(/\r?\n/)[0] ?? "";
  const candidates = [",", ";", "\t", "|"];
  let best = ",";
  let bestCount = 0;
  for (const candidate of candidates) {
    const count = firstLine.split(candidate).length - 1;
    if (count > bestCount) {
      best = candidate;
      bestCount = count;
    }
  }
  return best;
}

function coerceCell(value: string): string | number | boolean | null {
  const trimmed = value.trim();
  if (trimmed === "") return "";
  if (/^-?\d+(\.\d+)?$/.test(trimmed)) {
    const num = Number(trimmed);
    return Number.isSafeInteger(num) ? num : num;
  }
  if (/^(true|false)$/i.test(trimmed)) return trimmed.toLowerCase() === "true";
  if (/^(null|NULL)$/.test(trimmed)) return null;
  return trimmed;
}

/** CSV → array of objects keyed by the header row. */
export function csvToJson(input: string, options: { delimiter?: string } = {}): unknown[] {
  const delimiter = options.delimiter && options.delimiter !== "auto"
    ? options.delimiter
    : detectDelimiter(input);
  const { headers, rows } = parseCsv(input, delimiter);
  return rows.map((cells) => {
    const record: Record<string, unknown> = {};
    headers.forEach((header, index) => {
      record[header || `ستون${index + 1}`] = coerceCell(cells[index] ?? "");
    });
    return record;
  });
}

function escapeCsvCell(value: unknown, delimiter: string): string {
  const raw = value === null || value === undefined ? "" : String(value);
  if (raw.includes('"') || raw.includes("\n") || raw.includes(delimiter)) {
    return `"${raw.replace(/"/g, '""')}"`;
  }
  return raw;
}

/** JSON array of flat objects → CSV. Nested values are JSON-stringified. */
export function jsonToCsv(input: unknown, delimiter = ","): string {
  const rows = Array.isArray(input) ? input : [input];
  const objects = rows.filter(
    (row): row is Record<string, unknown> => typeof row === "object" && row !== null,
  );
  if (objects.length === 0) return "";

  const headers: string[] = [];
  for (const object of objects) {
    for (const key of Object.keys(object)) {
      if (!headers.includes(key)) headers.push(key);
    }
  }

  const lines = [headers.map((h) => escapeCsvCell(h, delimiter)).join(delimiter)];
  for (const object of objects) {
    lines.push(
      headers
        .map((header) => {
          const value = object[header];
          const flat =
            value !== null && typeof value === "object" ? JSON.stringify(value) : value;
          return escapeCsvCell(flat, delimiter);
        })
        .join(delimiter),
    );
  }
  return lines.join("\n");
}

/* ------------------------------------------------------------------ */
/*  Timestamp ⇄ date                                                   */
/* ------------------------------------------------------------------ */

export interface TimestampParts {
  /** Unix seconds */
  seconds: number;
  /** Unix milliseconds */
  millis: number;
  iso: string;
  /** تاریخ شمسی */
  jalali: string;
  /** Gregorian yyyy-mm-dd */
  gregorian: string;
  /** HH:mm:ss */
  time: string;
  weekday: string;
}

/**
 * Convert a unix timestamp to every representation the tool shows.
 * Accepts seconds or milliseconds (10 vs 13 digits) via `unit: "auto"`.
 */
export function parseTimestamp(
  value: string,
  unit: "auto" | "s" | "ms" = "auto",
): number | null {
  const normalized = value.trim().replace(/[^\d.-]/g, "");
  if (normalized === "") return null;
  const numeric = Number(normalized);
  if (!Number.isFinite(numeric)) return null;

  const resolved = unit === "auto" ? (Math.abs(numeric) >= 1e11 ? "ms" : "s") : unit;
  const millis = resolved === "ms" ? numeric : numeric * 1000;
  if (Math.abs(millis) > 8.64e15) return null;
  return millis;
}

/** Format epoch milliseconds with the browser's local timezone. */
export function describeTimestamp(millis: number): TimestampParts {
  const date = new Date(millis);
  const iso = date.toISOString();
  return {
    seconds: Math.floor(millis / 1000),
    millis,
    iso,
    jalali: new Intl.DateTimeFormat("fa-IR", {
      dateStyle: "full",
      timeZone: "UTC",
    }).format(new Date(iso)),
    gregorian: iso.slice(0, 10),
    time: iso.slice(11, 19),
    weekday: new Intl.DateTimeFormat("fa-IR", { weekday: "long", timeZone: "UTC" }).format(
      new Date(iso),
    ),
  };
}

/* ------------------------------------------------------------------ */
/*  Colour conversions                                                 */
/* ------------------------------------------------------------------ */

export interface RgbColor {
  r: number;
  g: number;
  b: number;
}

export interface HslColor {
  h: number;
  s: number;
  l: number;
}

const HEX_RE = /^#?([0-9a-f]{3}|[0-9a-f]{6})$/i;

/** Parse `#rgb` / `#rrggbb` (with or without `#`) into RGB. */
export function parseHex(input: string): RgbColor | null {
  const match = HEX_RE.exec(input.trim());
  if (!match) return null;
  let hex = match[1] as string;
  if (hex.length === 3) {
    hex = hex
      .split("")
      .map((char) => char + char)
      .join("");
  }
  const int = parseInt(hex, 16);
  return { r: (int >> 16) & 255, g: (int >> 8) & 255, b: int & 255 };
}

export function rgbToHex({ r, g, b }: RgbColor): string {
  const clamp = (value: number) => Math.min(255, Math.max(0, Math.round(value)));
  return `#${[clamp(r), clamp(g), clamp(b)]
    .map((value) => value.toString(16).padStart(2, "0"))
    .join("")}`;
}

/** RGB → HSL with h in [0,360), s/l in [0,100]. */
export function rgbToHsl({ r, g, b }: RgbColor): HslColor {
  const rn = r / 255;
  const gn = g / 255;
  const bn = b / 255;
  const max = Math.max(rn, gn, bn);
  const min = Math.min(rn, gn, bn);
  const delta = max - min;
  const l = (max + min) / 2;

  let h = 0;
  if (delta !== 0) {
    if (max === rn) h = ((gn - bn) / delta) % 6;
    else if (max === gn) h = (bn - rn) / delta + 2;
    else h = (rn - gn) / delta + 4;
    h *= 60;
    if (h < 0) h += 360;
  }

  const s = delta === 0 ? 0 : delta / (1 - Math.abs(2 * l - 1));
  return { h: Math.round(h), s: Math.round(s * 100), l: Math.round(l * 100) };
}

/** HSL → RGB (rounded). */
export function hslToRgb({ h, s, l }: HslColor): RgbColor {
  const hh = ((h % 360) + 360) % 360;
  const ss = Math.min(100, Math.max(0, s)) / 100;
  const ll = Math.min(100, Math.max(0, l)) / 100;
  const c = (1 - Math.abs(2 * ll - 1)) * ss;
  const x = c * (1 - Math.abs(((hh / 60) % 2) - 1));
  const m = ll - c / 2;

  let rgb: [number, number, number];
  if (hh < 60) rgb = [c, x, 0];
  else if (hh < 120) rgb = [x, c, 0];
  else if (hh < 180) rgb = [0, c, x];
  else if (hh < 240) rgb = [0, x, c];
  else if (hh < 300) rgb = [x, 0, c];
  else rgb = [c, 0, x];

  return {
    r: Math.round((rgb[0] + m) * 255),
    g: Math.round((rgb[1] + m) * 255),
    b: Math.round((rgb[2] + m) * 255),
  };
}

/** Relative luminance (WCAG) — used to pick black or white text on a swatch. */
export function relativeLuminance({ r, g, b }: RgbColor): number {
  const channel = (value: number) => {
    const v = value / 255;
    return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4;
  };
  return 0.2126 * channel(r) + 0.7152 * channel(g) + 0.0722 * channel(b);
}

/** Contrast-safe text colour for a background colour. */
export function readableTextColor(color: RgbColor): "#ffffff" | "#111827" {
  return relativeLuminance(color) > 0.45 ? "#111827" : "#ffffff";
}
