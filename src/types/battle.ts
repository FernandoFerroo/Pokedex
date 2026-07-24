/** Shared contracts of the AI battle mode (engine, API routes and UI). */

/** Flat combat stats at the battler's level (IV 31, EV 0, neutral nature). */
export interface CombatStats {
  hp: number;
  atk: number;
  def: number;
  spa: number;
  spd: number;
  spe: number;
}

/** A usable combat move (only damaging moves make the final loadout). */
export interface BattleMove {
  /** PokéAPI move slug, e.g. "flamethrower". */
  slug: string;
  /** Spanish name, e.g. "Lanzallamas". */
  label: string;
  /** Type slug, e.g. "fire". */
  type: string;
  damageClass: "physical" | "special";
  power: number;
  /** 1-100; null means the move never misses. */
  accuracy: number | null;
  pp: number;
  maxPp: number;
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
  stats: CombatStats;
  maxHp: number;
  /** Current HP — the only field that mutates during combat. */
  hp: number;
  moves: BattleMove[];
  sprites: {
    /** Animated Showdown GIF (or pixel/artwork fallback), facing the camera. */
    front: string;
    /** Back view for the player's active slot. */
    back: string;
  };
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
  | { kind: "potion" };

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
  | { kind: "use-move"; side: Side; move: BattleMove; text: string }
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
  | { kind: "faint"; side: Side; text: string }
  | { kind: "end"; winner: Side; text: string };

export type Side = "player" | "rival";

/** Mutable per-side battle state. */
export interface SideState {
  team: Battler[];
  active: number;
  /** Remaining Potions in the bag (heal 60 HP). */
  potions: number;
}

export interface BattleState {
  player: SideState;
  rival: SideState;
  turn: number;
}
