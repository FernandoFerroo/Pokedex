"use client";

import Image from "next/image";
import { ArrowRight, Crown, Trash2 } from "lucide-react";
import { artworkUrl, typeAura } from "@/lib/pokemon-meta";
import { TEAM_SIZE, useTeam } from "@/components/team/TeamProvider";
import type { CSSProperties } from "react";

/**
 * Home-page banner for the team drawer, dressed as the premium tier of the
 * Pokédex: molten-gold frame, crown badge and a slow light sweep. Title on
 * the left, the six slots mirrored in miniature at the center, and on the
 * right "Vaciar" next to the gold "Abrir" chip. A div with zone buttons —
 * not one big <button> — because "Vaciar" must not nest inside the open
 * control.
 */
export function TeamCta() {
  const { team, clear, setDrawerOpen } = useTeam();
  const open = () => setDrawerOpen(true);
  return (
    <div className="group premium-frame premium-sweep relative grid w-full grid-cols-[1fr_auto] items-center gap-5 overflow-hidden rounded-xl px-6 py-5 transition sm:grid-cols-[1fr_auto_1fr]">
      {/* Left: identity — opens the drawer */}
      <button
        type="button"
        onClick={open}
        aria-label={`Abrir el creador de equipos (${team.length} de ${TEAM_SIZE} ranuras ocupadas)`}
        className="flex w-full items-center gap-3.5 justify-self-start text-left"
      >
        <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg border border-amber-400/50 bg-gradient-to-b from-amber-400/25 to-amber-400/5 text-amber-300 shadow-[0_0_14px_-4px_rgba(251,191,36,0.8)]">
          <Crown size={23} />
        </span>
        <span className="flex flex-col gap-0.5">
          <span className="flex items-center gap-2.5 font-display text-lg font-bold tracking-wide">
            <span className="premium-text">MI EQUIPO</span>
            <span className="text-amber-300">
              {team.length}/{TEAM_SIZE}
            </span>
            <span className="rounded-sm border border-amber-400/60 bg-amber-400/15 px-2 py-0.5 font-mono text-[11px] font-bold tracking-[0.2em] text-amber-300">
              PRO
            </span>
          </span>
          <span className="hidden font-mono text-sm tracking-widest text-amber-200/50 uppercase md:block">
            Cobertura · Análisis · Coach IA
          </span>
        </span>
      </button>

      {/* Center: the six slots in miniature — also opens the drawer */}
      <button
        type="button"
        onClick={open}
        tabIndex={-1}
        aria-hidden
        className="hidden items-center gap-2 sm:flex"
      >
        {Array.from({ length: TEAM_SIZE }, (_, i) => {
          const member = team[i];
          return member ? (
            <span
              key={member.id}
              style={{ "--aura": typeAura(member.types[0]) } as CSSProperties}
              className="relative h-12 w-12 rounded-full border border-[color-mix(in_srgb,var(--aura)_60%,transparent)] bg-black/60 shadow-[0_0_10px_-2px_var(--aura)]"
            >
              <Image
                src={artworkUrl(member.id)}
                alt=""
                fill
                sizes="48px"
                className="object-contain p-0.5"
              />
            </span>
          ) : (
            <span
              key={`empty-${i}`}
              className="flex h-12 w-12 items-center justify-center rounded-full border border-dashed border-amber-400/25 font-pixel text-[10px] text-amber-200/40 transition group-hover:border-amber-400/50"
            >
              {i + 1}
            </span>
          );
        })}
      </button>

      {/* Right: "Vaciar" + the "Abrir" chip. Raised above the floating chat
          launcher (z-30), which overlaps this corner on short viewports. */}
      <span className="relative z-40 flex items-center gap-3 justify-self-end">
        <button
          type="button"
          onClick={clear}
          disabled={team.length === 0}
          aria-label="Vaciar el equipo"
          className="inline-flex items-center gap-2 rounded-md border border-amber-400/40 bg-black/30 px-4 py-2.5 font-mono text-sm font-bold tracking-wider text-amber-200/80 uppercase transition enabled:hover:border-red-500/60 enabled:hover:bg-red-500/10 enabled:hover:text-red-400 disabled:opacity-40"
        >
          <Trash2 size={15} />
          Vaciar
        </button>
        <button
          type="button"
          onClick={open}
          aria-label="Abrir el creador de equipos"
          className="inline-flex items-center gap-2 rounded-md bg-gradient-to-b from-amber-300 to-amber-500 px-5 py-2.5 font-mono text-sm font-bold tracking-wider text-[#1c1204] uppercase shadow-[0_0_18px_-4px_rgba(251,191,36,0.8)] transition hover:from-amber-200 hover:to-amber-400 hover:shadow-[0_0_24px_rgba(251,191,36,0.6)]"
        >
          Abrir
          <ArrowRight
            size={15}
            className="transition-transform group-hover:translate-x-0.5"
          />
        </button>
      </span>
    </div>
  );
}

/**
 * Compact team chip for the global header: keeps the drawer reachable from
 * every page now that the floating pill is gone. Wears the same gold livery
 * as the premium banner so it reads as the paid tier at a glance.
 */
export function TeamHeaderButton() {
  const { team, setDrawerOpen } = useTeam();
  return (
    <button
      type="button"
      onClick={() => setDrawerOpen(true)}
      aria-label={`Abrir el equipo (${team.length} de ${TEAM_SIZE})`}
      className="inline-flex items-center gap-2 rounded-md border border-amber-400/40 bg-amber-400/[0.07] px-3 py-1.5 font-mono text-xs tracking-[0.2em] text-amber-200 uppercase transition hover:border-amber-300/70 hover:bg-amber-400/15 hover:shadow-[0_0_14px_-2px_rgba(251,191,36,0.6)]"
    >
      <Crown size={14} className="text-amber-300" />
      Equipo{" "}
      <span className="font-bold text-amber-300">
        {team.length}/{TEAM_SIZE}
      </span>
    </button>
  );
}
