"use client";

import Link from "next/link";
import { ArrowRight, Swords } from "lucide-react";
import { TEAM_SIZE, useTeam } from "@/components/team/TeamProvider";
import { useT } from "@/lib/i18n/client";

/**
 * Home-page banner for the AI battle mode, the exclusive tier above the gold
 * team builder: the same molten frame, light sweep and layout as TeamCta,
 * recast in ember red. Title on the left, the rival's six hidden slots at the
 * center, and the red "Luchar" chip on the right. Every zone links to
 * /battle — the arena itself handles an empty team.
 */
export function BattleCta() {
  const t = useT().home;
  const { team } = useTeam();
  return (
    <Link
      href="/battle"
      aria-label={t.battleAria(team.length, TEAM_SIZE)}
      className="group elite-frame elite-sweep relative grid w-full grid-cols-[1fr_auto] items-center gap-x-4 gap-y-3.5 overflow-hidden rounded-xl px-3 py-2.5 transition max-sm:min-h-[46px] max-sm:gap-x-2 max-sm:px-2 max-sm:py-1.5 lg:grid-cols-[1fr_auto_1fr] sm:gap-5 sm:px-6 sm:py-5"
    >
      {/* Left: identity */}
      <span className="flex w-full min-w-0 items-center gap-2.5 justify-self-start text-left sm:gap-3.5">
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-red-500/50 bg-gradient-to-b from-red-500/25 to-red-500/5 text-red-400 shadow-[0_0_14px_-4px_rgba(239,68,68,0.8)] max-sm:h-7 max-sm:w-7 sm:h-12 sm:w-12">
          <Swords size={23} className="max-sm:h-[17px] max-sm:w-[17px]" />
        </span>
        <span className="flex min-w-0 flex-col gap-0.5">
          <span className="flex items-center gap-2 font-display text-base font-bold tracking-wide whitespace-nowrap max-sm:whitespace-normal max-sm:text-[12px] max-sm:leading-[1.15] sm:gap-2.5 sm:text-lg">
            <span className="elite-text truncate max-sm:overflow-visible max-sm:whitespace-normal">
              {t.battleTitle}
            </span>
            <span className="rounded-sm border border-red-500/60 bg-red-500/15 px-2 py-0.5 font-mono text-[11px] font-bold tracking-[0.2em] text-red-300 max-sm:hidden">
              {t.battleEliteBadge}
            </span>
          </span>
          <span className="cta-tagline hidden font-mono text-sm tracking-widest whitespace-nowrap text-red-200/50 uppercase md:block">
            {t.battleTagline}
          </span>
        </span>
      </span>

      {/* Center: the rival's six slots, hidden until the fight — mirrors the
          six team minis of the gold banner. On phones they move to their own
          centered second row, like there. */}
      <span
        aria-hidden
        className="hidden items-center gap-1.5 lg:flex lg:gap-2"
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

      {/* Right: readiness + the red "Luchar" chip. Same layering as the gold
          banner: above the chat launcher (z-30), below the header (z-[35]). */}
      <span className="relative z-[32] flex items-center gap-3 justify-self-end max-sm:gap-1.5">
        <span className="inline-flex items-center gap-2 rounded-md border border-red-500/40 bg-black/30 px-3 py-2.5 font-mono text-sm font-bold tracking-wider text-red-200/80 uppercase max-sm:hidden sm:px-4">
          {t.battleTeamCount(team.length, TEAM_SIZE)}
        </span>
        <span className="inline-flex items-center gap-2 rounded-md bg-gradient-to-b from-red-500 to-red-700 px-3 py-2 font-mono text-sm font-bold tracking-wider text-red-50 uppercase shadow-[0_0_18px_-4px_rgba(239,68,68,0.8)] transition group-hover:from-red-400 group-hover:to-red-600 group-hover:shadow-[0_0_24px_rgba(239,68,68,0.6)] sm:px-5 sm:py-2.5">
          {t.battleFight}
          <ArrowRight
            size={15}
            className="transition-transform group-hover:translate-x-0.5"
          />
        </span>
      </span>
    </Link>
  );
}
