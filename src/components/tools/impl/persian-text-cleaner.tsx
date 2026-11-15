"use client";

import { PersianTextCleaner } from "@/components/tools/PersianTextCleaner";

/** Lazy entry point for persian-text-cleaner — keeps the other tools out of this chunk. */
export default function persiantextcleaner() {
  return <PersianTextCleaner />;
}
