"use client";

import type { CSSProperties } from "react";
import { useI18n } from "@/lib/i18n/client";
import { typeAura, typeLabel } from "@/lib/pokemon-meta";
import { cn } from "@/lib/utils";

interface TypeBadgeProps {
  type: string;
  size?: "sm" | "md";
  /**
   * Shrinks the chip below `sm` so it fits inside a ~54px dex card, where the
   * six-per-row grid leaves room for the primary type and nothing else.
   * Grid cards only.
   */
  compactOnMobile?: boolean;
  /** Extra classes from the call site (hiding it at a breakpoint, mostly). */
  className?: string;
}

/** Neon game-style chip: `.type-chip` derives its colors from `--type`.
 * Client component so the label follows the UI language everywhere without
 * threading `lang` through every call site. */
export function TypeBadge({
  type,
  size = "sm",
  compactOnMobile = false,
  className,
}: TypeBadgeProps) {
  const { lang } = useI18n();
  return (
    <span
      style={{ "--type": typeAura(type) } as CSSProperties}
      className={cn(
        "type-chip inline-flex items-center rounded font-mono font-semibold tracking-widest uppercase",
        size === "sm" ? "px-1.5 py-0.5 text-xs" : "px-2.5 py-1 text-xs",
        compactOnMobile &&
          "max-sm:truncate max-sm:px-0.5 max-sm:text-[7px] max-sm:leading-[1.4] max-sm:tracking-normal",
        className,
      )}
    >
      {typeLabel(type, lang)}
    </span>
  );
}
