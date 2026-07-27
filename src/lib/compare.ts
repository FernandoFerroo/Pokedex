/**
 * Pure comparison engine behind the "Comparador de Pokémon": every metric the
 * versus screen shows (stat duels, base stat totals, elemental advantage) is
 * derived here, so the UI only formats numbers and the AI route can reason
 * over the very same figures.
 */

import { abilityEffect } from "@/lib/abilities";
import { effectiveness } from "@/lib/battle/type-chart";
import type { ComparePokemon } from "@/types/compare";

/** Which corner of the arena a result belongs to. */
export type Side = "a" | "b";

/**
 * Bar order of the versus breakdown: the classic sheet order (PS, Ataque,
 * Defensa, At. Esp., Def. Esp., Velocidad). The radar uses its own hexagon
 * order so opposite stats sit on opposite vertices.
 */
export const STAT_ORDER = [
  "hp",
  "attack",
  "defense",
  "special-attack",
  "special-defense",
  "speed",
] as const;

/** Radar layout: PS on top, clockwise, mirroring the detail sheet's hexagon. */
export const RADAR_ORDER = [
  "hp",
  "attack",
  "defense",
  "speed",
  "special-defense",
  "special-attack",
] as const;

/** Practical ceiling for a base stat (Blissey's 255 HP) — the radar's full radius. */
export const MAX_BASE_STAT = 255;

/** One row of the head-to-head bars. */
export interface StatDuel {
  /** Stat slug, e.g. "attack". */
  name: string;
  a: number;
  b: number;
  /** Absolute point gap between both sides. */
  gap: number;
  /** Side holding the higher value, or null on a tie. */
  winner: Side | null;
}

/** How hard one side can hit the other with its best STAB type. */
export interface OffensiveEdge {
  /** Best combined multiplier across the attacker's own types (STAB). */
  multiplier: number;
  /** Attacking types reaching that multiplier. */
  types: string[];
  /** Multiplier of every STAB type, in slot order — the shown evidence.
   * `ability` names the ability that bent the line, when one did. */
  perType: Array<{ type: string; multiplier: number; ability: string | null }>;
  /** Mean multiplier across every STAB type — breaks ties on the best one. */
  average: number;
}

/** Elemental read of the matchup, from both directions at once. */
export interface TypeAdvantage {
  a: OffensiveEdge;
  b: OffensiveEdge;
  /** Side hitting harder, or null when both land the same multiplier. */
  leader: Side | null;
}

/** Everything the comparator renders, computed in one pass. */
export interface Comparison {
  duels: StatDuel[];
  bstA: number;
  bstB: number;
  /** Absolute BST gap. */
  bstGap: number;
  /** Side with the higher BST, or null on a tie. */
  bstLeader: Side | null;
  /** Stat wins per side (ties counted apart). */
  wins: { a: number; b: number; ties: number };
  advantage: TypeAdvantage;
  /** Side that moves first at equal level, or null when speeds tie. */
  fasterSide: Side | null;
  /** Decisive ability of each side against this particular rival. */
  abilities: { a: AbilityEdge; b: AbilityEdge };
  /** The weighted verdict built on everything above. */
  index: DuelIndex;
}

/** Base value of one stat, 0 when the species somehow lacks it. */
export function statValue(pokemon: ComparePokemon, name: string): number {
  return pokemon.stats.find((stat) => stat.name === name)?.base ?? 0;
}

/** Base Stat Total — the sum of the six base stats. */
export function baseStatTotal(pokemon: ComparePokemon): number {
  return pokemon.stats.reduce((total, stat) => total + stat.base, 0);
}

/** Row per stat with the winning side already resolved. */
export function statDuels(a: ComparePokemon, b: ComparePokemon): StatDuel[] {
  return STAT_ORDER.map((name) => {
    const valueA = statValue(a, name);
    const valueB = statValue(b, name);
    return {
      name,
      a: valueA,
      b: valueB,
      gap: Math.abs(valueA - valueB),
      winner: valueA === valueB ? null : valueA > valueB ? "a" : "b",
    } satisfies StatDuel;
  });
}

/**
 * Best STAB multiplier the attacker lands on the defender, abilities
 * included. Only the attacker's own types are considered: any Pokémon can
 * carry coverage moves, so same-type attacks are the honest measure of an
 * elemental edge.
 *
 * Abilities are read at their best case for their holder — the defender's
 * Levitate cancels Ground, the attacker's Adaptability widens its STAB — and
 * every modified line carries the ability that changed it, so the UI can name
 * the assumption instead of hiding it.
 */
export function offensiveEdge(
  attacker: ComparePokemon,
  defender: ComparePokemon,
): OffensiveEdge {
  if (attacker.types.length === 0 || defender.types.length === 0) {
    return { multiplier: 1, types: [], perType: [], average: 1 };
  }

  const perType = attacker.types.map((type) => {
    let multiplier = effectiveness(type, defender.types);
    let ability: string | null = null;

    // Defensive abilities first: an immunity beats anything the attacker
    // brings, so the best defensive reading wins the line.
    for (const held of defender.abilities) {
      const effect = abilityEffect(held.slug);
      if (!effect) continue;
      const factor =
        effect.defense?.[type] !== undefined
          ? multiplier * effect.defense[type]
          : effect.allDamage !== undefined
            ? multiplier * effect.allDamage
            : null;
      if (factor !== null && factor < multiplier) {
        multiplier = factor;
        ability = held.slug;
      }
    }

    // Then the attacker's best single boost — a Pokémon only ever holds one
    // ability, so these never stack. An immunity cannot be revived.
    if (multiplier > 0) {
      let boost = 1;
      let booster: string | null = null;
      for (const held of attacker.abilities) {
        const effect = abilityEffect(held.slug);
        if (!effect) continue;
        // Every type here is one of the attacker's own, so a STAB-widening
        // ability (Adaptability: 1.5 → 2) applies to all of them.
        const own = Math.max(
          effect.offense?.[type] ?? 1,
          effect.stab ? effect.stab / 1.5 : 1,
        );
        if (own > boost) {
          boost = own;
          booster = held.slug;
        }
      }
      if (booster) {
        multiplier *= boost;
        ability = booster;
      }
    }

    return { type, multiplier: round2(multiplier), ability };
  });

  const multiplier = Math.max(...perType.map((s) => s.multiplier));
  return {
    multiplier,
    types: perType.filter((s) => s.multiplier === multiplier).map((s) => s.type),
    perType,
    average: perType.reduce((sum, s) => sum + s.multiplier, 0) / perType.length,
  };
}

/** Two decimals is plenty: ability boosts land on 1.3, 1.33 and 2. */
function round2(value: number): number {
  return Math.round(value * 100) / 100;
}

/**
 * Two-way elemental read: who hits harder with their own types. The peak
 * multiplier decides and the mean across every STAB type breaks a tie on it,
 * so a Pokémon whose second type is dead weight loses to one whose whole
 * offense connects. Both figures are shown in the UI, so the verdict is
 * always backed by the numbers next to it.
 */
export function typeAdvantage(
  a: ComparePokemon,
  b: ComparePokemon,
): TypeAdvantage {
  const edgeA = offensiveEdge(a, b);
  const edgeB = offensiveEdge(b, a);
  const margin =
    edgeA.multiplier !== edgeB.multiplier
      ? edgeA.multiplier - edgeB.multiplier
      : edgeA.average - edgeB.average;
  return {
    a: edgeA,
    b: edgeB,
    leader: margin === 0 ? null : margin > 0 ? "a" : "b",
  };
}

/* ==========================================================================
 * Abilities
 * ========================================================================== */

/** One readable consequence of an ability, expressed as a bare multiplier so
 * the UI can render it with labels it already translates. */
export interface AbilityNote {
  /** What the multiplier applies to. */
  kind: "type" | "stat" | "foeStat" | "all" | "stab";
  /** Type slug for "type", stat slug for "stat"/"foeStat". */
  key?: string;
  multiplier: number;
}

/** The ability that most changes this side's duel, with its consequences. */
export interface AbilityEdge {
  slug: string | null;
  /** Localized name, straight from the sheet. */
  label: string | null;
  notes: AbilityNote[];
  /** Weight of the edge, 0 when nothing we model applies. */
  power: number;
}

/**
 * Picks the single ability that matters most against this rival and scores
 * it. Immunities to what the rival actually attacks with are worth the most;
 * a stat multiplier is worth roughly its own size. An ability with no
 * modelled effect (or one that never comes up in this matchup) scores 0.
 */
export function abilityEdge(
  holder: ComparePokemon,
  rival: ComparePokemon,
): AbilityEdge {
  let best: AbilityEdge = { slug: null, label: null, notes: [], power: 0 };

  for (const held of holder.abilities) {
    const effect = abilityEffect(held.slug);
    if (!effect) continue;
    const notes: AbilityNote[] = [];
    let power = 0;

    for (const [type, factor] of Object.entries(effect.defense ?? {})) {
      // Only count it when the rival can actually attack with that type.
      if (!rival.types.includes(type)) continue;
      notes.push({ kind: "type", key: type, multiplier: factor });
      power += factor === 0 ? 1 : factor < 1 ? 0.4 : -0.4;
    }
    if (effect.allDamage !== undefined) {
      notes.push({ kind: "all", multiplier: effect.allDamage });
      power += (1 - effect.allDamage) * 1.2;
    }
    for (const [type, factor] of Object.entries(effect.offense ?? {})) {
      if (!holder.types.includes(type)) continue;
      notes.push({ kind: "type", key: type, multiplier: factor });
      power += (factor - 1) * 1.2;
    }
    if (effect.stab !== undefined) {
      notes.push({ kind: "stab", multiplier: effect.stab });
      power += (effect.stab / 1.5 - 1) * 1.5;
    }
    if (effect.stat) {
      notes.push({
        kind: "stat",
        key: effect.stat.name,
        multiplier: effect.stat.multiplier,
      });
      power += (effect.stat.multiplier - 1) * 0.8;
    }
    if (effect.foeStat) {
      notes.push({
        kind: "foeStat",
        key: effect.foeStat.name,
        multiplier: effect.foeStat.multiplier,
      });
      power += (1 - effect.foeStat.multiplier) * 0.8;
    }

    if (notes.length > 0 && power > best.power) {
      best = { slug: held.slug, label: held.label, notes, power };
    }
  }

  return best;
}

/* ==========================================================================
 * Duel index — the weighted verdict
 * ========================================================================== */

export type FactorKey = "types" | "stats" | "abilities" | "speed" | "bst";

/** One judged category of the duel. */
export interface DuelFactor {
  key: FactorKey;
  /** How much this category counts toward the final index, 0-1. */
  weight: number;
  /** Share of the category held by A, 0-1 (0.5 = dead even). */
  shareA: number;
  winner: Side | null;
}

/** The headline result: who wins, by how much, and on which counts. */
export interface DuelIndex {
  factors: DuelFactor[];
  /** 0-100. `scoreB` is the complement, so the pair reads as a split. */
  scoreA: number;
  scoreB: number;
  winner: Side | null;
  /** Point spread between both scores. */
  margin: number;
}

/**
 * How much each category counts. Types lead because a duel is decided by what
 * connects; raw stats and abilities follow; the base stat total is the
 * coarsest measure of the three, and initiative only breaks close calls.
 */
const FACTOR_WEIGHTS: Record<FactorKey, number> = {
  types: 0.3,
  stats: 0.25,
  abilities: 0.2,
  speed: 0.15,
  bst: 0.1,
};

/** Keeps a raw ratio inside 0-1. */
function clamp01(value: number): number {
  return Math.min(1, Math.max(0, value));
}

/** Turns a signed gap into a 0-1 share, `full` being a total win. */
function shareFromGap(gap: number, full: number): number {
  return clamp01(0.5 + gap / (full * 2));
}

/**
 * Scores the duel across every category and blends them into a single
 * 0-100 split. A score is not a battle simulation — it is a transparent
 * weighted read of the sheet, and every category it uses is shown next to it.
 */
export function duelIndex(
  a: ComparePokemon,
  b: ComparePokemon,
  base: Omit<Comparison, "index">,
): DuelIndex {
  // Peak plus mean, so a nullified second attack (Levitate against Ground)
  // costs its owner here instead of hiding behind the best line. Ordering
  // this way also keeps the factor in step with `advantage.leader`.
  const hitA = base.advantage.a.multiplier + base.advantage.a.average;
  const hitB = base.advantage.b.multiplier + base.advantage.b.average;
  const abilityA = base.abilities.a.power;
  const abilityB = base.abilities.b.power;

  const shares: Record<FactorKey, number> = {
    // Ratio of what each side lands, so ×2 vs ×1 reads as a two-thirds edge.
    types: hitA + hitB === 0 ? 0.5 : hitA / (hitA + hitB),
    // Won stats out of six, ties splitting the difference.
    stats: (base.wins.a + base.wins.ties / 2) / base.duels.length,
    abilities:
      abilityA + abilityB === 0
        ? 0.5
        : shareFromGap(abilityA - abilityB, 1.6),
    speed: shareFromGap(
      statValue(a, "speed") - statValue(b, "speed"),
      60,
    ),
    bst: shareFromGap(base.bstA - base.bstB, 150),
  };

  const factors = (Object.keys(FACTOR_WEIGHTS) as FactorKey[]).map((key) => ({
    key,
    weight: FACTOR_WEIGHTS[key],
    shareA: shares[key],
    winner:
      shares[key] > 0.5 ? ("a" as Side) : shares[key] < 0.5 ? ("b" as Side) : null,
  }));

  const scoreA = Math.round(
    factors.reduce((total, f) => total + f.weight * f.shareA, 0) * 100,
  );
  const scoreB = 100 - scoreA;
  const margin = Math.abs(scoreA - scoreB);
  return {
    factors,
    scoreA,
    scoreB,
    // Anything inside 4 points is noise — call it a draw rather than crown a
    // winner the numbers do not really support.
    winner: margin < 4 ? null : scoreA > scoreB ? "a" : "b",
    margin,
  };
}

/** Single entry point for the UI and the AI route. */
export function compare(a: ComparePokemon, b: ComparePokemon): Comparison {
  const duels = statDuels(a, b);
  const bstA = baseStatTotal(a);
  const bstB = baseStatTotal(b);
  const speedA = statValue(a, "speed");
  const speedB = statValue(b, "speed");
  const base = {
    duels,
    bstA,
    bstB,
    bstGap: Math.abs(bstA - bstB),
    bstLeader: bstA === bstB ? null : bstA > bstB ? ("a" as Side) : ("b" as Side),
    wins: {
      a: duels.filter((d) => d.winner === "a").length,
      b: duels.filter((d) => d.winner === "b").length,
      ties: duels.filter((d) => d.winner === null).length,
    },
    advantage: typeAdvantage(a, b),
    fasterSide:
      speedA === speedB ? null : speedA > speedB ? ("a" as Side) : ("b" as Side),
    abilities: { a: abilityEdge(a, b), b: abilityEdge(b, a) },
  };
  return { ...base, index: duelIndex(a, b, base) };
}

/**
 * "×4", "×2", "×½", "×¼", "×0" — the way fans read damage multipliers.
 * Ability multipliers land on thirds too (Intimidate drops Attack one stage,
 * ×⅔), and anything left over is written in the caller's locale.
 */
export function formatMultiplier(multiplier: number, locale?: string): string {
  if (multiplier === 0) return "×0";
  if (multiplier === 0.25) return "×¼";
  if (multiplier === 0.5) return "×½";
  if (Math.abs(multiplier - 2 / 3) < 0.02) return "×⅔";
  return `×${multiplier.toLocaleString(locale)}`;
}

/** Decimetres -> "1,9 m" in the user's locale. */
export function formatHeight(decimetres: number, locale: string): string {
  return `${(decimetres / 10).toLocaleString(locale, {
    minimumFractionDigits: 1,
    maximumFractionDigits: 1,
  })} m`;
}

/** Hectograms -> "95,0 kg" in the user's locale. */
export function formatWeight(hectograms: number, locale: string): string {
  return `${(hectograms / 10).toLocaleString(locale, {
    minimumFractionDigits: 1,
    maximumFractionDigits: 1,
  })} kg`;
}
