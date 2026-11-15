"use client";

import { HeavyTool } from "@/components/tools/HeavyTools";

/** Lazy entry point for pdf-reorder — keeps the other tools out of this chunk. */
export default function pdfreorder() {
  return <HeavyTool slug="pdf-reorder" />;
}
