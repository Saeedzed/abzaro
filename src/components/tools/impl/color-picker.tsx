"use client";

import { ColorPicker } from "@/components/tools/ColorPicker";

/** Lazy entry point for color-picker — keeps the other tools out of this chunk. */
export default function colorpicker() {
  return <ColorPicker />;
}
