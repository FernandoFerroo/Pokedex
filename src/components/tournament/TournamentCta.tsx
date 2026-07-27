"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { ArrowRight, Crown, Trophy } from "lucide-react";
import { useT } from "@/lib/i18n/client";
import { loadRecord } from "@/lib/tournament/run";

/** Rounds of the default cup, mirrored in the banner's copy. */
const DEFAULT_ROUNDS = 4;

/**
 * Home-page banner for the tournament mode: the fourth exclusive tier, with
 * the same molten frame, light sweep and layout as the jade team builder and
 * the ember battle mode, worn in gold. Title on the left, the ladder's rungs
 * at the center and the gold "Competir" chip on the right.
 */
export function TournamentCta() {
  const t = useT().tournament;
  const [titles, setTitles] = useState(0);

  // The trophy count lives in localStorage, so it can only be read after the
  // client takes over — before that the chip simply isn't there.
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setTitles(loadRecord().titles);
  }, []);

  return (
    <Link
      href="/tournament"
      aria-label={t.ctaAria(DEFAULT_ROUNDS)}
      className="group premium-frame premium-sweep relative grid w-full grid-cols-[1fr_auto] items-center gap-x-4 gap-y-3.5 overflow-hidden rounded-xl px-3 py-2.5 transition max-sm:min-h-[46px] max-sm:gap-x-2 max-sm:px-2 max-sm:py-1.5 lg:grid-cols-[1fr_auto_1fr] sm:gap-5 sm:px-6 sm:py-5"
    >
      {/* Left: identity */}
      <span className="flex w-full min-w-0 items-center gap-2.5 justify-self-start text-left sm:gap-3.5">
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-amber-300/50 bg-gradient-to-b from-amber-300/25 to-amber-300/5 text-amber-200 shadow-[0_0_14px_-4px_rgba(251,191,36,0.8)] max-sm:h-7 max-sm:w-7 sm:h-12 sm:w-12">
          <Trophy size={23} className="max-sm:h-[17px] max-sm:w-[17px]" />
        </span>
        <span className="flex min-w-0 flex-col gap-0.5">
          <span className="flex items-center gap-2 font-display text-base font-bold tracking-wide whitespace-nowrap max-sm:whitespace-normal max-sm:text-[12px] max-sm:leading-[1.15] sm:gap-2.5 sm:text-lg">
            <span className="premium-text truncate max-sm:overflow-visible max-sm:whitespace-normal">
              {t.ctaTitle}
            </span>
            <span className="rounded-sm border border-amber-300/60 bg-amber-400/15 px-2 py-0.5 font-mono text-[11px] font-bold tracking-[0.2em] text-amber-200 max-sm:hidden">
              {t.ctaBadge}
            </span>
            {titles > 0 && (
              <span className="inline-flex items-center gap-1 rounded-sm border border-amber-200/60 bg-amber-300/20 px-2 py-0.5 font-mono text-[11px] font-bold tracking-[0.1em] text-amber-100 max-sm:hidden">
                <Crown size={11} />
                {t.ctaTitles(titles)}
              </span>
            )}
          </span>
          <span className="cta-tagline hidden font-mono text-sm tracking-widest whitespace-nowrap text-amber-200/50 uppercase md:block">
            {t.ctaTagline}
          </span>
        </span>
      </span>

      {/* Center: the rungs of the ladder, the same six-slot rhythm as its
          sibling banners — the last one is the cup itself. */}
      <span
        aria-hidden
        className="hidden items-center gap-1.5 lg:flex lg:gap-2"
      >
        {Array.from({ length: 5 }, (_, i) => (
          <span
            key={i}
            className="flex h-9 w-9 items-center justify-center rounded-full border border-dashed border-amber-300/25 bg-black/40 font-pixel text-[10px] text-amber-200/40 transition group-hover:border-amber-300/50 group-hover:text-amber-200/70 sm:h-12 sm:w-12"
          >
            {i + 1}
          </span>
        ))}
        <span className="flex h-9 w-9 items-center justify-center rounded-full border border-amber-300/50 bg-amber-400/10 text-amber-200 transition group-hover:border-amber-200/80 sm:h-12 sm:w-12">
          <Crown size={18} />
        </span>
      </span>

      {/* Right: the format chip + the gold "Competir" chip. Same layering as
          the other banners: above the chat launcher (z-30), below the header. */}
      <span className="relative z-[32] flex items-center gap-3 justify-self-end max-sm:gap-1.5">
        <span className="inline-flex items-center gap-2 rounded-md border border-amber-300/40 bg-black/30 px-3 py-2.5 font-mono text-sm font-bold tracking-wider text-amber-200/80 uppercase max-sm:hidden sm:px-4">
          {t.ctaRounds(DEFAULT_ROUNDS)}
        </span>
        <span className="inline-flex items-center gap-2 rounded-md bg-gradient-to-b from-amber-400 to-amber-600 px-3 py-2 font-mono text-sm font-bold tracking-wider text-amber-50 uppercase shadow-[0_0_18px_-4px_rgba(251,191,36,0.8)] transition group-hover:from-amber-300 group-hover:to-amber-500 group-hover:shadow-[0_0_24px_rgba(251,191,36,0.6)] sm:px-5 sm:py-2.5">
          {t.ctaOpen}
          <ArrowRight
            size={15}
            className="transition-transform group-hover:translate-x-0.5"
          />
        </span>
      </span>
    </Link>
  );
}
