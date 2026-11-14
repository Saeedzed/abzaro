/**
 * Tiny class-name joiner (clsx-style) — avoids an extra dependency.
 */
export function cn(
  ...classes: Array<string | false | null | undefined>
): string {
  return classes.filter(Boolean).join(" ");
}
