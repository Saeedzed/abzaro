/** Placeholder shown while a tool's code chunk streams in — same height, no jump. */
export default function ToolSkeleton() {
  return (
    <div
      className="h-64 animate-pulse rounded-2xl border border-ink-200 bg-white/70"
      aria-hidden="true"
    />
  );
}
