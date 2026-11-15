"use client";

import { AgeCalculator } from "@/components/tools/AgeCalculator";

/** Lazy entry point for age-calculator — keeps the other tools out of this chunk. */
export default function agecalculator() {
  return <AgeCalculator />;
}
