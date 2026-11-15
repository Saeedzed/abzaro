"use client";

import { PdfPageToolLoader } from "@/components/tools/HeavyTools";

/** Lazy entry point for pdf-delete-pages — keeps the other tools out of this chunk. */
export default function pdfdeletepages() {
  return <PdfPageToolLoader kind="delete" />;
}
