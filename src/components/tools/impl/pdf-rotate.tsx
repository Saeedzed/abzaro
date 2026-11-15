"use client";

import { PdfPageToolLoader } from "@/components/tools/HeavyTools";

/** Lazy entry point for pdf-rotate — keeps the other tools out of this chunk. */
export default function pdfrotate() {
  return <PdfPageToolLoader kind="rotate" />;
}
