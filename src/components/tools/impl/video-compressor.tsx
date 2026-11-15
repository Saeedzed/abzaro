"use client";

import { HeavyTool } from "@/components/tools/HeavyTools";

/** Lazy entry point for video-compressor — keeps the other tools out of this chunk. */
export default function videocompressor() {
  return <HeavyTool slug="video-compressor" />;
}
