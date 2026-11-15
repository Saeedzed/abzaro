"use client";

import { DateConverter } from "@/components/tools/DateConverter";

/** Lazy entry point for date-converter — keeps the other tools out of this chunk. */
export default function dateconverter() {
  return <DateConverter />;
}
