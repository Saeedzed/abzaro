"use client";

import { EidiSanavatCalculator } from "@/components/tools/EidiSanavatCalculator";

/** Lazy entry point for eidi-sanavat — keeps the other tools out of this chunk. */
export default function eidisanavat() {
  return <EidiSanavatCalculator />;
}
