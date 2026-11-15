"use client";

import { getToolBySlug } from "@/data/tools";
import { ToolPlaceholder } from "@/components/tools/ToolPlaceholder";
import { getToolComponent } from "@/components/tools/toolLoaders";

/**
 * Renders the tool for a slug, lazily.
 *
 * Why this is a Client Component: when `next/dynamic` is declared in a Server
 * Component, Next emits a preload for *every* candidate chunk in the HTML — a
 * text-tool page then downloads the PDF and video stacks too. Behind a client
 * boundary the imports stay lazy and only the rendered tool's chunk is fetched.
 */
export function ToolSlot({ slug }: { slug: string }) {
  const Component = getToolComponent(slug);
  if (Component) return <Component />;
  const tool = getToolBySlug(slug);
  return tool ? <ToolPlaceholder tool={tool} /> : null;
}
