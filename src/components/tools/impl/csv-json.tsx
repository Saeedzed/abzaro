"use client";

import { CsvJsonConverter } from "@/components/tools/CsvJsonConverter";

/** Lazy entry point for csv-json — keeps the other tools out of this chunk. */
export default function csvjson() {
  return <CsvJsonConverter />;
}
