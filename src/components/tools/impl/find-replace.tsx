"use client";

import { FindReplace } from "@/components/tools/FindReplace";

/** Lazy entry point for find-replace — keeps the other tools out of this chunk. */
export default function findreplace() {
  return <FindReplace />;
}
