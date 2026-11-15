"use client";

import { ImageFormatConverter } from "@/components/tools/ImageFormatConverter";

/** Lazy entry point for image-format-converter — keeps the other tools out of this chunk. */
export default function imageformatconverter() {
  return <ImageFormatConverter />;
}
