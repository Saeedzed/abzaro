"use client";

import { JsonFormatter } from "@/components/tools/JsonFormatter";

/** Lazy entry point for json-formatter — keeps the other tools out of this chunk. */
export default function jsonformatter() {
  return <JsonFormatter />;
}
