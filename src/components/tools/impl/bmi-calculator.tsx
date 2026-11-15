"use client";

import { BmiCalculator } from "@/components/tools/BmiCalculator";

/** Lazy entry point for bmi-calculator — keeps the other tools out of this chunk. */
export default function bmicalculator() {
  return <BmiCalculator />;
}
