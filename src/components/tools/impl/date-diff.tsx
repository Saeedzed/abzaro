"use client";

import { DateDiffCalculator } from "@/components/tools/DateDiffCalculator";

/** Lazy entry point for date-diff — keeps the other tools out of this chunk. */
export default function datediff() {
  return <DateDiffCalculator />;
}
