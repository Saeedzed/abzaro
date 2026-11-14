"use client";

import { useEffect } from "react";
import { rememberTool } from "@/lib/use-recent-tools";

/**
 * Invisible component that records "this tool was opened" for the homepage
 * «اخیراً استفاده کردید» strip. Client-only and fire-and-forget.
 */
export function RecentToolsTracker({ slug }: { slug: string }) {
  useEffect(() => {
    rememberTool(slug);
  }, [slug]);

  return null;
}
