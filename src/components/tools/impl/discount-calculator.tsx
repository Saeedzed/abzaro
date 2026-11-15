"use client";

import { DiscountCalculator } from "@/components/tools/DiscountCalculator";

/** Lazy entry point for discount-calculator — keeps the other tools out of this chunk. */
export default function discountcalculator() {
  return <DiscountCalculator />;
}
