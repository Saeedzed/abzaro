"use client";

import { ImageResizer } from "@/components/tools/ImageResizer";

/** Lazy entry point for image-resizer — keeps the other tools out of this chunk. */
export default function imageresizer() {
  return <ImageResizer />;
}
