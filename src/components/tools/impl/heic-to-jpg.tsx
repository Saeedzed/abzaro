"use client";

import { HeavyTool } from "@/components/tools/HeavyTools";

/** Lazy entry point for heic-to-jpg — keeps the other tools out of this chunk. */
export default function heictojpg() {
  return <HeavyTool slug="heic-to-jpg" />;
}
