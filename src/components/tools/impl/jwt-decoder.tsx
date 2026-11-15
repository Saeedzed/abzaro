"use client";

import { JwtDecoder } from "@/components/tools/JwtDecoder";

/** Lazy entry point for jwt-decoder — keeps the other tools out of this chunk. */
export default function jwtdecoder() {
  return <JwtDecoder />;
}
