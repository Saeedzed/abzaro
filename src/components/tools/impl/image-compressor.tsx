"use client";

import { ImageCompressor } from "@/components/tools/ImageCompressor";

/** Lazy entry point for image-compressor — keeps the other tools out of this chunk. */
export default function imagecompressor() {
  return <ImageCompressor />;
}
