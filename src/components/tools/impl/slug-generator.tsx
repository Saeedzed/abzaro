"use client";

import { SlugGenerator } from "@/components/tools/SlugGenerator";

/** Lazy entry point for slug-generator — keeps the other tools out of this chunk. */
export default function sluggenerator() {
  return <SlugGenerator />;
}
