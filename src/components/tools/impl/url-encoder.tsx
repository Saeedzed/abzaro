"use client";

import { UrlEncoder } from "@/components/tools/UrlEncoder";

/** Lazy entry point for url-encoder — keeps the other tools out of this chunk. */
export default function urlencoder() {
  return <UrlEncoder />;
}
