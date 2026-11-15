"use client";

import { TimestampConverter } from "@/components/tools/TimestampConverter";

/** Lazy entry point for timestamp-converter — keeps the other tools out of this chunk. */
export default function timestampconverter() {
  return <TimestampConverter />;
}
