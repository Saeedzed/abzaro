"use client";

import { PersianLorem } from "@/components/tools/PersianLorem";

/** Lazy entry point for persian-lorem — keeps the other tools out of this chunk. */
export default function persianlorem() {
  return <PersianLorem />;
}
