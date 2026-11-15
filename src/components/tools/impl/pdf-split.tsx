"use client";

import { PdfPageToolLoader } from "@/components/tools/HeavyTools";

/** Lazy entry point for pdf-split — keeps the other tools out of this chunk. */
export default function pdfsplit() {
  return <PdfPageToolLoader kind="split" />;
}
