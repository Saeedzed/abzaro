import type { Tool } from "@/data/tools";
import { ToolCard } from "@/components/tools/ToolCard";
import { cn } from "@/lib/utils";

interface ToolGridProps {
  tools: Tool[];
  className?: string;
}

/** Responsive grid of tool cards. */
export function ToolGrid({ tools, className }: ToolGridProps) {
  return (
    <div
      className={cn(
        "grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-5 lg:grid-cols-3",
        className,
      )}
    >
      {tools.map((tool) => (
        <ToolCard key={tool.id} tool={tool} />
      ))}
    </div>
  );
}
