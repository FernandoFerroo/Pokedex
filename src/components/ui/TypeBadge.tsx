import type { CSSProperties } from "react";
import { typeAura, typeLabel } from "@/lib/pokemon-meta";
import { cn } from "@/lib/utils";

interface TypeBadgeProps {
  type: string;
  size?: "sm" | "md";
}

/** Neon game-style chip: `.type-chip` derives its colors from `--type`. */
export function TypeBadge({ type, size = "sm" }: TypeBadgeProps) {
  return (
    <span
      style={{ "--type": typeAura(type) } as CSSProperties}
      className={cn(
        "type-chip inline-flex items-center rounded font-mono font-semibold tracking-widest uppercase",
        size === "sm" ? "px-1.5 py-0.5 text-[10px]" : "px-2.5 py-1 text-xs",
      )}
    >
      {typeLabel(type)}
    </span>
  );
}
