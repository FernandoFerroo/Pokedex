"use client";

import { Crown, ShieldHalf, Zap, type LucideIcon } from "lucide-react";
import { roundKey } from "@/lib/tournament/config";
import { useT } from "@/lib/i18n/client";
import { cn } from "@/lib/utils";
import {
  drawSize,
  type TournamentDifficulty,
  type TournamentFormat,
} from "@/types/tournament";
import type { CSSProperties } from "react";

/** Identity of each cup: the colour and the glyph carry the difficulty. */
const CUP_STYLE: Record<
  TournamentDifficulty,
  { edge: string; dot: string; Icon: LucideIcon }
> = {
  easy: { edge: "#22c55e", dot: "🟢", Icon: Zap },
  medium: { edge: "#fbbf24", dot: "🟡", Icon: ShieldHalf },
  hard: { edge: "#a855f7", dot: "🔴", Icon: Crown },
};

/**
 * One selectable cup in the tournament lobby: smoked glass framed in the
 * cup's neon, the round count as the headline number, and the exact road to
 * the final spelled out underneath so the size of the draw is never a
 * mystery. The chosen one burns bright; the others step back.
 */
export function CupCard({
  format,
  difficulty,
  selected,
  onSelect,
}: {
  format: TournamentFormat;
  difficulty: TournamentDifficulty;
  selected: boolean;
  onSelect: () => void;
}) {
  const t = useT().tournament;
  const { edge, dot, Icon } = CUP_STYLE[difficulty];
  const name = t.cupName[format];

  // The road to the final: one label per round, straight from the bracket's
  // own arithmetic, so "3 rondas" always reads as Cuartos → Semifinal → Final.
  const path = Array.from({ length: format }, (_, i) => {
    switch (roundKey(i + 1, format)) {
      case "final":
        return t.roundFinal;
      case "semi":
        return t.roundSemi;
      case "quarter":
        return t.roundQuarter;
      case "round16":
        return t.roundRound16;
      case "round32":
        return t.roundRound32;
      default:
        return t.roundPlain(i + 1);
    }
  });

  return (
    <button
      type="button"
      onClick={onSelect}
      aria-pressed={selected}
      aria-label={t.cupSelectAria(name)}
      style={{ "--edge": edge } as CSSProperties}
      className={cn(
        "lobby-panel lobby-bracket relative flex h-full flex-col gap-3 overflow-hidden rounded-3xl border p-5 text-left backdrop-blur-md transition duration-200",
        selected
          ? "border-[var(--edge)] bg-[color-mix(in_srgb,var(--edge)_10%,var(--color-hud-3))] opacity-100 shadow-[0_0_34px_-8px_var(--edge)] ring-2 ring-[var(--edge)] ring-offset-2 ring-offset-hud-0"
          : "border-[color-mix(in_srgb,var(--edge)_28%,transparent)] bg-hud-3/55 opacity-70 hover:-translate-y-0.5 hover:opacity-100 hover:shadow-[0_0_26px_-10px_var(--edge)]",
      )}
    >
      {/* Dificultad: emoji + palabra, para no dejar el dato solo en el color. */}
      <span className="flex items-center gap-2">
        <span className="inline-flex items-center gap-1.5 rounded-full border border-[color-mix(in_srgb,var(--edge)_50%,transparent)] bg-[color-mix(in_srgb,var(--edge)_14%,transparent)] px-2.5 py-1 font-mono text-[11px] font-bold tracking-[0.18em] text-[var(--edge)] uppercase">
          <span aria-hidden>{dot}</span>
          {t.difficultyBadge[difficulty]}
        </span>
        {selected && (
          <span className="ml-auto font-mono text-[10px] tracking-[0.2em] text-[var(--edge)] uppercase">
            ✓ {t.cupSelected}
          </span>
        )}
      </span>

      <span className="flex items-center gap-3">
        <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border border-[color-mix(in_srgb,var(--edge)_45%,transparent)] bg-[color-mix(in_srgb,var(--edge)_16%,transparent)] text-[var(--edge)] shadow-[0_0_18px_-6px_var(--edge)]">
          <Icon size={26} />
        </span>
        <span className="min-w-0">
          <span className="block font-display text-lg font-bold tracking-wide text-slate-100">
            {name}
          </span>
          <span className="block font-mono text-xs text-slate-400">
            {t.cupTrainers(drawSize(format))}
          </span>
        </span>
      </span>

      {/* El número de rondas es el dato que decide: tipografía de titular. */}
      <span className="flex items-baseline gap-2 border-y border-[color-mix(in_srgb,var(--edge)_22%,transparent)] py-2">
        <span className="font-display text-5xl leading-none font-black text-[var(--edge)] drop-shadow-[0_0_14px_color-mix(in_srgb,var(--edge)_60%,transparent)]">
          {format}
        </span>
        <span className="font-mono text-sm font-bold tracking-[0.22em] text-slate-300 uppercase">
          {t.roundsWord}
        </span>
      </span>

      <span className="block text-sm leading-relaxed text-slate-300">
        {t.cupDesc[format]}
      </span>

      <span className="mt-auto block">
        <span className="mb-1 block font-mono text-[10px] tracking-[0.2em] text-slate-500 uppercase">
          {t.cupPathLabel}
        </span>
        <span className="flex flex-wrap items-center gap-x-1.5 gap-y-1 font-mono text-[11px] text-slate-400">
          {path.map((label, i) => (
            <span key={label} className="inline-flex items-center gap-1.5">
              {i > 0 && (
                <span aria-hidden className="text-[var(--edge)]/70">
                  →
                </span>
              )}
              <span className={i === path.length - 1 ? "text-[var(--edge)]" : ""}>
                {label}
              </span>
            </span>
          ))}
        </span>
      </span>
    </button>
  );
}
