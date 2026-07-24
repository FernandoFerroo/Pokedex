"use client";

import Link from "next/link";
import { ArrowRight, Swords } from "lucide-react";
import { TEAM_SIZE, useTeam } from "@/components/team/TeamProvider";

/**
 * Home-page banner for the AI battle mode, the exclusive tier above the gold
 * team builder: the same molten frame, light sweep and layout as TeamCta,
 * recast in ember red. Title on the left, the rival's six hidden slots at the
 * center, and the red "Luchar" chip on the right. Every zone links to
 * /battle — the arena itself handles an empty team.
 */
export function BattleCta() {
  const { team } = useTeam();
  return (
    <Link
      href="/battle"
      aria-label={`Entrar al Modo Combate contra la IA (${team.length} de ${TEAM_SIZE} miembros en tu equipo)`}
      className="group elite-frame elite-sweep relative grid w-full grid-cols-[1fr_auto] items-center gap-x-4 gap-y-3.5 overflow-hidden rounded-xl px-4 py-4 transition sm:grid-cols-[1fr_auto_1fr] sm:gap-5 sm:px-6 sm:py-5"
    >
      {/* Left: identity */}
      <span className="flex w-full items-center gap-3.5 justify-self-start text-left">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-red-500/50 bg-gradient-to-b from-red-500/25 to-red-500/5 text-red-400 shadow-[0_0_14px_-4px_rgba(239,68,68,0.8)] sm:h-12 sm:w-12">
          <Swords size={23} />
        </span>
        <span className="flex flex-col gap-0.5">
          <span className="flex items-center gap-2 font-display text-base font-bold tracking-wide whitespace-nowrap sm:gap-2.5 sm:text-lg">
            <span className="elite-text">COMBATE IA</span>
            <span className="rounded-sm border border-red-500/60 bg-red-500/15 px-2 py-0.5 font-mono text-[11px] font-bold tracking-[0.2em] text-red-300 max-sm:hidden">
              ELITE
            </span>
          </span>
          <span className="hidden font-mono text-sm tracking-widest whitespace-nowrap text-red-200/50 uppercase md:block">
            Arena 3D · Rival IA · Turnos
          </span>
        </span>
      </span>

      {/* Center: the rival's six slots, hidden until the fight — mirrors the
          six team minis of the gold banner. On phones they move to their own
          centered second row, like there. */}
      <span
        aria-hidden
        className="flex items-center gap-1.5 max-sm:order-3 max-sm:col-span-2 max-sm:justify-center sm:gap-2"
      >
        {Array.from({ length: TEAM_SIZE }, (_, i) => (
          <span
            key={i}
            className="flex h-9 w-9 items-center justify-center rounded-full border border-dashed border-red-500/25 bg-black/40 font-pixel text-[10px] text-red-300/40 transition group-hover:border-red-500/50 group-hover:text-red-300/70 sm:h-12 sm:w-12"
          >
            ?
          </span>
        ))}
      </span>

      {/* Right: readiness + the red "Luchar" chip. */}
      <span className="relative z-40 flex items-center gap-3 justify-self-end">
        <span className="inline-flex items-center gap-2 rounded-md border border-red-500/40 bg-black/30 px-3 py-2.5 font-mono text-sm font-bold tracking-wider text-red-200/80 uppercase max-sm:hidden sm:px-4">
          Equipo {team.length}/{TEAM_SIZE}
        </span>
        <span className="inline-flex items-center gap-2 rounded-md bg-gradient-to-b from-red-500 to-red-700 px-4 py-2.5 font-mono text-sm font-bold tracking-wider text-red-50 uppercase shadow-[0_0_18px_-4px_rgba(239,68,68,0.8)] transition group-hover:from-red-400 group-hover:to-red-600 group-hover:shadow-[0_0_24px_rgba(239,68,68,0.6)] sm:px-5">
          Luchar
          <ArrowRight
            size={15}
            className="transition-transform group-hover:translate-x-0.5"
          />
        </span>
      </span>
    </Link>
  );
}
