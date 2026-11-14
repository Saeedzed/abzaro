import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

type IconTileSize = "sm" | "md" | "lg";

const SIZES: Record<IconTileSize, { box: string; icon: string; radius: string }> = {
  sm: { box: "h-9 w-9", icon: "h-4 w-4", radius: "rounded-lg" },
  md: { box: "h-11 w-11", icon: "h-5 w-5", radius: "rounded-xl" },
  lg: { box: "h-14 w-14", icon: "h-7 w-7", radius: "rounded-2xl" },
};

interface IconTileProps {
  icon: LucideIcon;
  /** Defaults to `md` (the size used on cards). */
  size?: IconTileSize;
  /** Solid brand tile instead of the soft tinted one. */
  solid?: boolean;
  /** Animate to the solid brand state when a parent `.group` is hovered. */
  hoverSolid?: boolean;
  className?: string;
}

/**
 * The single icon-tile treatment used across the whole site: one radius, one
 * size scale, one hover behaviour. Keeps category, tool and feature icons
 * visually identical instead of drifting per component.
 */
export function IconTile({
  icon: Icon,
  size = "md",
  solid = false,
  hoverSolid = false,
  className,
}: IconTileProps) {
  const s = SIZES[size];
  return (
    <span
      className={cn(
        "flex shrink-0 items-center justify-center transition-colors duration-200",
        s.box,
        s.radius,
        solid
          ? "bg-brand-600 text-white shadow-card"
          : "bg-brand-50 text-brand-600",
        !solid &&
          hoverSolid &&
          "group-hover:bg-brand-600 group-hover:text-white",
        className,
      )}
    >
      <Icon className={s.icon} aria-hidden="true" />
    </span>
  );
}
