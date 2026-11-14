/**
 * Line-based text utilities: de-duplicate, sort, slugify, keyword density.
 *
 * Everything is pure string work so it can be unit-tested and runs on the
 * server too. Persian-friendly by default: ZWNJ, Arabic yeh/kaf variants and
 * Arabic-Indic digits are folded before comparing.
 */

import { foldPersian } from "@/lib/search";

export interface DuplicateResult {
  /** Lines in original order, first occurrence kept. */
  unique: string[];
  /** One entry per removed line, in the order they were removed. */
  removed: { line: string; originalIndex: number }[];
  before: number;
  after: number;
}

export interface DedupeOptions {
  /** Compare without case/Arabic-letter differences (default true). */
  ignoreCase: boolean;
  /** Also treat lines that differ only by surrounding spaces as equal. */
  ignoreSurroundingSpaces: boolean;
  /** Drop lines that are empty or whitespace-only. */
  removeEmpty: boolean;
}

export const defaultDedupeOptions: DedupeOptions = {
  ignoreCase: true,
  ignoreSurroundingSpaces: true,
  removeEmpty: true,
};

/** Remove duplicate lines, keeping the first occurrence and its order. */
export function dedupeLines(input: string, options: Partial<DedupeOptions> = {}): DuplicateResult {
  const { ignoreCase, ignoreSurroundingSpaces, removeEmpty } = {
    ...defaultDedupeOptions,
    ...options,
  };
  const lines = input.split(/\r?\n/);
  const seen = new Set<string>();
  const unique: string[] = [];
  const removed: { line: string; originalIndex: number }[] = [];

  lines.forEach((rawLine, originalIndex) => {
    const display = ignoreSurroundingSpaces ? rawLine.trim() : rawLine;
    if (removeEmpty && display.trim() === "") {
      if (rawLine !== "") removed.push({ line: rawLine, originalIndex });
      return;
    }
    const key = ignoreCase ? foldPersian(display) : display;
    if (seen.has(key)) {
      removed.push({ line: display, originalIndex });
      return;
    }
    seen.add(key);
    unique.push(display);
  });

  return { unique, removed, before: lines.length, after: unique.length };
}

export type SortMode = "alphabetical" | "alphabetical-desc" | "length" | "length-desc" | "random" | "reverse";

export const SORT_LABELS: Record<SortMode, string> = {
  alphabetical: "الفبایی (الف → ی)",
  "alphabetical-desc": "الفبایی (ی → الف)",
  length: "کوتاه‌ترین اول",
  "length-desc": "بلندترین اول",
  random: "ترتیب تصادفی",
  reverse: "برعکس کردن ترتیب فعلی",
};

/**
 * Sort lines. Alphabetical order uses Persian collation; `random` accepts a
 * seed-free shuffle (the caller re-runs for a new order).
 */
export function sortLines(input: string, mode: SortMode): string[] {
  const lines = input.split(/\r?\n/).filter((line) => line.trim() !== "");

  switch (mode) {
    case "alphabetical":
      return [...lines].sort((a, b) => a.localeCompare(b, "fa"));
    case "alphabetical-desc":
      return [...lines].sort((a, b) => b.localeCompare(a, "fa"));
    case "length":
      return [...lines].sort((a, b) => a.trim().length - b.trim().length || a.localeCompare(b, "fa"));
    case "length-desc":
      return [...lines].sort((a, b) => b.trim().length - a.trim().length || a.localeCompare(b, "fa"));
    case "reverse":
      return [...lines].reverse();
    case "random": {
      const copy = [...lines];
      for (let i = copy.length - 1; i > 0; i -= 1) {
        const j = Math.floor(Math.random() * (i + 1));
        const a = copy[i];
        const b = copy[j];
        if (a !== undefined && b !== undefined) {
          copy[i] = b;
          copy[j] = a;
        }
      }
      return copy;
    }
    default:
      return lines;
  }
}

/* -------------------------------------------------------------------------- */
/*  Slug                                                                      */
/* -------------------------------------------------------------------------- */

const SLUG_MAP: Record<string, string> = {
  "آ": "a", "ا": "a", "ب": "b", "پ": "p", "ت": "t", "ث": "s", "ج": "j",
  "چ": "ch", "ح": "h", "خ": "kh", "د": "d", "ذ": "z", "ر": "r", "ز": "z",
  "ژ": "zh", "س": "s", "ش": "sh", "ص": "s", "ض": "z", "ط": "t", "ظ": "z",
  "ع": "a", "غ": "gh", "ف": "f", "ق": "gh", "ک": "k", "ك": "k", "گ": "g",
  "ل": "l", "م": "m", "ن": "n", "و": "v", "ه": "h", "ی": "y", "ي": "y",
  "ة": "h", "ۀ": "h", "ء": "", "أ": "a", "إ": "e", "ؤ": "o", "ئ": "y",
};

/**
 * Build a URL slug. Persian letters are transliterated so the result is a
 * valid ASCII slug that search engines and social previews handle cleanly.
 * Set `keepPersian` to keep the original letters instead (readable URLs).
 */
export function slugify(input: string, options: { keepPersian?: boolean; separator?: string } = {}): string {
  const { keepPersian = false, separator = "-" } = options;
  const text = input
    .replace(/[\u064B-\u0652]/g, "") // harakat
    .replace(/[\u200B-\u200D\uFEFF]/g, " ") // zero-width chars → space
    .trim()
    .toLowerCase();

  const mapped = keepPersian
    ? text
    : Array.from(text)
        .map((char) => SLUG_MAP[char] ?? char)
        .join("");

  return mapped
    .replace(/['"’”“«»؟?.,،؛:!]/g, " ")
    .replace(/[^a-z0-9\u0600-\u06FF]+/gi, separator)
    .replace(new RegExp(`${separator}{2,}`, "g"), separator)
    .replace(new RegExp(`^${separator}|${separator}$`, "g"), "");
}

/* -------------------------------------------------------------------------- */
/*  Keyword density                                                           */
/* -------------------------------------------------------------------------- */

const STOP_WORDS = new Set([
  "و", "در", "به", "از", "که", "این", "را", "با", "است", "برای", "آن", "یک",
  "هم", "تا", "بر", "اما", "یا", "شد", "شده", "شود", "می", "های", "ها", "بود",
  "کرد", "کن", "کند", "اگر", "چون", "نه", "بله", "هر", "چه", "همه", "دیگر",
  "خود", "بی", "پس", "پیش", "روی", "زیر", "بین", "like", "the", "and", "of",
  "to", "in", "a", "is", "it", "for", "on", "with", "as", "at", "by", "an",
]);

export interface KeywordCount {
  word: string;
  count: number;
  /** Share of all counted words, 0–1. */
  density: number;
}

export interface DensityResult {
  totalWords: number;
  /** Words considered for ranking (stop words and single letters removed). */
  uniqueWords: number;
  keywords: KeywordCount[];
}

/**
 * Count word frequency and density. Persian half-spaces are folded first, so
 * «می‌شود» and «میشود» count as the same word; stop words are dropped
 * because they dominate every Persian text and hide the interesting terms.
 */
export function keywordDensity(input: string, options: { limit?: number; minLength?: number; dropStopWords?: boolean } = {}): DensityResult {
  const { limit = 20, minLength = 2, dropStopWords = true } = options;

  const normalized = input
    .replace(/[\u200B-\u200D\uFEFF]/g, "") // ZWNJ/ZWSP removed, so «می‌شود» is one word
    .replace(/[.,؛:!؟?«»"'()\[\]{}<>\/\\|@#$%^&*_+=~`۰-۹0-9]/g, " ");

  const words = normalized
    .split(/\s+/)
    .map((word) => foldPersian(word))
    .filter((word) => word.length >= minLength && !/^[\s\p{P}]*$/u.test(word));

  const totalWords = words.length;
  const counts = new Map<string, number>();

  for (const word of words) {
    if (dropStopWords && STOP_WORDS.has(word)) continue;
    counts.set(word, (counts.get(word) ?? 0) + 1);
  }

  const ranked = [...counts.entries()]
    .map(([word, count]) => ({
      word,
      count,
      density: totalWords === 0 ? 0 : count / totalWords,
    }))
    .sort((a, b) => b.count - a.count || a.word.localeCompare(b.word, "fa"))
    .slice(0, limit);

  return { totalWords, uniqueWords: counts.size, keywords: ranked };
}

/* ------------------------------------------------------------------ */
/*  Multiple find & replace (پیدا و جایگزین چندگانه)                   */
/* ------------------------------------------------------------------ */

export interface ReplaceRule {
  find: string;
  replace: string;
}

/**
 * Apply a list of literal find/replace rules in order.
 * Empty `find` values are ignored (otherwise every position matches).
 */
export function applyReplaceRules(
  input: string,
  rules: ReplaceRule[],
  options: { ignoreCase?: boolean } = {},
): { output: string; replacements: number } {
  let output = input;
  let replacements = 0;

  for (const rule of rules) {
    if (!rule.find) continue;
    const escaped = rule.find.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const pattern = new RegExp(escaped, options.ignoreCase ? "gi" : "g");
    output = output.replace(pattern, () => {
      replacements += 1;
      return rule.replace;
    });
  }

  return { output, replacements };
}

/* ------------------------------------------------------------------ */
/*  Persian lorem ipsum (متن ساختگی فارسی)                            */
/* ------------------------------------------------------------------ */

const LOREM_WORDS =
  "لورم ایپسوم متن ساختگی با تولید سادگی نامفهوم از صنعت چاپ و با استفاده از طراحان گرافیک است چاپگرها و متون بلکه روزنامه و مجله در ستون و سطرآنچنان که لازم است و برای شرایط فعلی تکنولوژی مورد نیاز و کاربردهای متنوع با هدف بهبود ابزارهای کاربردی می باشد کتابهای زیادی در شصت و سه درصد گذشته حال و آینده شناخت فراوان جامعه و متخصصان را می طلبد".split(
    " ",
  );

/**
 * Deterministic Persian lorem ipsum. The PRNG is seeded so tests (and users)
 * get the same paragraph twice for the same seed.
 */
export function persianLorem(
  options: { paragraphs?: number; sentencesPerParagraph?: number; seed?: number } = {},
): string {
  const paragraphs = clampInt(options.paragraphs ?? 3, 1, 20);
  const sentences = clampInt(options.sentencesPerParagraph ?? 4, 1, 15);
  const random = mulberry32(options.seed ?? 1404);
  const out: string[] = [];

  for (let p = 0; p < paragraphs; p += 1) {
    const parts: string[] = [];
    for (let s = 0; s < sentences; s += 1) {
      const words: string[] = [];
      const count = 6 + Math.floor(random() * 9);
      for (let w = 0; w < count; w += 1) {
        words.push(LOREM_WORDS[Math.floor(random() * LOREM_WORDS.length)] ?? "");
      }
      const sentence = words.join(" ");
      parts.push(sentence.charAt(0).toUpperCase() + sentence.slice(1) + ".");
    }
    out.push(parts.join(" "));
  }

  return out.join("\n\n");
}

function clampInt(value: number, min: number, max: number): number {
  if (!Number.isFinite(value)) return min;
  return Math.min(Math.max(Math.round(value), min), max);
}

function mulberry32(seed: number): () => number {
  let state = seed >>> 0;
  return () => {
    state = (state + 0x6d2b79f5) >>> 0;
    let t = state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
