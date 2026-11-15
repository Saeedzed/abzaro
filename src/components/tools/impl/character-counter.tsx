"use client";

import { CharacterCounter } from "@/components/tools/CharacterCounter";

/** Lazy entry point for character-counter — keeps the other tools out of this chunk. */
export default function charactercounter() {
  return <CharacterCounter />;
}
