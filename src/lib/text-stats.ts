/**
 * Text statistics used by the word / character counters.
 *
 * Pure functions only — easy to unit-test and safe to run anywhere.
 * Note: the Persian zero-width non-joiner (نیم‌فاصله, U+200C) is NOT treated
 * as whitespace, so «می‌خواهم» correctly counts as a single word.
 */

import { toPersianDigits } from "@/lib/persian";

export interface TextStats {
  words: number;
  charactersWithSpaces: number;
  charactersWithoutSpaces: number;
  sentences: number;
  paragraphs: number;
  lines: number;
  /** UTF-8 byte size of the text. */
  bytes: number;
}

export function countWords(text: string): number {
  const trimmed = text.trim();
  if (!trimmed) return 0;
  return trimmed.split(/\s+/).filter(Boolean).length;
}

export function countSentences(text: string): number {
  return text
    .split(/[.!؟?]+/)
    .filter((part) => part.trim().length > 0).length;
}

export function countParagraphs(text: string): number {
  return text
    .split(/\n\s*\n/)
    .filter((part) => part.trim().length > 0).length;
}

export function countLines(text: string): number {
  if (!text) return 0;
  return text.split("\n").length;
}

export function getTextStats(text: string): TextStats {
  return {
    words: countWords(text),
    charactersWithSpaces: text.length,
    charactersWithoutSpaces: text.replace(/\s/g, "").length,
    sentences: countSentences(text),
    paragraphs: countParagraphs(text),
    lines: countLines(text),
    bytes: new TextEncoder().encode(text).length,
  };
}

/** Average Persian reading speed (words per minute). */
export const READING_WPM = 200;
/** Average Persian speaking speed (words per minute). */
export const SPEAKING_WPM = 130;

export function estimateSeconds(words: number, wpm: number): number {
  return Math.round((words / wpm) * 60);
}

/** Format a duration in seconds as a Persian human-readable string. */
export function formatDuration(totalSeconds: number): string {
  if (totalSeconds <= 0) return "۰ ثانیه";
  if (totalSeconds < 60) return `${toPersianDigits(totalSeconds)} ثانیه`;
  const minutes = Math.floor(totalSeconds / 60);
  const rest = totalSeconds % 60;
  if (rest === 0) return `${toPersianDigits(minutes)} دقیقه`;
  return `${toPersianDigits(minutes)} دقیقه و ${toPersianDigits(rest)} ثانیه`;
}
