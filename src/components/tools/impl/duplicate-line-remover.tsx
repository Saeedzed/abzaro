"use client";

import { DuplicateLineRemover } from "@/components/tools/DuplicateLineRemover";

/** Lazy entry point for duplicate-line-remover — keeps the other tools out of this chunk. */
export default function duplicatelineremover() {
  return <DuplicateLineRemover />;
}
