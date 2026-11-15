"use client";

import { SingleIranianValidator } from "@/components/tools/IranianValidator";

/**
 * One module for the six Iranian validators: each page renders a single field,
 * so a shared component keeps them out of six near-identical files.
 */
export default function IranianValidatorImpl({ kind }: { kind?: string }) {
  return <SingleIranianValidator kind={kind ?? "national-id"} />;
}
