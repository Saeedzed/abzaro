"use client";

import { HeavyTool } from "@/components/tools/HeavyTools";

/** Lazy entry point for video-resizer — keeps the other tools out of this chunk. */
export default function videoresizer() {
  return <HeavyTool slug="video-resizer" />;
}
