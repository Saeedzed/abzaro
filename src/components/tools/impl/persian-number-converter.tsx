"use client";

import { PersianNumberConverter } from "@/components/tools/PersianNumberConverter";

/** Lazy entry point for persian-number-converter — keeps the other tools out of this chunk. */
export default function persiannumberconverter() {
  return <PersianNumberConverter />;
}
