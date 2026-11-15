"use client";

import { ExactAgeCalculator } from "@/components/tools/ExactAgeCalculator";

/** Lazy entry point for exact-age — keeps the other tools out of this chunk. */
export default function exactage() {
  return <ExactAgeCalculator />;
}
