"use client";

import { Gauge, Shield, Sigma, Sparkles, Swords } from "lucide-react";
import { SIDE_A_COLOR, SIDE_B_COLOR } from "@/components/compare/DualRadar";
import { TypeBadge } from "@/components/ui/TypeBadge";
import {
  formatMultiplier,
  statValue,
  type AbilityEdge,
  type Comparison,
  type DuelFactor,
  type FactorKey,
} from "@/lib/compare";
import { useI18n } from "@/lib/i18n/client";
import { LOCALE } from "@/lib/i18n/config";
import { typeLabel } from "@/lib/pokemon-meta";
import { STAT_LABELS } from "@/lib/stats";
import { cn } from "@/lib/utils";
import type { ComponentType, CSSProperties, ReactNode } from "react";
import type { ComparePokemon } from "@/types/compare";

/** Icon per judged category, shared with the verdict chips. */
export const FACTOR_ICONS: Record<
  FactorKey,
  ComponentType<{ size?: number; className?: string }>
> = {
  types: Swords,
  stats: Shield,
  abilities: Sparkles,
  speed: Gauge,
  bst: Sigma,
};

/** Big value + supporting line, in one corner of a factor row. */
function SideValue({
  headline,
  detail,
  color,
  won,
  align,
}: {
  headline: ReactNode;
  detail?: ReactNode;
  color: string;
  won: boolean;
  align: "left" | "right";
}) {
  return (
    <div
      style={{ "--side": color } as CSSProperties}
      className={cn(
        "flex min-w-0 flex-col gap-0.5",
        align === "right" ? "items-end text-right" : "items-start text-left",
      )}
    >
      {/* Always in its own side's colour, so a figure identifies its Pokémon
          without cross-referencing; winning only adds the glow. */}
      <span
        className={cn(
          "font-display text-2xl leading-none font-black tabular-nums sm:text-3xl",
          won
            ? "text-[var(--side)] drop-shadow-[0_0_18px_color-mix(in_srgb,var(--side)_65%,transparent)]"
            : "text-[color-mix(in_srgb,var(--side)_62%,#94a3b8)]",
        )}
      >
        {headline}
      </span>
      {detail && (
        <span
          className={cn(
            "flex flex-col gap-1 font-mono text-sm leading-snug text-slate-300",
            align === "right" ? "items-end" : "items-start",
          )}
        >
          {detail}
        </span>
      )}
    </div>
  );
}

/** Tug-of-war bar: the split point is where the category was decided. */
function DuelMeter({ shareA }: { shareA: number }) {
  const percent = Math.round(shareA * 100);
  return (
    <span className="relative flex h-3 w-full overflow-hidden rounded-full border border-slate-700/70 bg-black/50">
      <span
        style={{ width: `${percent}%`, "--side": SIDE_A_COLOR } as CSSProperties}
        className="duel-bar h-full transition-[width] duration-700"
      />
      <span
        style={
          { width: `${100 - percent}%`, "--side": SIDE_B_COLOR } as CSSProperties
        }
        className="duel-bar-left h-full transition-[width] duration-700"
      />
      <span aria-hidden className="absolute inset-y-0 left-1/2 w-px bg-white/30" />
    </span>
  );
}

/** One judged category: both readings, the meter and who took it. */
function FactorRow({
  factor,
  title,
  valueA,
  valueB,
  winnerLabel,
}: {
  factor: DuelFactor;
  title: string;
  valueA: { headline: ReactNode; detail?: ReactNode };
  valueB: { headline: ReactNode; detail?: ReactNode };
  winnerLabel: string;
}) {
  const t = useI18n().dict.compare;
  const Icon = FACTOR_ICONS[factor.key];
  const color =
    factor.winner === "a"
      ? SIDE_A_COLOR
      : factor.winner === "b"
        ? SIDE_B_COLOR
        : "#94a3b8";

  return (
    <li
      style={{ "--side": color } as CSSProperties}
      className="rounded-xl border border-slate-700/70 bg-black/25 p-5 transition hover:border-[color-mix(in_srgb,var(--side)_45%,transparent)] sm:p-6"
    >
      <div className="mb-4 flex flex-wrap items-center gap-x-3 gap-y-2">
        <span className="inline-flex items-center gap-2 font-mono text-sm font-semibold tracking-[0.18em] text-slate-200 uppercase">
          <Icon size={18} className="text-[var(--side)]" />
          {title}
        </span>
        <span className="ml-auto rounded-full border border-cyan-500/50 bg-cyan-950/80 px-2.5 py-1 font-mono text-xs font-semibold tracking-wider text-cyan-400 uppercase">
          {t.factorWeight(Math.round(factor.weight * 100))}
        </span>
      </div>

      <div className="grid grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] items-center gap-4">
        <SideValue
          headline={valueA.headline}
          detail={valueA.detail}
          color={SIDE_A_COLOR}
          won={factor.winner === "a"}
          align="left"
        />
        <span className="w-24 sm:w-44">
          <DuelMeter shareA={factor.shareA} />
        </span>
        <SideValue
          headline={valueB.headline}
          detail={valueB.detail}
          color={SIDE_B_COLOR}
          won={factor.winner === "b"}
          align="right"
        />
      </div>

      <p className="mt-4 text-center font-mono text-sm font-bold tracking-[0.18em] text-[var(--side)] uppercase">
        {factor.winner ? t.roundWinner(winnerLabel) : t.roundDraw}
      </p>
    </li>
  );
}

/** "Levitación · Tierra ×0" — the ability effect, in labels we translate. */
function AbilityDetail({ edge }: { edge: AbilityEdge }) {
  const { lang, dict } = useI18n();
  const t = dict.compare;
  if (edge.notes.length === 0) return null;
  return (
    <>
      {edge.notes.map((note, i) => {
        const label =
          note.kind === "type"
            ? typeLabel(note.key ?? "", lang)
            : note.kind === "stat"
              ? (STAT_LABELS[lang][note.key ?? ""] ?? note.key)
              : note.kind === "foeStat"
                ? t.abilityFoeStat(STAT_LABELS[lang][note.key ?? ""] ?? "")
                : note.kind === "stab"
                  ? t.abilityStab
                  : t.abilityDamageTaken;
        return (
          <span
            key={`${note.kind}-${note.key ?? i}`}
            className="flex flex-wrap items-center gap-1.5"
          >
            {/* A type note earns its official colours; stat notes stay text. */}
            {note.kind === "type" && note.key ? (
              <TypeBadge type={note.key} />
            ) : (
              <span>{label}</span>
            )}
            <span className="font-mono text-sm font-bold text-slate-100">
              {formatMultiplier(note.multiplier, LOCALE[lang])}
            </span>
          </span>
        );
      })}
    </>
  );
}

/**
 * The scorecard behind the verdict: one row per judged category, each with
 * both readings, a tug-of-war meter and the side that took it. Reading it top
 * to bottom explains the percentage split in the hero above.
 */
export function Scoreboard({
  a,
  b,
  result,
}: {
  a: ComparePokemon;
  b: ComparePokemon;
  result: Comparison;
}) {
  const { lang, dict } = useI18n();
  const t = dict.compare;
  const nameOf = (factor: DuelFactor) =>
    factor.winner === "a" ? a.label : factor.winner === "b" ? b.label : "";

  /** Localized name of an ability held by either side. */
  const abilityLabel = (slug: string) =>
    a.abilities.find((x) => x.slug === slug)?.label ??
    b.abilities.find((x) => x.slug === slug)?.label ??
    null;

  /**
   * Every STAB line of one side with its multiplier, and — when an ability
   * bent it — the ability that did, right on that line. That is what keeps
   * "Ground ×0" from looking like an unexplained zero: the reader sees it was
   * Levitate, and on which attack.
   */
  const typeLines = (side: "a" | "b") =>
    result.advantage[side].perType.map((line) => {
      const bent = line.ability ? abilityLabel(line.ability) : null;
      return (
        <span key={line.type} className="flex flex-wrap items-center gap-1.5">
          <TypeBadge type={line.type} />
          <span className="font-mono text-sm font-bold text-slate-100">
            {formatMultiplier(line.multiplier, LOCALE[lang])}
          </span>
          {bent && <span className="text-slate-400">· {bent}</span>}
        </span>
      );
    });

  /** Title and both readings per category. */
  const rowContent = (
    factor: DuelFactor,
  ): {
    title: string;
    valueA: { headline: ReactNode; detail?: ReactNode };
    valueB: { headline: ReactNode; detail?: ReactNode };
  } => {
    switch (factor.key) {
      case "types":
        return {
          title: t.advantageTitle,
          valueA: {
            headline: formatMultiplier(result.advantage.a.multiplier, LOCALE[lang]),
            detail: <>{typeLines("a")}</>,
          },
          valueB: {
            headline: formatMultiplier(result.advantage.b.multiplier, LOCALE[lang]),
            detail: <>{typeLines("b")}</>,
          },
        };
      case "stats":
        return {
          title: t.factorStats,
          valueA: {
            headline: `${result.wins.a}/${result.duels.length}`,
            detail: t.barsTitle,
          },
          valueB: {
            headline: `${result.wins.b}/${result.duels.length}`,
            detail: t.barsTitle,
          },
        };
      case "abilities":
        return {
          title: t.factorAbilities,
          valueA: {
            headline: result.abilities.a.label ?? "—",
            detail: result.abilities.a.slug ? (
              <AbilityDetail edge={result.abilities.a} />
            ) : (
              t.noAbility
            ),
          },
          valueB: {
            headline: result.abilities.b.label ?? "—",
            detail: result.abilities.b.slug ? (
              <AbilityDetail edge={result.abilities.b} />
            ) : (
              t.noAbility
            ),
          },
        };
      case "speed":
        return {
          title: t.speedTitle,
          valueA: {
            headline: statValue(a, "speed"),
            detail:
              result.fasterSide === "a" ? t.speedFirst(a.label) : undefined,
          },
          valueB: {
            headline: statValue(b, "speed"),
            detail:
              result.fasterSide === "b" ? t.speedFirst(b.label) : undefined,
          },
        };
      case "bst":
        return {
          title: t.bstTitle,
          valueA: { headline: result.bstA },
          valueB: { headline: result.bstB },
        };
    }
  };

  return (
    <ul className="flex flex-col gap-2.5">
      {result.index.factors.map((factor) => {
        const content = rowContent(factor);
        return (
          <FactorRow
            key={factor.key}
            factor={factor}
            title={content.title}
            valueA={content.valueA}
            valueB={content.valueB}
            winnerLabel={nameOf(factor)}
          />
        );
      })}
    </ul>
  );
}
