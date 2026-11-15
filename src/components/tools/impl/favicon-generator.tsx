"use client";

import { HeavyTool } from "@/components/tools/HeavyTools";

/** Lazy entry point for favicon-generator — keeps the other tools out of this chunk. */
export default function favicongenerator() {
  return <HeavyTool slug="favicon-generator" />;
}
