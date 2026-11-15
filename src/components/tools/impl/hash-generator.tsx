"use client";

import { HashGenerator } from "@/components/tools/HashGenerator";

/** Lazy entry point for hash-generator — keeps the other tools out of this chunk. */
export default function hashgenerator() {
  return <HashGenerator />;
}
