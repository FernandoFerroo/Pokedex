/**
 * The bag: which items exist, what they do and how many fit. Pure data plus
 * tiny helpers — the engine applies the effects, the pre-battle lobby lets
 * the player pack the six slots and the HUD renders them.
 */
import type { StageStat } from "@/types/battle";

export type BagItemId =
  | "potion"
  | "super-potion"
  | "hyper-potion"
  | "full-restore"
  | "revive"
  | "full-heal"
  | "x-attack"
  | "x-defense";

export interface BagItemSpec {
  /** Flat HP restored; 0 for items that don't heal. */
  heal: number;
  /**
   * Fraction of max HP restored, when it beats the flat value.
   *
   * Los combates de aquí son a nivel 50 y seis contra seis: un Pokémon pasa de
   * 150 PS, así que la Poción de 20 PS de los juegos —pensada para las
   * primeras rutas— devolvía menos de lo que el rival quitaba en ese mismo
   * turno. Gastabas el turno y el objeto para nada. Con la fracción, cada
   * frasco cura lo que promete su nombre a cualquier nivel, y la escalera
   * Poción < Superpoción < Hiperpoción se mantiene.
   */
  healFraction?: number;
  /** Restores every HP instead of `heal` (Full Restore). */
  healAll?: boolean;
  /** Clears the major status condition (burn, poison, sleep…). */
  curesStatus?: boolean;
  /** Brings a fainted party member back with half its HP. */
  revives?: boolean;
  /** In-battle stat boost applied to the active Pokémon (X items). */
  stage?: { stat: StageStat; change: number };
  /** Pill colour in the HUD and the packing screen. */
  tint: string;
}

/**
 * Values follow the modern main-series games, with their flat HP acting as the
 * floor of a fraction of max HP: an item never heals less than it does in the
 * games, and at battle levels it heals what its name promises (`healFraction`).
 */
export const BAG_ITEMS: Record<BagItemId, BagItemSpec> = {
  potion: { heal: 20, healFraction: 1 / 3, tint: "#f472b6" },
  "super-potion": { heal: 60, healFraction: 1 / 2, tint: "#c084fc" },
  "hyper-potion": { heal: 120, healFraction: 4 / 5, tint: "#a855f7" },
  "full-restore": { heal: 0, healAll: true, curesStatus: true, tint: "#38bdf8" },
  revive: { heal: 0, revives: true, tint: "#fbbf24" },
  "full-heal": { heal: 0, curesStatus: true, tint: "#34d399" },
  "x-attack": {
    heal: 0,
    stage: { stat: "atk", change: 1 },
    tint: "#fb7185",
  },
  "x-defense": {
    heal: 0,
    stage: { stat: "def", change: 1 },
    tint: "#60a5fa",
  },
};

/** Display order in the packing screen and the in-battle bag. */
export const BAG_ITEM_IDS = Object.keys(BAG_ITEMS) as BagItemId[];

/**
 * Official 2D item sprite. Every id above is also its PokéAPI item slug, so
 * the sprite path falls straight out of the id — the same CDN the artwork
 * comes from, already whitelisted in next.config.
 */
export function itemSpriteUrl(id: BagItemId): string {
  return `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/items/${id}.png`;
}

/**
 * PS que devuelve el objeto a un Pokémon de ese aguante: lo mayor entre su
 * valor de los juegos y su fracción de PS máximos. Un único sitio del que sale
 * la cuenta, para que el motor, el cerebro rival y la mochila digan lo mismo.
 */
export function healValue(id: BagItemId, maxHp: number): number {
  const spec = BAG_ITEMS[id];
  if (spec.healAll) return maxHp;
  if (!spec.heal && !spec.healFraction) return 0;
  return Math.max(spec.heal, Math.round(maxHp * (spec.healFraction ?? 0)));
}

/** How many of each item a side carries. Missing key = none left. */
export type Bag = Partial<Record<BagItemId, number>>;

/** Total items a side may take into battle. */
export const BAG_CAPACITY = 6;

/** Most copies of a single item, so a bag is always a real choice. */
export const MAX_PER_ITEM = 3;

/** What both sides carry when nobody packed anything. */
export const DEFAULT_BAG: Bag = {
  potion: 2,
  "super-potion": 2,
  revive: 1,
  "full-heal": 1,
};

export function isBagItemId(value: unknown): value is BagItemId {
  return typeof value === "string" && value in BAG_ITEMS;
}

export function bagCount(bag: Bag): number {
  return Object.values(bag).reduce((sum, n) => sum + (n ?? 0), 0);
}

/** True while the item would do nothing at all — the HUD greys those out. */
export function isItemUseless(
  id: BagItemId,
  active: { hp: number; maxHp: number; status?: string | null },
  hasFaintedAlly: boolean,
): boolean {
  const spec = BAG_ITEMS[id];
  if (spec.revives) return !hasFaintedAlly;
  if (spec.healAll) return active.hp >= active.maxHp && !active.status;
  if (spec.heal > 0) return active.hp >= active.maxHp;
  if (spec.curesStatus) return !active.status;
  return false; // X items always apply (the engine caps the stage at +6).
}

/**
 * Whitelists a client-supplied bag: real ids, sane counts and never over
 * capacity. Order follows BAG_ITEM_IDS so trimming is deterministic.
 */
export function normalizeBag(value: unknown): Bag {
  if (typeof value !== "object" || value === null) return { ...DEFAULT_BAG };
  const raw = value as Record<string, unknown>;
  const bag: Bag = {};
  let total = 0;
  for (const id of BAG_ITEM_IDS) {
    const count = raw[id];
    if (typeof count !== "number" || !Number.isFinite(count)) continue;
    const wanted = Math.min(MAX_PER_ITEM, Math.max(0, Math.floor(count)));
    const fits = Math.min(wanted, BAG_CAPACITY - total);
    if (fits > 0) {
      bag[id] = fits;
      total += fits;
    }
  }
  return bag;
}
