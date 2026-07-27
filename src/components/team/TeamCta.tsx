"use client";

import Image from "next/image";
import { ArrowRight, Crown, Trash2 } from "lucide-react";
import { artworkUrl, typeAura } from "@/lib/pokemon-meta";
import { TEAM_SIZE, useTeam } from "@/components/team/TeamProvider";
import { useT } from "@/lib/i18n/client";
import type { CSSProperties } from "react";

/**
 * Home-page banner for the team drawer, dressed as the premium tier of the
 * Pokédex: molten-jade frame, crown badge and a slow light sweep. Title on
 * the left, the six slots mirrored in miniature at the center, and on the
 * right "Vaciar" next to the jade "Abrir" chip. A div with zone buttons —
 * not one big <button> — because "Vaciar" must not nest inside the open
 * control.
 */
export function TeamCta() {
  const t = useT().home;
  const { team, clear, setDrawerOpen } = useTeam();
  const open = () => setDrawerOpen(true);
  return (
    <div className="group team-frame team-sweep relative grid w-full grid-cols-[1fr_auto] items-center gap-x-4 gap-y-3.5 overflow-hidden rounded-xl px-3 py-2.5 transition max-sm:h-full max-sm:min-h-[44px] max-sm:grid-cols-1 max-sm:px-2 max-sm:py-1.5 lg:grid-cols-[1fr_auto_1fr] sm:gap-5 sm:px-6 sm:py-5">
      {/* Left: identity — opens the drawer */}
      <button
        type="button"
        onClick={open}
        aria-label={t.teamOpenBuilderAria(team.length, TEAM_SIZE)}
        className="flex w-full min-w-0 items-center gap-2.5 justify-self-start text-left max-sm:h-full sm:gap-3.5"
      >
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-emerald-400/50 bg-gradient-to-b from-emerald-400/25 to-emerald-400/5 text-emerald-300 shadow-[0_0_14px_-4px_rgba(16,185,129,0.8)] max-sm:h-7 max-sm:w-7 sm:h-12 sm:w-12">
          <Crown size={23} className="max-sm:h-[17px] max-sm:w-[17px]" />
        </span>
        <span className="flex min-w-0 flex-col gap-0.5">
          <span className="flex items-center gap-2 font-display text-base font-bold tracking-wide whitespace-nowrap max-sm:gap-1 max-sm:whitespace-normal max-sm:text-[12px] max-sm:leading-[1.15] sm:gap-2.5 sm:text-lg">
            <span className="team-text truncate max-sm:overflow-visible max-sm:whitespace-normal">
              {t.teamTitle}
            </span>
            <span className="text-emerald-300">
              {team.length}/{TEAM_SIZE}
            </span>
            <span className="rounded-sm border border-emerald-400/60 bg-emerald-400/15 px-2 py-0.5 font-mono text-[11px] font-bold tracking-[0.2em] text-emerald-300 max-sm:hidden">
              {t.teamProBadge}
            </span>
          </span>
          <span className="hidden font-mono text-sm tracking-widest text-emerald-200/50 uppercase md:block">
            {t.teamTagline}
          </span>
        </span>
      </button>

      {/* Center: the six slots in miniature — also opens the drawer. They
          need ~350px of their own, which only exists from `lg`; below that
          the banner is a two-column title/actions row and the slots live in
          the drawer. */}
      <button
        type="button"
        onClick={open}
        tabIndex={-1}
        aria-hidden
        className="hidden items-center gap-1.5 lg:flex lg:gap-2"
      >
        {Array.from({ length: TEAM_SIZE }, (_, i) => {
          const member = team[i];
          return member ? (
            <span
              key={member.id}
              style={{ "--aura": typeAura(member.types[0]) } as CSSProperties}
              className="relative h-9 w-9 rounded-full border border-[color-mix(in_srgb,var(--aura)_60%,transparent)] bg-black/60 shadow-[0_0_10px_-2px_var(--aura)] sm:h-12 sm:w-12"
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
              className="flex h-9 w-9 items-center justify-center rounded-full border border-dashed border-emerald-400/25 font-pixel text-[10px] text-emerald-200/40 transition group-hover:border-emerald-400/50 sm:h-12 sm:w-12"
            >
              {i + 1}
            </span>
          );
        })}
      </button>

      {/* Right: "Vaciar" + the "Abrir" chip. Raised above the floating chat
          launcher (z-30), which overlaps this corner on short viewports, but
          below the sticky header (z-[35]) so they slide under it on scroll. */}
      <span className="relative z-[32] flex items-center gap-3 justify-self-end max-sm:hidden">
        <button
          type="button"
          onClick={clear}
          disabled={team.length === 0}
          aria-label={t.teamClearAria}
          className="inline-flex items-center gap-2 rounded-md border border-emerald-400/40 bg-black/30 px-3 py-2.5 font-mono text-sm font-bold tracking-wider text-emerald-200/80 uppercase transition enabled:hover:border-red-500/60 enabled:hover:bg-red-500/10 enabled:hover:text-red-400 disabled:opacity-40 max-sm:hidden sm:px-4"
        >
          <Trash2 size={15} />
          {t.teamClear}
        </button>
        <button
          type="button"
          onClick={open}
          aria-label={t.teamOpenAria}
          className="inline-flex items-center gap-2 rounded-md bg-gradient-to-b from-emerald-500 to-emerald-700 px-3 py-2 font-mono text-sm font-bold tracking-wider text-emerald-50 uppercase shadow-[0_0_18px_-4px_rgba(16,185,129,0.8)] transition hover:from-emerald-400 hover:to-emerald-600 hover:shadow-[0_0_24px_rgba(16,185,129,0.6)] sm:px-5 sm:py-2.5"
        >
          {t.teamOpen}
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
 * every page now that the floating pill is gone. Wears the same jade livery
 * as the premium banner so it reads as the paid tier at a glance.
 */
export function TeamHeaderButton() {
  const t = useT().layout;
  const { team, setDrawerOpen } = useTeam();
  return (
    <button
      type="button"
      onClick={() => setDrawerOpen(true)}
      aria-label={t.openTeamAria(team.length, TEAM_SIZE)}
      className="inline-flex h-11 items-center gap-2 rounded-md border border-emerald-400/40 bg-emerald-400/[0.07] px-2.5 font-mono text-xs tracking-[0.2em] text-emerald-200 uppercase transition hover:border-emerald-300/70 hover:bg-emerald-400/15 hover:shadow-[0_0_14px_-2px_rgba(16,185,129,0.6)] sm:h-auto sm:px-3 sm:py-1.5"
    >
      <Crown size={14} className="text-emerald-300" />
      {/* En móvil solo corona + contador: deja sitio a los conmutadores. */}
      <span className="max-sm:hidden">{t.teamButton} </span>
      <span className="font-bold text-emerald-300">
        {team.length}/{TEAM_SIZE}
      </span>
    </button>
  );
}
