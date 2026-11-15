"use client";

import { NumberToWords } from "@/components/tools/NumberToWords";

/** Lazy entry point for number-to-words — keeps the other tools out of this chunk. */
export default function numbertowords() {
  return <NumberToWords />;
}
