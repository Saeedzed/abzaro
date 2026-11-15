"use client";

import { HeavyTool } from "@/components/tools/HeavyTools";

/** Lazy entry point for qr-code-generator — keeps the other tools out of this chunk. */
export default function qrcodegenerator() {
  return <HeavyTool slug="qr-code-generator" />;
}
