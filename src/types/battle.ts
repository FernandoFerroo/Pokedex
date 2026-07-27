/** Shared contracts of the AI battle mode (engine, API routes and UI). */

import type { Bag, BagItemId } from "@/lib/battle/items";

/** Flat combat stats at the battler's level (IV 31, EV 0, neutral nature). */
export interface CombatStats {
  hp: number;
  atk: number;
  def: number;
  spa: number;
  spd: number;
  spe: number;
}

/** Stats that can gain in-battle stages (−6…+6). */
export type StageStat = "atk" | "def" | "spa" | "spd" | "spe" | "acc" | "eva";

/** Conditions the engine simulates. Confusion is volatile (separate slot). */
export type Ailment =
  | "paralysis"
  | "burn"
  | "poison"
  | "sleep"
  | "freeze"
  | "confusion";

/** Effect data distilled from the /move sheet's `meta` + `stat_changes`. */
export interface MoveEffects {
  /** Who receives the stat changes / ailment. */
  target: "self" | "foe";
  /** Stage deltas, e.g. Swords Dance = [{ stat: "atk", change: +2 }]. */
  statChanges: Array<{ stat: StageStat; change: number }>;
  /** % chance the stat changes apply on damaging moves; 0 = always. */
  statChance: number;
  ailment: Ailment | null;
  /** % chance; 0 = always (PokéAPI semantics). */
  ailmentChance: number;
  /** % of max HP restored to the user (Recover 50, Rest 100…). */
  healingPct: number;
  /** % of dealt damage drained (negative = recoil, e.g. Double-Edge). */
  drainPct: number;
}

/** A usable combat move (status moves carry their effects, not damage). */
export interface BattleMove {
  /** PokéAPI move slug, e.g. "flamethrower". */
  slug: string;
  /** Localized name for the battle's language, e.g. "Lanzallamas". */
  label: string;
  /** Type slug, e.g. "fire". */
  type: string;
  damageClass: "physical" | "special" | "status";
  /** Listed base power; null = variable — the engine computes it per turn
      (weight, speed, HP or fixed-damage mechanics, e.g. Grass Knot). */
  power: number | null;
  /** 1-100; null means the move never misses. */
  accuracy: number | null;
  pp: number;
  maxPp: number;
  /** Simulated side effects; absent = the move only deals damage (or, for a
      status move without usable data, simply fails). */
  effects?: MoveEffects;
}

/**
 * Stance of an in-progress two-turn move. The first four grant
 * semi-invulnerability (Dig, Fly, Dive, Phantom Force…); "charging" is a
 * visible wind-up with no evasion (Solar Beam, Sky Attack…).
 */
export type ChargeStance =
  | "underground"
  | "airborne"
  | "underwater"
  | "vanished"
  | "charging";

/** Locked two-turn move: the battler must release `move` next turn. */
export interface ChargingState {
  /** Slug of the move being charged, e.g. "dig". */
  move: string;
  stance: ChargeStance;
}

/** The ability a battler enters combat with. */
export interface BattlerAbility {
  /** PokéAPI ability slug, e.g. "blaze". */
  slug: string;
  /** Localized name for the battle's language, e.g. "Mar Llamas". */
  label: string;
  isHidden: boolean;
}

/** A battle-ready Pokémon: a TeamMember hydrated with stats, moves, art. */
export interface Battler {
  id: number;
  /** PokéAPI slug. */
  name: string;
  /** Display name, e.g. "Charizard". */
  label: string;
  level: number;
  types: string[];
  /** Body weight in kg — feeds Grass Knot / Heavy Slam-style formulas. */
  weight: number;
  stats: CombatStats;
  maxHp: number;
  /** Current HP — the only field that mutates during combat. */
  hp: number;
  /** Resolved ability (user's pick or the species' primary one). */
  ability: BattlerAbility | null;
  moves: BattleMove[];
  /** In-battle stat stages (−6…+6); cleared when switching out. */
  stages?: Partial<Record<StageStat, number>>;
  /** Major status condition; persists until the battle ends. */
  status?: Exclude<Ailment, "confusion"> | null;
  /** Remaining sleep turns while status === "sleep". */
  sleepTurns?: number;
  /** Volatile confusion counter (0 = not confused); cleared on switch-out. */
  confusedTurns?: number;
  /** In-progress two-turn move (Dig, Fly…); cleared on release, interruption,
      switch-out or faint. While set, the turn action is locked to it. */
  charging?: ChargingState | null;
  /** Gender shown in the status box; `null` for genderless species. */
  gender: "male" | "female" | null;
  sprites: {
    /** Animated Showdown GIF (or pixel/artwork fallback), facing the camera. */
    front: string;
    /** Back view for the player's active slot. */
    back: string;
    /** High-resolution official artwork: clean, cel-shaded illustration with
        a transparent background — what the 2D arena actually draws. `null`
        for the rare entry with none, where the arena falls back to sprites. */
    art: string | null;
  };
  /** PokéAPI cry (OGG), played when the battler enters and when it attacks.
      `null` for the handful of species PokéAPI has no recording for. */
  cry: string | null;
  /** Community glTF model URL; the arena falls back to 2D if it 404s. */
  modelUrl: string;
}

/** The AI-generated rival: persona plus a full battle-ready team. */
export interface RivalProfile {
  /** Trainer name, e.g. "Vega, la Domadora de Dragones". */
  nombre: string;
  /** One-line battle cry shown during the intro. */
  lema: string;
  /** Short visual theme used to prompt the avatar generator. */
  estilo: string;
  team: Battler[];
}

export interface BattleSetupResponse {
  player: Battler[];
  rival: RivalProfile;
}

/** What a side does this turn. */
export type BattleAction =
  | { kind: "move"; move: string }
  | { kind: "switch"; to: number }
  /** Uses a bag item; `target` is the team index for Revive. */
  | { kind: "item"; item: BagItemId; target?: number };

/** Sanitized decision of the rival AI for one turn. */
export interface RivalTurnResponse {
  action: BattleAction;
  /** Short in-character line shown in the anime speech bubble. */
  dialogue: string;
}

/** One step of a resolved turn, replayed sequentially by the UI. */
export type BattleEvent =
  | { kind: "switch"; side: Side; to: number; text: string }
  | { kind: "heal"; side: Side; amount: number; text: string }
  | {
      kind: "use-move";
      side: Side;
      move: BattleMove;
      /** True on the attack turn of a two-turn move: the sprite must
          reappear with an emergence burst before the hit lands. */
      release?: boolean;
      text: string;
    }
  /** Turn 1 of a two-turn move: the battler hides or gathers energy. */
  | {
      kind: "charge";
      side: Side;
      move: BattleMove;
      stance: ChargeStance;
      text: string;
    }
  /** A charge ended without its attack (interrupted): the sprite returns. */
  | { kind: "reappear"; side: Side; text: string }
  | {
      kind: "damage";
      /** Side RECEIVING the damage. */
      side: Side;
      amount: number;
      newHp: number;
      effectiveness: number;
      crit: boolean;
      text: string;
    }
  | { kind: "miss"; side: Side; text: string }
  /** Informational line: stat changes, conditions, skipped turns… */
  | {
      kind: "note";
      side: Side;
      text: string;
      /** Set on the line that announces an item: the arena draws it landing
          on the field, the way a trainer's item does in the games. */
      item?: BagItemId;
    }
  | { kind: "faint"; side: Side; text: string }
  | { kind: "end"; winner: Side; text: string };

export type Side = "player" | "rival";

/** Mutable per-side battle state. */
export interface SideState {
  team: Battler[];
  active: number;
  /** What's left in the bag; the player packs it before the battle. */
  bag: Bag;
}

export interface BattleState {
  player: SideState;
  rival: SideState;
  turn: number;
}
