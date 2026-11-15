"use client";

import { HeavyTool } from "@/components/tools/HeavyTools";

/** Lazy entry point for image-to-pdf — keeps the other tools out of this chunk. */
export default function imagetopdf() {
  return <HeavyTool slug="image-to-pdf" />;
}
