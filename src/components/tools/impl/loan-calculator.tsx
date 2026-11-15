"use client";

import { LoanCalculator } from "@/components/tools/LoanCalculator";

/** Lazy entry point for loan-calculator — keeps the other tools out of this chunk. */
export default function loancalculator() {
  return <LoanCalculator />;
}
