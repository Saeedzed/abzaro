"use client";

import { PasswordGenerator } from "@/components/tools/PasswordGenerator";

/** Lazy entry point for password-generator — keeps the other tools out of this chunk. */
export default function passwordgenerator() {
  return <PasswordGenerator />;
}
