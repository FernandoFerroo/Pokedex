/**
 * Curated combat effects of the abilities that actually swing a 1v1 duel.
 *
 * Only abilities whose effect can be stated as a plain multiplier are listed:
 * type immunities and resistances, flat stat multipliers and same-type damage
 * boosts. Anything conditional on weather, turn order, held items or HP
 * thresholds (Blaze, Speed Boost, Swift Swim, Guts…) is deliberately absent —
 * the comparator only claims what it can prove from the sheet.
 *
 * Multipliers follow the games: 0 = immunity, 0.5 = halved, 2 = doubled.
 */

export interface AbilityEffect {
  /** Incoming damage multiplier per attacking type, e.g. Levitate → ground 0. */
  defense?: Record<string, number>;
  /** Multiplier on every incoming hit (Multiscale at full HP). */
  allDamage?: number;
  /** Multiplier on the holder's own attacks, per move type. */
  offense?: Record<string, number>;
  /** Same-type attack bonus multiplier (Adaptability turns 1.5 into 2). */
  stab?: number;
  /** Multiplier on one of the holder's own base stats. */
  stat?: { name: string; multiplier: number };
  /** Multiplier the holder forces on one of the rival's base stats. */
  foeStat?: { name: string; multiplier: number };
}

export const ABILITY_EFFECTS: Record<string, AbilityEffect> = {
  /* --- Type immunities ------------------------------------------------- */
  levitate: { defense: { ground: 0 } },
  "earth-eater": { defense: { ground: 0 } },
  "flash-fire": { defense: { fire: 0 } },
  "well-baked-body": { defense: { fire: 0 } },
  "water-absorb": { defense: { water: 0 } },
  "storm-drain": { defense: { water: 0 } },
  "volt-absorb": { defense: { electric: 0 } },
  "lightning-rod": { defense: { electric: 0 } },
  "motor-drive": { defense: { electric: 0 } },
  "sap-sipper": { defense: { grass: 0 } },
  "dry-skin": { defense: { water: 0, fire: 1.25 } },

  /* --- Type resistances ------------------------------------------------ */
  "thick-fat": { defense: { fire: 0.5, ice: 0.5 } },
  heatproof: { defense: { fire: 0.5 } },
  "water-bubble": { defense: { fire: 0.5 }, offense: { water: 2 } },
  "purifying-salt": { defense: { ghost: 0.5 } },
  fluffy: { defense: { fire: 2 } },

  /* --- Blanket damage reduction ---------------------------------------- */
  multiscale: { allDamage: 0.5 },
  "shadow-shield": { allDamage: 0.5 },

  /* --- Offensive multipliers ------------------------------------------- */
  adaptability: { stab: 2 },
  transistor: { offense: { electric: 1.3 } },
  "dragons-maw": { offense: { dragon: 1.5 } },
  steelworker: { offense: { steel: 1.5 } },
  "rocky-payload": { offense: { rock: 1.5 } },

  /* --- Flat stat multipliers ------------------------------------------- */
  "huge-power": { stat: { name: "attack", multiplier: 2 } },
  "pure-power": { stat: { name: "attack", multiplier: 2 } },
  hustle: { stat: { name: "attack", multiplier: 1.5 } },
  "gorilla-tactics": { stat: { name: "attack", multiplier: 1.5 } },
  "fur-coat": { stat: { name: "defense", multiplier: 2 } },
  "ice-scales": { stat: { name: "special-defense", multiplier: 2 } },
  intimidate: { foeStat: { name: "attack", multiplier: 0.67 } },
};

/** Combat effect of an ability, or undefined when it has none we model.
 * Own-property check only: slugs reach here from client payloads too. */
export function abilityEffect(slug: string): AbilityEffect | undefined {
  return Object.hasOwn(ABILITY_EFFECTS, slug)
    ? ABILITY_EFFECTS[slug]
    : undefined;
}
