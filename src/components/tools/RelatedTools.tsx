import type { Tool } from "@/data/tools";
import { categoriesOf, tools } from "@/data/tools";
import { ToolGrid } from "@/components/tools/ToolGrid";

interface RelatedToolsProps {
  currentTool: Tool;
  limit?: number;
}

/**
 * Tools related to the current one: same-category tools first, then the most
 * popular remaining tools. The current tool is always excluded.
 */
export function RelatedTools({ currentTool, limit = 3 }: RelatedToolsProps) {
  const others = tools.filter((tool) => tool.id !== currentTool.id);
  const currentCategories = categoriesOf(currentTool);
  const sameCategory = others.filter((tool) =>
    categoriesOf(tool).some((slug) => currentCategories.includes(slug)),
  );
  const rest = others.filter((tool) => !sameCategory.includes(tool));
  const related = [...sameCategory, ...rest].slice(0, limit);

  if (related.length === 0) return null;

  return (
    <section aria-labelledby="related-tools-heading">
      <h2
        id="related-tools-heading"
        className="text-xl font-extrabold text-ink-900 sm:text-2xl"
      >
        ابزارهای مرتبط
      </h2>
      <ToolGrid tools={related} className="mt-6" />
    </section>
  );
}
