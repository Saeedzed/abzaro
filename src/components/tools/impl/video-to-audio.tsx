"use client";

import { HeavyTool } from "@/components/tools/HeavyTools";

/** Lazy entry point for video-to-audio — keeps the other tools out of this chunk. */
export default function videotoaudio() {
  return <HeavyTool slug="video-to-audio" />;
}
