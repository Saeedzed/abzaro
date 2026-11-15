"use client";

import { HeavyTool } from "@/components/tools/HeavyTools";

/** Lazy entry point for pdf-watermark — keeps the other tools out of this chunk. */
export default function pdfwatermark() {
  return <HeavyTool slug="pdf-watermark" />;
}
