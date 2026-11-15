"use client";

import { ImageCropper } from "@/components/tools/ImageCropper";

/** Lazy entry point for image-crop — keeps the other tools out of this chunk. */
export default function imagecrop() {
  return <ImageCropper />;
}
