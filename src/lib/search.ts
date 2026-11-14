/**
 * Tool search helpers shared by the ⌘K palette, the header search box and the
 * live filter on /tools.
 *
 * Persian users type inconsistently: «ي» vs «ی», «ك» vs «ک», Arabic-Indic vs
 * Persian vs Latin digits, and with or without ZWNJ. Everything is folded to a
 * single canonical form before comparing, so «فشرده سازي» finds «فشردهسازی».
 */

import type { Tool } from "@/data/tools";
import { getCategory } from "@/data/categories";
import { toEnglishDigits } from "@/lib/persian";

const FOLD: Record<string, string> = {
  "ي": "ی",
  "ﻱ": "ی",
  "ك": "ک",
  "ﻙ": "ک",
  "ۀ": "ه",
  "ة": "ه",
  "أ": "ا",
  "إ": "ا",
  "آ": "ا",
  "ٱ": "ا",
  "ؤ": "و",
  "ئ": "ی",
};

/** Lower-case, digit-normalised, diacritic-free, ZWNJ-free search key. */
export function foldPersian(input: string): string {
  return toEnglishDigits(String(input))
    .toLowerCase()
    .replace(/[\u064B-\u0652\u0670\u0640]/g, "") // harakat + tatweel
    .replace(/[\u200B-\u200D\uFEFF\u00AD]/g, "") // ZWSP/ZWNJ/ZWJ/BOM/SHY
    .replace(/[يكۀةأإآٱؤئ]/g, (ch) => FOLD[ch] ?? ch)
    .replace(/[‌\s]+/g, " ")
    .trim();
}

/**
 * Space-insensitive comparison key: Persian users freely mix «می‌شود»,
 * «میشود» and «می شود», so spaces are dropped before matching.
 */
export function compactKey(input: string): string {
  return foldPersian(input).replace(/ /g, "");
}

/** Pre-computed haystack for one tool (title, description, category, keywords). */
export function toolSearchKey(tool: Tool): string {
  const category = getCategory(tool.category);
  return foldPersian(
    [tool.title, tool.description, tool.seoTitle, category?.title ?? "", tool.slug, ...tool.keywords].join(" "),
  );
}

export interface ScoredTool {
  tool: Tool;
  score: number;
}

/**
 * Ranks tools against a query: title prefix > title contains > keyword >
 * description. Returns `[]` for an empty query so callers decide what to show.
 */
export function searchTools(
  query: string,
  tools: Tool[],
  limit = 6,
): Tool[] {
  const q = foldPersian(query);
  if (!q) return [];

  const terms = q.split(" ").filter(Boolean).map((term) => term.replace(/ /g, ""));

  const scored: ScoredTool[] = [];

  for (const tool of tools) {
    const title = foldPersian(tool.title);
    const keywords = foldPersian(tool.keywords.join(" "));
    const haystack = compactKey(toolSearchKey(tool));

    if (!terms.every((term) => haystack.includes(term))) continue;

    let score = 0;
    if (title.startsWith(q)) score += 100;
    if (title.includes(q)) score += 60;
    if (keywords.includes(q)) score += 30;
    if (foldPersian(tool.description).includes(q)) score += 10;
    // Multi-term matches that all land in the title rank higher than scattered
    if (terms.every((term) => title.includes(term))) score += 25;
    if (tool.popular) score += 5;

    scored.push({ tool, score });
  }

  scored.sort(
    (a, b) => b.score - a.score || a.tool.title.localeCompare(b.tool.title, "fa"),
  );

  return scored.slice(0, limit).map((entry) => entry.tool);
}
