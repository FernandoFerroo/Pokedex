"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import { SIDE_A_COLOR, SIDE_B_COLOR } from "@/components/compare/DualRadar";
import type { StatDuel } from "@/lib/compare";
import { useI18n } from "@/lib/i18n/client";
import { STAT_LABELS } from "@/lib/stats";
import { cn } from "@/lib/utils";
import type { CSSProperties } from "react";

/**
 * Bar scale. 180 keeps ordinary stats readable across the full width; the
 * rare 200+ outlier simply pins to 100%, exactly like the detail sheet.
 */
const BAR_SCALE = 180;

function width(value: number): string {
  return `${Math.min(100, (value / BAR_SCALE) * 100)}%`;
}

/**
 * Facing progress bars, one row per base stat: Pokémon A grows leftwards
 * from the center, B rightwards. The winning side of each row lights up in
 * neon green with a chevron pointing at it, and the point gap sits under the
 * stat name — so who wins what is legible without reading a single number.
 */
export function StatFaceOff({
  duels,
  labelA,
  labelB,
}: {
  duels: StatDuel[];
  labelA: string;
  labelB: string;
}) {
  const { lang, dict } = useI18n();
  const t = dict.compare;
  const labels = STAT_LABELS[lang];

  return (
    <ul className="flex flex-col gap-3.5 max-sm:gap-2">
      {duels.map((duel) => {
        const label = labels[duel.name] ?? duel.name;
        const aWins = duel.winner === "a";
        const bWins = duel.winner === "b";
        return (
          <li
            key={duel.name}
            // Las dos barras enfrentadas son el gráfico: en el móvil encogen
            // las columnas fijas, no las barras, para que sigan estando.
            className="grid grid-cols-[3rem_1fr_6rem_1fr_3rem] items-center gap-2 max-sm:grid-cols-[1.6rem_1fr_3.4rem_1fr_1.6rem] max-sm:gap-1 sm:grid-cols-[3.5rem_1fr_8rem_1fr_3.5rem] sm:gap-3"
          >
            {/* Value A — in its own side's colour, glowing when it takes the row */}
            <span
              style={{ "--side": SIDE_A_COLOR } as CSSProperties}
              className={cn(
                "text-right font-mono text-lg font-bold tabular-nums max-sm:text-[11px] sm:text-xl",
                aWins
                  ? "text-[var(--side)] drop-shadow-[0_0_14px_color-mix(in_srgb,var(--side)_60%,transparent)]"
                  : "text-slate-300",
              )}
            >
              {duel.a}
            </span>

            {/* Bar A — grows from the center leftwards */}
            <span className="flex h-4 justify-end overflow-hidden rounded-l-sm bg-black/40 ring-1 ring-slate-700/80 max-sm:h-2.5 sm:h-5">
              <span
                style={
                  {
                    width: width(duel.a),
                    "--side": SIDE_A_COLOR,
                  } as CSSProperties
                }
                className={cn(
                  "duel-bar-left h-full rounded-l-sm transition-[width] duration-500",
                  aWins && "shadow-[0_0_14px_-1px_var(--side)]",
                )}
              />
            </span>

            {/* Stat name + point gap */}
            <span className="flex flex-col items-center leading-none">
              <span className="text-center font-mono text-sm font-semibold tracking-[0.14em] text-slate-300 uppercase max-sm:text-[8px] max-sm:leading-[1.15] max-sm:tracking-normal">
                {label}
              </span>
              {/* The gap rides in its own pill so the advantage reads at a
                  glance; the chevron points at the side that took the row,
                  which a bare ▲ could not say. */}
              <span
                className={cn(
                  "mt-1.5 inline-flex items-center gap-0.5 rounded-full px-2 py-0.5 font-mono text-sm font-bold max-sm:mt-0.5 max-sm:px-1 max-sm:text-[9px]",
                  duel.winner
                    ? "border border-emerald-400/50 bg-emerald-400/10 text-emerald-300"
                    : "text-slate-400",
                )}
              >
                {aWins && <ChevronLeft size={15} aria-hidden className="max-sm:h-2.5 max-sm:w-2.5" />}
                {duel.winner ? `+${duel.gap}` : t.tie}
                {bWins && <ChevronRight size={15} aria-hidden className="max-sm:h-2.5 max-sm:w-2.5" />}
              </span>
              {/* The chevron and the green tint carry the winner visually;
                  screen readers get it spelled out. */}
              {duel.winner && (
                <span className="sr-only">
                  {t.winnerAria(aWins ? labelA : labelB, label)}
                </span>
              )}
            </span>

            {/* Bar B — grows from the center rightwards */}
            <span className="flex h-4 overflow-hidden rounded-r-sm bg-black/40 ring-1 ring-slate-700/80 max-sm:h-2.5 sm:h-5">
              <span
                style={
                  {
                    width: width(duel.b),
                    "--side": SIDE_B_COLOR,
                  } as CSSProperties
                }
                className={cn(
                  "duel-bar h-full rounded-r-sm transition-[width] duration-500",
                  bWins && "shadow-[0_0_14px_-1px_var(--side)]",
                )}
              />
            </span>

            {/* Value B */}
            <span
              style={{ "--side": SIDE_B_COLOR } as CSSProperties}
              className={cn(
                "font-mono text-lg font-bold tabular-nums max-sm:text-[11px] sm:text-xl",
                bWins
                  ? "text-[var(--side)] drop-shadow-[0_0_14px_color-mix(in_srgb,var(--side)_60%,transparent)]"
                  : "text-slate-300",
              )}
            >
              {duel.b}
            </span>
          </li>
        );
      })}
    </ul>
  );
}
