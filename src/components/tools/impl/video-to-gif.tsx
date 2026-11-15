"use client";

import { HeavyTool } from "@/components/tools/HeavyTools";

/** Lazy entry point for video-to-gif — keeps the other tools out of this chunk. */
export default function videotogif() {
  return <HeavyTool slug="video-to-gif" />;
}
