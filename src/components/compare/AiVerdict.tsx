"use client";

import Image from "next/image";
import { Bot, Crown, Minus, Sparkles, TriangleAlert } from "lucide-react";
import { SIDE_A_COLOR, SIDE_B_COLOR } from "@/components/compare/DualRadar";
import { useI18n } from "@/lib/i18n/client";
import { artworkUrl } from "@/lib/pokemon-meta";
import { cn } from "@/lib/utils";
import type { CSSProperties } from "react";
import type { ComparePokemon, CompareVerdict } from "@/types/compare";

/**
 * The analyst's take, dressed as a dictum rather than a paragraph: the
 * favourite gets a portrait and the side's color, the reasoning gets room to
 * breathe, and each takeaway is a numbered card.
 */
export function AiVerdict({
  a,
  b,
  verdict,
  pending,
  error,
  onAsk,
}: {
  a: ComparePokemon;
  b: ComparePokemon;
  verdict: CompareVerdict | null;
  pending: boolean;
  error: string | null;
  onAsk: () => void;
}) {
  const t = useI18n().dict.compare;
  const favourite =
    verdict?.ganador === "a" ? a : verdict?.ganador === "b" ? b : null;
  const color =
    verdict?.ganador === "a"
      ? SIDE_A_COLOR
      : verdict?.ganador === "b"
        ? SIDE_B_COLOR
        : "#94a3b8";

  return (
    <section
      style={{ "--side": color } as CSSProperties}
      className="rounded-2xl border border-sky-400/30 bg-hud-3/80 px-4 py-5 shadow-[0_0_36px_rgba(0,0,0,0.45)] sm:px-6 sm:py-6"
    >
      <h2 className="flex items-center gap-2.5 font-display text-base font-bold tracking-wide text-slate-100 sm:text-lg">
        <span className="flex h-9 w-9 items-center justify-center rounded-lg border border-sky-400/50 bg-sky-400/10 text-sky-300">
          <Bot size={19} />
        </span>
        {t.aiTitle}
      </h2>

      {verdict ? (
        <div className="mt-5 flex flex-col gap-5">
          {/* Favourite banner: portrait, crown and the analyst's call. */}
          <div className="flex items-center gap-4 rounded-xl border border-[color-mix(in_srgb,var(--side)_45%,transparent)] bg-[color-mix(in_srgb,var(--side)_8%,transparent)] p-4">
            <span className="relative h-16 w-16 shrink-0 sm:h-20 sm:w-20">
              {favourite ? (
                <Image
                  src={artworkUrl(favourite.id)}
                  alt=""
                  fill
                  sizes="80px"
                  className="object-contain drop-shadow-[0_0_16px_color-mix(in_srgb,var(--side)_50%,transparent)]"
                />
              ) : (
                <span className="flex h-full w-full items-center justify-center text-slate-500">
                  <Minus size={30} />
                </span>
              )}
            </span>
            <p className="flex min-w-0 items-center gap-2.5 font-display text-xl leading-tight font-black tracking-tight text-[var(--side)] uppercase sm:text-2xl">
              <Crown size={22} className="shrink-0" aria-hidden />
              {favourite ? t.aiWinner(favourite.label) : t.aiDraw}
            </p>
          </div>

          <p className="text-base leading-relaxed text-slate-200 sm:text-lg">
            {verdict.veredicto}
          </p>

          <div>
            <p className="mb-2.5 flex items-center gap-2 font-mono text-xs tracking-[0.2em] text-sky-300 uppercase">
              <Sparkles size={13} aria-hidden />
              {t.aiKeys}
            </p>
            <ol className="grid grid-cols-2 gap-2.5 max-sm:gap-1.5">
              {verdict.claves.map((clave, index) => (
                <li
                  key={clave}
                  className="flex gap-3 rounded-xl border border-slate-700/70 bg-black/25 p-3.5"
                >
                  <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-sky-400/50 bg-sky-400/10 font-display text-sm font-black text-sky-300">
                    {index + 1}
                  </span>
                  <span className="text-sm leading-relaxed text-slate-300">
                    {clave}
                  </span>
                </li>
              ))}
            </ol>
          </div>

          {/* What would flip the duel — the caveat under the call. */}
          {verdict.riesgo && (
            <div className="flex gap-3 rounded-xl border border-amber-400/40 bg-amber-400/[0.06] p-4">
              <TriangleAlert
                size={18}
                aria-hidden
                className="mt-0.5 shrink-0 text-amber-300"
              />
              <div className="min-w-0">
                <p className="mb-1 font-mono text-xs tracking-[0.2em] text-amber-300 uppercase">
                  {t.aiRisk}
                </p>
                <p className="text-sm leading-relaxed text-slate-300">
                  {verdict.riesgo}
                </p>
              </div>
            </div>
          )}
        </div>
      ) : (
        <p className="mt-3 text-sm leading-relaxed text-slate-400 sm:text-base">
          {t.aiIntro}
        </p>
      )}

      <button
        type="button"
        onClick={onAsk}
        disabled={pending}
        className="mt-5 inline-flex h-12 w-full items-center justify-center gap-2.5 rounded-lg bg-gradient-to-b from-sky-400 to-blue-600 px-6 font-mono text-sm font-bold tracking-wider text-sky-50 uppercase shadow-[0_0_22px_-6px_rgba(56,189,248,0.9)] transition enabled:hover:from-sky-300 enabled:hover:to-blue-500 enabled:hover:shadow-[0_0_28px_-4px_rgba(56,189,248,0.8)] disabled:opacity-50 sm:w-auto"
      >
        <Bot size={18} className={cn(pending && "animate-pulse")} />
        {pending ? t.aiPending : verdict ? t.aiRetry : t.aiCta}
      </button>

      {error && (
        <p className="mt-3 rounded-md border border-red-500/40 bg-red-500/10 px-3 py-2 font-mono text-sm text-red-400">
          {error}
        </p>
      )}
    </section>
  );
}
