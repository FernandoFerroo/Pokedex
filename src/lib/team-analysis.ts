/**
 * Pure type-coverage math for the team builder. No fetches: the Gen VI+
 * type chart is static data, so the drawer can re-analyze on every change
 * without touching PokéAPI. Runs on both client (live matrix) and server
 * (the coach route feeds it to the AI).
 */

import { TYPE_LABELS_ES } from "@/lib/pokemon-meta";
import type { TeamAnalysis, TeamMember, TypePressure } from "@/types/team";

export const ALL_TYPES = Object.keys(TYPE_LABELS_ES);

/**
 * Attack effectiveness chart (Gen VI+): attacker -> defender -> multiplier.
 * Only non-neutral matchups are listed; everything else is ×1.
 */
const TYPE_CHART: Record<string, Record<string, number>> = {
  normal: { rock: 0.5, ghost: 0, steel: 0.5 },
  fire: { fire: 0.5, water: 0.5, grass: 2, ice: 2, bug: 2, rock: 0.5, dragon: 0.5, steel: 2 },
  water: { fire: 2, water: 0.5, grass: 0.5, ground: 2, rock: 2, dragon: 0.5 },
  electric: { water: 2, electric: 0.5, grass: 0.5, ground: 0, flying: 2, dragon: 0.5 },
  grass: { fire: 0.5, water: 2, grass: 0.5, poison: 0.5, ground: 2, flying: 0.5, bug: 0.5, rock: 2, dragon: 0.5, steel: 0.5 },
  ice: { fire: 0.5, water: 0.5, grass: 2, ice: 0.5, ground: 2, flying: 2, dragon: 2, steel: 0.5 },
  fighting: { normal: 2, ice: 2, poison: 0.5, flying: 0.5, psychic: 0.5, bug: 0.5, rock: 2, ghost: 0, dark: 2, steel: 2, fairy: 0.5 },
  poison: { grass: 2, poison: 0.5, ground: 0.5, rock: 0.5, ghost: 0.5, steel: 0, fairy: 2 },
  ground: { fire: 2, electric: 2, grass: 0.5, poison: 2, flying: 0, bug: 0.5, rock: 2, steel: 2 },
  flying: { electric: 0.5, grass: 2, fighting: 2, bug: 2, rock: 0.5, steel: 0.5 },
  psychic: { fighting: 2, poison: 2, psychic: 0.5, dark: 0, steel: 0.5 },
  bug: { fire: 0.5, grass: 2, fighting: 0.5, poison: 0.5, flying: 0.5, psychic: 2, ghost: 0.5, dark: 2, steel: 0.5, fairy: 0.5 },
  rock: { fire: 2, ice: 2, fighting: 0.5, ground: 0.5, flying: 2, bug: 2, steel: 0.5 },
  ghost: { normal: 0, psychic: 2, ghost: 2, dark: 0.5 },
  dragon: { dragon: 2, steel: 0.5, fairy: 0 },
  dark: { fighting: 0.5, psychic: 2, ghost: 2, dark: 0.5, fairy: 0.5 },
  steel: { fire: 0.5, water: 0.5, electric: 0.5, ice: 2, rock: 2, steel: 0.5, fairy: 2 },
  fairy: { fire: 0.5, fighting: 2, poison: 0.5, dragon: 2, dark: 2, steel: 0.5 },
};

/** ×2/×½/×0 an `attacker` deals to a mono- or dual-typed defender. */
export function effectiveness(attacker: string, defenderTypes: string[]): number {
  return defenderTypes.reduce(
    (mult, defender) => mult * (TYPE_CHART[attacker]?.[defender] ?? 1),
    1,
  );
}

/** Defensive multipliers a Pokémon takes from every attack type. */
export function defensiveMultipliers(types: string[]): Record<string, number> {
  return Object.fromEntries(
    ALL_TYPES.map((attacker) => [attacker, effectiveness(attacker, types)]),
  );
}

/** Members weak/resistant to each attack type must reach this to be flagged. */
export const PRESSURE_THRESHOLD = 3;

/**
 * Global matrix for a whole team: per attack type, how many members are weak
 * (×2+) or resistant (×½ or immune), plus the derived headline lists.
 */
export function analyzeTeam(members: TeamMember[]): TeamAnalysis {
  const matrix: TypePressure[] = ALL_TYPES.map((type) => {
    let weakCount = 0;
    let resistCount = 0;
    for (const member of members) {
      const mult = effectiveness(type, member.types);
      if (mult >= 2) weakCount++;
      else if (mult < 1) resistCount++;
    }
    return { type, weakCount, resistCount };
  });

  // STAB coverage: defending types at least one member hits super-effectively.
  const covered = new Set<string>();
  for (const member of members) {
    for (const stab of member.types) {
      for (const defender of ALL_TYPES) {
        if ((TYPE_CHART[stab]?.[defender] ?? 1) >= 2) covered.add(defender);
      }
    }
  }

  return {
    criticalWeaknesses: matrix
      .filter((p) => p.weakCount >= PRESSURE_THRESHOLD)
      .sort((a, b) => b.weakCount - a.weakCount),
    strongResistances: matrix
      .filter((p) => p.resistCount >= PRESSURE_THRESHOLD)
      .sort((a, b) => b.resistCount - a.resistCount),
    missingCoverage:
      members.length === 0 ? [] : ALL_TYPES.filter((t) => !covered.has(t)),
    matrix,
  };
}
