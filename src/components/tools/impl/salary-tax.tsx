"use client";

import { SalaryTaxCalculator } from "@/components/tools/SalaryTaxCalculator";

/** Lazy entry point for salary-tax — keeps the other tools out of this chunk. */
export default function salarytax() {
  return <SalaryTaxCalculator />;
}
