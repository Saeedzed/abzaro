"use client";

import { MonthCalendar } from "@/components/tools/MonthCalendar";

/** Lazy entry point for month-calendar — keeps the other tools out of this chunk. */
export default function monthcalendar() {
  return <MonthCalendar />;
}
