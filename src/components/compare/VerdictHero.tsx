"use client";

import Image from "next/image";
import { Crown, Minus, Swords } from "lucide-react";
import { SIDE_A_COLOR, SIDE_B_COLOR } from "@/components/compare/DualRadar";
import { FACTOR_ICONS } from "@/components/compare/Scoreboard";
import type { Comparison } from "@/lib/compare";
import { useI18n } from "@/lib/i18n/client";
import { artworkUrl, typeAura } from "@/lib/pokemon-meta";
import { cn } from "@/lib/utils";
import type { CSSProperties } from "react";
import type { ComparePokemon } from "@/types/compare";

/**
 * The headline of the whole comparator: who wins the fight, how convincingly,
 * and on which counts. Everything else on the page is the evidence behind
 * this block, so it gets the winner's artwork at full size, its type aura as
 * stage light, the score split as a single bar and one chip per judged
 * category.
 */
export function VerdictHero({
  a,
  b,
  result,
}: {
  a: ComparePokemon;
  b: ComparePokemon;
  result: Comparison;
}) {
  const t = useI18n().dict.compare;
  const { index } = result;
  const winner = index.winner === "a" ? a : index.winner === "b" ? b : null;
  const loser = index.winner === "a" ? b : index.winner === "b" ? a : null;
  const winnerColor =
    index.winner === "a"
      ? SIDE_A_COLOR
      : index.winner === "b"
        ? SIDE_B_COLOR
        : "#94a3b8";

  const factorLabels: Record<string, string> = {
    types: t.factorTypes,
    stats: t.factorStats,
    abilities: t.factorAbilities,
    speed: t.factorSpeed,
    bst: t.factorBst,
  };

  return (
    <section
      style={
        {
          "--aura": typeAura(winner?.types[0]),
          "--side": winnerColor,
        } as CSSProperties
      }
      className="verdict-hero relative overflow-hidden rounded-2xl border border-[color-mix(in_srgb,var(--side)_45%,transparent)] px-5 py-7 shadow-[0_0_60px_-20px_var(--side)] sm:px-10 sm:py-10"
    >
      <span aria-hidden className="verdict-rays" />
      <p className="relative text-center font-mono text-sm tracking-[0.35em] text-slate-300 uppercase sm:text-base">
        {t.verdictKicker}
      </p>

      <div className="relative mt-5 flex flex-col items-center gap-5 sm:mt-6">
        {/* Winner's portrait, crowned. In a draw both fighters share the
            spotlight at the same size — nobody gets the crown. */}
        <div className="flex items-end justify-center gap-3 sm:gap-6">
          {winner && loser ? (
            <>
              <span className="relative h-24 w-24 opacity-40 grayscale sm:h-28 sm:w-28">
                <Image
                  src={artworkUrl(loser.id)}
                  alt=""
                  fill
                  sizes="112px"
                  className="object-contain"
                />
              </span>
              <span className="relative h-36 w-36 sm:h-52 sm:w-52">
                <span
                  aria-hidden
                  className="absolute inset-x-2 bottom-1 h-8 rounded-[50%] bg-[var(--aura)] opacity-40 blur-2xl"
                />
                <Image
                  src={artworkUrl(winner.id)}
                  alt={t.artworkAlt(winner.label)}
                  fill
                  sizes="208px"
                  className="object-contain drop-shadow-[0_0_28px_color-mix(in_srgb,var(--aura)_70%,transparent)]"
                />
                <span
                  aria-hidden
                  className="absolute -top-1 left-1/2 flex h-11 w-11 -translate-x-1/2 items-center justify-center rounded-full border border-[var(--side)] bg-black/80 text-[var(--side)] shadow-[0_0_22px_-4px_var(--side)] sm:h-12 sm:w-12"
                >
                  <Crown size={24} />
                </span>
              </span>
            </>
          ) : (
            [a, b].map((pokemon) => (
              <span key={pokemon.id} className="relative h-28 w-28 sm:h-36 sm:w-36">
                <Image
                  src={artworkUrl(pokemon.id)}
                  alt={t.artworkAlt(pokemon.label)}
                  fill
                  sizes="144px"
                  className="object-contain"
                />
              </span>
            ))
          )}
        </div>

        {/* The sentence, as big as the layout allows. The winner's name is
            lifted out of the localized phrase by splitting on it, so every
            language keeps its own word order. */}
        <h2 className="text-center font-display text-2xl leading-tight font-black tracking-tight text-slate-300 uppercase sm:text-4xl">
          {winner ? (
            (() => {
              const [before, after] = t.winsDuel(winner.label).split(winner.label);
              return (
                <>
                  {before}
                  <span className="block text-5xl text-[var(--side)] drop-shadow-[0_0_30px_color-mix(in_srgb,var(--side)_75%,transparent)] sm:inline sm:text-6xl lg:text-7xl">
                    {winner.label}
                  </span>
                  {after}
                </>
              );
            })()
          ) : (
            <span className="inline-flex items-center gap-3 text-slate-200">
              <Minus size={32} className="text-slate-400" aria-hidden />
              {t.duelDraw}
            </span>
          )}
        </h2>

        {/* Score split: the number first, the bar as its proof. */}
        <div className="w-full max-w-3xl">
          <p className="mb-3 text-center font-mono text-sm tracking-[0.25em] text-slate-300 uppercase">
            {t.winChance}
          </p>
          <div className="flex items-center gap-3 sm:gap-5">
            {/* Both figures keep their side's colour so each is identifiable at
                a glance; only the winner carries the full neon glow. */}
            <span
              style={{ "--side": SIDE_A_COLOR } as CSSProperties}
              className={cn(
                "font-display text-4xl font-black tabular-nums sm:text-6xl",
                index.winner === "a"
                  ? "text-[var(--side)] drop-shadow-[0_0_26px_color-mix(in_srgb,var(--side)_70%,transparent)]"
                  : "text-[color-mix(in_srgb,var(--side)_60%,#94a3b8)]",
              )}
            >
              {index.scoreA}%
            </span>
            <span className="relative h-6 flex-1 overflow-hidden rounded-full border border-slate-600/80 bg-black/60 shadow-[inset_0_0_16px_rgba(0,0,0,0.8)] sm:h-8">
              <span
                style={
                  {
                    width: `${index.scoreA}%`,
                    "--side": SIDE_A_COLOR,
                  } as CSSProperties
                }
                className="duel-bar absolute inset-y-0 left-0 transition-[width] duration-700"
              />
              <span
                style={
                  {
                    width: `${index.scoreB}%`,
                    "--side": SIDE_B_COLOR,
                  } as CSSProperties
                }
                className="duel-bar-left absolute inset-y-0 right-0 transition-[width] duration-700"
              />
              <span
                aria-hidden
                className="absolute inset-y-0 left-1/2 w-px bg-white/50"
              />
            </span>
            <span
              style={{ "--side": SIDE_B_COLOR } as CSSProperties}
              className={cn(
                "font-display text-4xl font-black tabular-nums sm:text-6xl",
                index.winner === "b"
                  ? "text-[var(--side)] drop-shadow-[0_0_26px_color-mix(in_srgb,var(--side)_70%,transparent)]"
                  : "text-[color-mix(in_srgb,var(--side)_60%,#94a3b8)]",
              )}
            >
              {index.scoreB}%
            </span>
          </div>
        </div>

        {/* One chip per judged category: green when this side took it. */}
        <ul className="flex flex-wrap justify-center gap-2.5">
          {index.factors.map((factor) => {
            const Icon = FACTOR_ICONS[factor.key] ?? Swords;
            const holder =
              factor.winner === "a" ? a : factor.winner === "b" ? b : null;
            const color =
              factor.winner === "a"
                ? SIDE_A_COLOR
                : factor.winner === "b"
                  ? SIDE_B_COLOR
                  : "#94a3b8";
            return (
              <li
                key={factor.key}
                style={{ "--side": color } as CSSProperties}
                className="inline-flex items-center gap-2 rounded-full border border-[color-mix(in_srgb,var(--side)_65%,transparent)] bg-[color-mix(in_srgb,var(--side)_14%,transparent)] px-4 py-2 shadow-[0_0_18px_-6px_var(--side)]"
              >
                <Icon size={17} className="text-[var(--side)]" aria-hidden />
                <span className="font-mono text-sm font-semibold tracking-wider text-slate-200 uppercase">
                  {factorLabels[factor.key]}
                </span>
                <span className="font-mono text-sm font-bold text-[var(--side)]">
                  {holder ? holder.label : t.roundDraw}
                </span>
              </li>
            );
          })}
        </ul>
      </div>
    </section>
  );
}
