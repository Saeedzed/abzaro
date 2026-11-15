"use client";

import { LineSorter } from "@/components/tools/LineSorter";

/** Lazy entry point for line-sorter — keeps the other tools out of this chunk. */
export default function linesorter() {
  return <LineSorter />;
}
