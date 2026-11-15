"use client";

import { HeavyTool } from "@/components/tools/HeavyTools";

/** Lazy entry point for pdf-merger — keeps the other tools out of this chunk. */
export default function pdfmerger() {
  return <HeavyTool slug="pdf-merger" />;
}
