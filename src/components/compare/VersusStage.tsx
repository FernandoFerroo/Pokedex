"use client";

import Image from "next/image";
import Link from "next/link";
import { Crown, HelpCircle, Sparkles } from "lucide-react";
import { SIDE_A_COLOR, SIDE_B_COLOR } from "@/components/compare/DualRadar";
import { TypeBadge } from "@/components/ui/TypeBadge";
import {
  formatHeight,
  formatWeight,
  type DuelIndex,
  type Side,
} from "@/lib/compare";
import { useI18n } from "@/lib/i18n/client";
import { LOCALE } from "@/lib/i18n/config";
import {
  artworkUrl,
  formatDexNumber,
  generationLabel,
  typeAura,
} from "@/lib/pokemon-meta";
import { cn } from "@/lib/utils";
import type { CSSProperties } from "react";
import type { ComparePokemon } from "@/types/compare";

/** One labelled data cell of the fighter card. */
function DataPill({ label, value }: { label: string; value: string }) {
  return (
    <span className="flex min-w-0 flex-col items-center gap-0.5 rounded-md border border-slate-700/60 bg-black/30 px-2.5 py-1.5 max-sm:px-1 max-sm:py-0.5">
      <span className="w-full truncate text-center font-mono text-xs tracking-[0.16em] text-slate-500 uppercase max-sm:overflow-visible max-sm:text-[8px] max-sm:leading-[1.2] max-sm:tracking-normal max-sm:whitespace-normal max-sm:[overflow-wrap:anywhere]">
        {label}
      </span>
      <span className="w-full truncate text-center font-mono text-xs font-semibold text-slate-200 max-sm:overflow-visible max-sm:text-[9px] max-sm:leading-[1.2] max-sm:whitespace-normal max-sm:[overflow-wrap:anywhere]">
        {value}
      </span>
    </span>
  );
}

/** Placeholder shown while a corner of the arena is still empty. */
function EmptyCorner({ label }: { label: string }) {
  return (
    <div className="flex min-h-64 flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed border-slate-700/60 p-6 text-slate-600">
      <HelpCircle size={44} />
      <p className="font-mono text-xs tracking-[0.2em] uppercase">{label}</p>
    </div>
  );
}

/** One fighter: artwork, identity, types and the size/generation data pills. */
function Fighter({
  pokemon,
  side,
  outcome,
}: {
  pokemon: ComparePokemon;
  side: "a" | "b";
  /** Whether this corner won, lost, or the duel is still undecided/even. */
  outcome: "win" | "loss" | null;
}) {
  const { lang, dict } = useI18n();
  const t = dict.compare;
  const aura = typeAura(pokemon.types[0]);
  const accent = side === "a" ? SIDE_A_COLOR : SIDE_B_COLOR;

  return (
    <div
      style={{ "--aura": aura, "--side": accent } as CSSProperties}
      className={cn(
        "flex flex-col items-center gap-3 transition duration-500 max-sm:gap-1.5",
        side === "a" ? "items-start" : "items-end",
        // The loser stays fully readable — it just steps out of the light.
        outcome === "loss" && "opacity-75 saturate-75",
      )}
    >
      {/* Artwork on its pool of type light. The B side is mirrored so both
          Pokémon look at each other, like a versus screen. */}
      <Link
        href={`/pokemon/${pokemon.name}`}
        className="group relative aspect-square w-full max-w-64 focus-visible:outline-none"
      >
        <span
          aria-hidden
          className="absolute inset-x-4 bottom-2 h-6 rounded-[50%] bg-[var(--aura)] opacity-25 blur-xl"
        />
        <Image
          src={artworkUrl(pokemon.id)}
          alt={t.artworkAlt(pokemon.label)}
          fill
          sizes="(max-width: 768px) 60vw, 256px"
          priority
          className={cn(
            "object-contain drop-shadow-[0_0_22px_color-mix(in_srgb,var(--aura)_60%,transparent)] transition-transform duration-300 group-hover:scale-105",
            side === "b" && "-scale-x-100 group-hover:-scale-x-105",
          )}
        />
      </Link>

      <div
        className={cn(
          "flex flex-col items-center gap-1.5",
          side === "a" ? "items-start" : "items-end",
        )}
      >
        <p className="font-pixel text-[12px] text-slate-500">
          {formatDexNumber(pokemon.id)}
        </p>
        <h2 className="flex items-center gap-2 text-center font-display text-xl font-bold tracking-wide text-slate-100 max-sm:gap-1 max-sm:text-sm md:text-2xl">
          {outcome === "win" && (
            <Crown
              size={20}
              aria-label={t.winsDuel(pokemon.label)}
              className="text-[var(--side)] drop-shadow-[0_0_12px_var(--side)]"
            />
          )}
          {pokemon.label}
        </h2>
        <div className="flex flex-wrap justify-center gap-1.5">
          {pokemon.types.map((type) => (
            <TypeBadge key={type} type={type} size="md" />
          ))}
        </div>
      </div>

      <div className="grid w-full max-w-md grid-cols-3 gap-1.5 max-sm:gap-1">
        <DataPill label={t.height} value={formatHeight(pokemon.height, LOCALE[lang])} />
        <DataPill label={t.weight} value={formatWeight(pokemon.weight, LOCALE[lang])} />
        <DataPill
          label={t.generation}
          value={generationLabel(pokemon.generation)}
        />
      </div>

      <div
        className={cn(
          "flex w-full max-w-md flex-col gap-1",
          side === "a" ? "items-start" : "items-end",
        )}
      >
        <p className="font-mono text-xs tracking-[0.2em] text-slate-500 uppercase max-sm:text-[8px] max-sm:tracking-normal">
          {t.abilities}
        </p>
        <div className="flex flex-wrap justify-normal gap-1.5 max-sm:gap-1">
          {pokemon.abilities.map((ability) => (
            <span
              key={ability.slug}
              className={cn(
                "inline-flex items-center gap-1 rounded border px-2 py-0.5 font-mono text-xs max-sm:gap-0.5 max-sm:px-1 max-sm:text-[9px]",
                ability.isHidden
                  ? "border-violet-400/50 bg-violet-400/10 text-violet-300"
                  : "border-slate-700/70 bg-black/30 text-slate-300",
              )}
            >
              {ability.isHidden && <Sparkles size={11} aria-hidden />}
              {ability.label}
              {ability.isHidden && (
                <span className="sr-only">{` (${t.hidden})`}</span>
              )}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}

/** One side of the scoreline: the points it took out of the 100 at stake. */
function ScoreSide({
  value,
  color,
  won,
}: {
  value: number;
  color: string;
  won: boolean;
}) {
  return (
    <span
      style={{ "--side": color } as CSSProperties}
      className={cn(
        "font-display text-3xl leading-none font-black tabular-nums max-sm:text-lg sm:text-4xl",
        won
          ? "text-[var(--side)] drop-shadow-[0_0_16px_color-mix(in_srgb,var(--side)_60%,transparent)]"
          : "text-slate-400",
      )}
    >
      {value}
    </span>
  );
}

/**
 * The result, planted where both auras meet: who wins and by how much, without
 * scrolling down to the verdict. The figures are the duel index itself — the
 * same 0-100 split the hero and the scorecard below are built on — so the
 * arena can never disagree with them. Ties render both sides neutral, since
 * the index deliberately refuses to crown a winner inside its noise margin.
 */
function DuelScore({
  a,
  b,
  index,
}: {
  a: ComparePokemon;
  b: ComparePokemon;
  index: DuelIndex;
}) {
  const t = useI18n().dict.compare;
  const winner = index.winner === "a" ? a : index.winner === "b" ? b : null;

  return (
    <div className="flex flex-col items-center gap-2 rounded-xl border border-slate-700/70 bg-black/70 px-4 py-3 shadow-[0_0_28px_rgba(0,0,0,0.6)] backdrop-blur max-sm:gap-1 max-sm:rounded-lg max-sm:px-1.5 max-sm:py-1.5">
      <span className="font-mono text-xs tracking-[0.2em] text-slate-500 uppercase max-sm:text-[8px] max-sm:tracking-normal">
        {t.verdictKicker}
      </span>
      <div
        className="flex items-baseline gap-2.5 max-sm:gap-1"
        aria-label={`${a.label} ${index.scoreA} · ${b.label} ${index.scoreB}`}
      >
        <ScoreSide
          value={index.scoreA}
          color={SIDE_A_COLOR}
          won={index.winner === "a"}
        />
        <span aria-hidden className="font-display text-xl font-black text-slate-600">
          –
        </span>
        <ScoreSide
          value={index.scoreB}
          color={SIDE_B_COLOR}
          won={index.winner === "b"}
        />
      </div>
      <span className="flex items-center gap-1.5 text-center font-mono text-xs leading-tight tracking-wider text-slate-300 uppercase max-sm:gap-0.5 max-sm:text-[8px] max-sm:tracking-normal">
        {winner ? (
          <>
            <Crown
              size={12}
              aria-hidden
              className="shrink-0 text-slate-400 max-sm:h-2 max-sm:w-2"
            />
            {t.winsDuel(winner.label)}
          </>
        ) : (
          t.tie
        )}
      </span>
    </div>
  );
}

/**
 * The versus arena: a background split in diagonal and lit by each side's
 * primary type, with both fighters facing each other across a neon seam.
 */
export function VersusStage({
  a,
  b,
  index = null,
}: {
  a: ComparePokemon | null;
  b: ComparePokemon | null;
  /** Duel index, so the stage can show the score and dim the loser. */
  index?: DuelIndex | null;
}) {
  const t = useI18n().dict.compare;
  const winner: Side | null = index?.winner ?? null;
  // Only a complete duel has a score to plant in the middle.
  const score = a && b && index ? index : null;
  return (
    <section
      style={
        {
          "--aura-a": typeAura(a?.types[0]),
          "--aura-b": typeAura(b?.types[0]),
        } as CSSProperties
      }
      className="versus-stage relative overflow-hidden rounded-2xl border border-slate-700/70 px-4 py-6 shadow-[0_0_48px_rgba(0,0,0,0.55)] max-sm:px-2 max-sm:py-3 sm:px-8 sm:py-8"
    >
      {/* Diagonal seam where both auras meet — the split of the arena. */}
      <span
        aria-hidden
        className="versus-seam absolute top-[-25%] left-1/2 h-[150%] w-px rotate-[12deg]"
      />
      {/* Watermark under the seam, so the stage reads as "A vs B" even when
          the interactive VS control has scrolled out of view. Stands down once
          there is a real score to put in that spot. */}
      {!score && (
        <span
          aria-hidden
          className="pointer-events-none absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 font-display text-7xl font-black tracking-tighter text-white/[0.04] max-sm:text-4xl"
        >
          VS
        </span>
      )}

      {/* Ambos contendientes enfrentados, cara a cara, en cualquier ancho: con
          marcador el centro es su propia columna y la placa se apoya en la
          costura; sin él, dos columnas a partes iguales. */}
      <div
        className={cn(
          "relative grid gap-6 max-sm:gap-2",
          score
            ? "grid-cols-[1fr_auto_1fr] md:gap-8"
            : "grid-cols-2 md:gap-12",
        )}
      >
        {a ? (
          <Fighter
            pokemon={a}
            side="a"
            outcome={winner === null ? null : winner === "a" ? "win" : "loss"}
          />
        ) : (
          <EmptyCorner label={t.sideA} />
        )}
        {score && a && b && (
          <div className="flex items-center justify-center md:self-center">
            <DuelScore a={a} b={b} index={score} />
          </div>
        )}
        {b ? (
          <Fighter
            pokemon={b}
            side="b"
            outcome={winner === null ? null : winner === "b" ? "win" : "loss"}
          />
        ) : (
          <EmptyCorner label={t.sideB} />
        )}
      </div>
    </section>
  );
}
