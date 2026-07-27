"use client";

import type { CSSProperties } from "react";
import { useI18n } from "@/lib/i18n/client";
import { typeAura, typeLabel } from "@/lib/pokemon-meta";
import { cn } from "@/lib/utils";

interface TypeBadgeProps {
  type: string;
  size?: "sm" | "md";
  /**
   * Shrinks the chip below `sm` so a dual-type pair fits on one line inside a
   * ~111px dex card, instead of wrapping and making those cards a row taller
   * than their single-type neighbours. Grid cards only.
   */
  compactOnMobile?: boolean;
}

/** Neon game-style chip: `.type-chip` derives its colors from `--type`.
 * Client component so the label follows the UI language everywhere without
 * threading `lang` through every call site. */
export function TypeBadge({
  type,
  size = "sm",
  compactOnMobile = false,
}: TypeBadgeProps) {
  const { lang } = useI18n();
  return (
    <span
      style={{ "--type": typeAura(type) } as CSSProperties}
      className={cn(
        "type-chip inline-flex items-center rounded font-mono font-semibold tracking-widest uppercase",
        size === "sm" ? "px-1.5 py-0.5 text-xs" : "px-2.5 py-1 text-xs",
        compactOnMobile &&
          "max-sm:px-1 max-sm:text-[10px] max-sm:tracking-normal",
      )}
    >
      {typeLabel(type, lang)}
    </span>
  );
}
