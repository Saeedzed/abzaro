"use client";

import { UnitConverter } from "@/components/tools/UnitConverter";

/** Lazy entry point for unit-converter — keeps the other tools out of this chunk. */
export default function unitconverter() {
  return <UnitConverter />;
}
