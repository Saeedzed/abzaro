"use client";

import { HeavyTool } from "@/components/tools/HeavyTools";

/** Lazy entry point for pdf-to-image — keeps the other tools out of this chunk. */
export default function pdftoimage() {
  return <HeavyTool slug="pdf-to-image" />;
}
