"use client";

import { useEffect, useState } from "react";
import { MAX_FILE_BYTES, deviceMaxFileBytes, formatBytes } from "@/lib/image";

/**
 * Shows the upload limit that fits THIS device (based on `deviceMemory`).
 *
 * Starts with the standard 25 MB so the server-rendered HTML and the first
 * client render match, then refines after mount — no hydration mismatch.
 */
export function DeviceLimitLabel() {
  const [label, setLabel] = useState(() => formatBytes(MAX_FILE_BYTES));

  useEffect(() => {
    setLabel(formatBytes(deviceMaxFileBytes()));
  }, []);

  return <>{label}</>;
}
