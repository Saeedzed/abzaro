"use client";

import { HeavyTool } from "@/components/tools/HeavyTools";

/** Lazy entry point for pdf-compressor — keeps the other tools out of this chunk. */
export default function pdfcompressor() {
  return <HeavyTool slug="pdf-compressor" />;
}
