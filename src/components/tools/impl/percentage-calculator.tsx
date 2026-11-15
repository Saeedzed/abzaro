"use client";

import { PercentageCalculator } from "@/components/tools/PercentageCalculator";

/** Lazy entry point for percentage-calculator — keeps the other tools out of this chunk. */
export default function percentagecalculator() {
  return <PercentageCalculator />;
}
