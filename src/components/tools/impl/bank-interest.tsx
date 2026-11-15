"use client";

import { BankInterestCalculator } from "@/components/tools/BankInterestCalculator";

/** Lazy entry point for bank-interest — keeps the other tools out of this chunk. */
export default function bankinterest() {
  return <BankInterestCalculator />;
}
