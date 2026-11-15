"use client";

import { HeavyTool } from "@/components/tools/HeavyTools";

/** Lazy entry point for video-trimmer — keeps the other tools out of this chunk. */
export default function videotrimmer() {
  return <HeavyTool slug="video-trimmer" />;
}
