"use client";

import { WordCounter } from "@/components/tools/WordCounter";

/** Lazy entry point for word-counter — keeps the other tools out of this chunk. */
export default function wordcounter() {
  return <WordCounter />;
}
