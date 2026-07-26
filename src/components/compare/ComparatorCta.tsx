"use client";

import Link from "next/link";
import { ArrowRight, GitCompareArrows } from "lucide-react";
import { useT } from "@/lib/i18n/client";

/**
 * Home-page banner for the AI comparator, the third exclusive tier above the
 * gold team builder and the ember battle arena: identical frame, sweep and
 * layout, recast in electric blue. Title on the left, the two duel slots with
 * the VS clash at the center, and the blue "Comparar" chip on the right.
 * Every zone links to /compare.
 */
export function ComparatorCta() {
  const t = useT().home;
  return (
    <Link
      href="/compare"
      aria-label={t.compareAria}
      className="group legend-frame legend-sweep relative grid w-full grid-cols-[1fr_auto] items-center gap-x-4 gap-y-3.5 overflow-hidden rounded-xl px-3 py-2.5 transition max-sm:h-full max-sm:min-h-[44px] max-sm:grid-cols-1 max-sm:px-2 max-sm:py-1.5 lg:grid-cols-[1fr_auto_1fr] sm:gap-5 sm:px-6 sm:py-5"
    >
      {/* Left: identity */}
      <span className="flex w-full min-w-0 items-center gap-2.5 justify-self-start text-left sm:gap-3.5">
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-sky-400/50 bg-gradient-to-b from-sky-400/25 to-sky-400/5 text-sky-300 shadow-[0_0_14px_-4px_rgba(56,189,248,0.8)] max-sm:h-7 max-sm:w-7 sm:h-12 sm:w-12">
          <GitCompareArrows size={23} className="max-sm:h-[17px] max-sm:w-[17px]" />
        </span>
        <span className="flex min-w-0 flex-col gap-0.5">
          <span className="flex items-center gap-2 font-display text-base font-bold tracking-wide whitespace-nowrap max-sm:whitespace-normal max-sm:text-[12px] max-sm:leading-[1.15] sm:gap-2.5 sm:text-lg">
            <span className="legend-text truncate max-sm:overflow-visible max-sm:whitespace-normal">
              {t.compareTitle}
            </span>
            <span className="rounded-sm border border-sky-400/60 bg-sky-400/15 px-2 py-0.5 font-mono text-[11px] font-bold tracking-[0.2em] text-sky-300 max-sm:hidden">
              {t.compareBadge}
            </span>
          </span>
          <span className="hidden font-mono text-sm tracking-widest whitespace-nowrap text-sky-300/60 uppercase md:block">
            {t.compareTagline}
          </span>
        </span>
      </span>

      {/* Center: the two duel slots with the VS clash between them — the
          comparator's answer to the six team minis of the other banners. On
          phones they hide, like there. */}
      <span
        aria-hidden
        className="hidden items-center gap-3 lg:flex lg:gap-4"
      >
        <span className="flex h-9 w-9 items-center justify-center rounded-full border border-dashed border-sky-400/30 bg-black/40 font-pixel text-[10px] text-sky-300/50 transition group-hover:border-sky-400/60 group-hover:text-sky-300/80 sm:h-12 sm:w-12">
          A
        </span>
        <span className="font-display text-base font-black tracking-tighter text-sky-300 drop-shadow-[0_0_10px_rgba(56,189,248,0.8)] transition group-hover:scale-110 sm:text-xl">
          VS
        </span>
        <span className="flex h-9 w-9 items-center justify-center rounded-full border border-dashed border-sky-400/30 bg-black/40 font-pixel text-[10px] text-sky-300/50 transition group-hover:border-sky-400/60 group-hover:text-sky-300/80 sm:h-12 sm:w-12">
          B
        </span>
      </span>

      {/* Right: the mode chip + the blue "Comparar" chip. Same layering as the
          other banners: above the chat launcher (z-30), below the header. */}
      <span className="relative z-[32] flex items-center gap-3 justify-self-end max-sm:hidden">
        <span className="inline-flex items-center gap-2 rounded-md border border-sky-400/40 bg-black/30 px-3 py-2.5 font-mono text-sm font-bold tracking-wider text-sky-300/80 uppercase max-sm:hidden sm:px-4">
          {t.compareDuel}
        </span>
        <span className="inline-flex items-center gap-2 rounded-md bg-gradient-to-b from-sky-400 to-blue-600 px-3 py-2 font-mono text-sm font-bold tracking-wider text-sky-50 uppercase shadow-[0_0_18px_-4px_rgba(56,189,248,0.8)] transition group-hover:from-sky-300 group-hover:to-blue-500 group-hover:shadow-[0_0_24px_rgba(56,189,248,0.6)] sm:px-5 sm:py-2.5">
          {t.compareOpen}
          <ArrowRight
            size={15}
            className="transition-transform group-hover:translate-x-0.5"
          />
        </span>
      </span>
    </Link>
  );
}
