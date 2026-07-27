/**
 * Pure, deterministic-given-rng battle engine. No fetches, no React: the
 * client orchestrator mutates a BattleState through `resolveTurn` and replays
 * the returned events with animations. Battle text comes from the injected
 * `EngineTexts` bundle (one per language in the battle dictionary), so every
 * surface (log, tests) reads the same lines.
 */
import { bagDict, type ItemTexts } from "@/lib/i18n/dictionaries/bag";
import { battleDict } from "@/lib/i18n/dictionaries/battle";
import type {
  Ailment,
  BattleAction,
  BattleEvent,
  BattleMove,
  BattleState,
  Battler,
  ChargeStance,
  CombatStats,
  Side,
  StageStat,
} from "@/types/battle";
import { BAG_ITEMS, healValue, type BagItemId } from "./items";
import { effectiveness } from "./type-chart";

/**
 * Every user-visible line the engine can emit. Implementations live in the
 * battle dictionary (`dict.battle.engine`, one per language); each member
 * receives the raw pieces (label + side + extras) and returns the natural
 * full sentence for its language — e.g. ES appends " enemigo" after the foe's
 * name while EN prefixes "The opposing …".
 */
export interface EngineTexts {
  /** "¡X usó Y!" / "X used Y!" */
  useMove(label: string, side: Side, moveLabel: string): string;
  /** "¡X falló el ataque!" / "X's attack missed!" */
  miss(label: string, side: Side): string;
  /** "No afecta a X…" / "It doesn't affect X…" (side = defender's side). */
  noEffect(label: string, side: Side): string;
  crit: string;
  superEffective: string;
  notVeryEffective: string;
  /** "¡X se debilitó!" / "X fainted!" (side = fainting side). */
  faint(label: string, side: Side): string;
  win: string;
  lose: string;
  /** Switch-in line: "¡Adelante, X!" / "The rival sent out X!". */
  sendOut(label: string, side: Side): string;
  /** Potion line, with the amount of HP actually restored. */
  potion(label: string, side: Side, amount: number): string;

  /* --- Status moves, stat stages and conditions --- */
  /** Localized display names of the stageable stats. */
  statNames: Record<StageStat, string>;
  /** "¡El Ataque de X subió (mucho)!" — sharply = 2+ stages at once. */
  statRose(label: string, side: Side, stat: string, sharply: boolean): string;
  statFell(label: string, side: Side, stat: string, sharply: boolean): string;
  statNoHigher(label: string, side: Side, stat: string): string;
  statNoLower(label: string, side: Side, stat: string): string;
  healed(label: string, side: Side): string;
  healFull(label: string, side: Side): string;
  /** "¡Pero falló!" — a status move whose effect the engine can't apply. */
  fail: string;
  /** Condition inflicted, per ailment. */
  inflicted: Record<Ailment, (label: string, side: Side) => string>;
  /** "¡Pero no tuvo efecto!" — target already has a condition. */
  noEffectGeneric: string;
  fullyParalyzed(label: string, side: Side): string;
  asleep(label: string, side: Side): string;
  wokeUp(label: string, side: Side): string;
  frozenSolid(label: string, side: Side): string;
  thawed(label: string, side: Side): string;
  hurtByBurn(label: string, side: Side): string;
  hurtByPoison(label: string, side: Side): string;
  confusedCheck(label: string, side: Side): string;
  hurtItself: string;
  snappedOut(label: string, side: Side): string;
  drained(label: string, side: Side): string;
  recoil(label: string, side: Side): string;

  /* --- Two-turn moves (Dig, Fly, Solar Beam…) --- */
  /** Turn-1 announcement per stance: "¡X se escondió bajo tierra!"… */
  charge: Record<ChargeStance, (label: string, side: Side) => string>;
  /** A semi-invulnerable defender dodged the incoming move. */
  avoided(label: string, side: Side): string;
}

/* ------------------------------------------------------------------ */
/* Two-turn moves (charge → release state machine)                     */
/* ------------------------------------------------------------------ */

/**
 * Moves that spend a turn preparing. The stance drives the hide animation,
 * the charge line and (except "charging") semi-invulnerability.
 */
export const TWO_TURN_MOVES: Record<string, ChargeStance> = {
  dig: "underground",
  fly: "airborne",
  bounce: "airborne",
  dive: "underwater",
  "phantom-force": "vanished",
  "shadow-force": "vanished",
  "solar-beam": "charging",
  "solar-blade": "charging",
  "sky-attack": "charging",
  "razor-wind": "charging",
  "skull-bash": "charging",
  "meteor-beam": "charging",
  "freeze-shock": "charging",
  "ice-burn": "charging",
  geomancy: "charging",
};

/**
 * Moves that pierce each semi-invulnerable stance, with their damage
 * multiplier from the games (Earthquake hits a digging target for double).
 *
 * Exportada porque la lee también el cerebro rival: un movimiento que no está
 * aquí sencillamente NO alcanza a quien se ha enterrado, y atacar a un hueco
 * es el turno más caro que se puede tirar. Sin esta tabla a mano, la IA lo
 * hacía cada vez.
 */
export const STANCE_BREAKERS: Record<
  Exclude<ChargeStance, "charging">,
  Record<string, number>
> = {
  underground: { earthquake: 2, magnitude: 2, fissure: 1 },
  airborne: {
    gust: 2,
    twister: 2,
    thunder: 1,
    hurricane: 1,
    "sky-uppercut": 1,
    "smack-down": 1,
    "thousand-arrows": 1,
  },
  underwater: { surf: 2, whirlpool: 2 },
  vanished: {},
};

/**
 * Movimientos que dejan K.O. a quien los usa, como en los juegos. Explosión y
 * Autodestrucción se llevan al usuario por delante; Sacrificio le deja los PS
 * que le quedaban al rival y a él, ninguno.
 */
const SELF_KO_MOVES = new Set([
  "explosion",
  "self-destruct",
  "misty-explosion",
  "final-gambit",
]);

/** Below this fraction of max HP the rival reaches for a healing item. */
const RIVAL_HEAL_THRESHOLD = 0.35;

/** Uniform random in [0, 1) — injectable for tests. */
export type Rng = () => number;

/** Main-series stat formulas at IV 31 / EV 0 / neutral nature. */
export function computeStats(
  base: Record<"hp" | "atk" | "def" | "spa" | "spd" | "spe", number>,
  level: number,
): CombatStats {
  const grow = (stat: number) => Math.floor(((2 * stat + 31) * level) / 100);
  return {
    hp: grow(base.hp) + level + 10,
    atk: grow(base.atk) + 5,
    def: grow(base.def) + 5,
    spa: grow(base.spa) + 5,
    spd: grow(base.spd) + 5,
    spe: grow(base.spe) + 5,
  };
}

export interface DamageRoll {
  damage: number;
  effectiveness: number;
  crit: boolean;
}

/* ------------------------------------------------------------------ */
/* Stat stages and status conditions                                   */
/* ------------------------------------------------------------------ */

const STAGE_CAP = 6;

/** Main-series stage multiplier: ±6 → ×4 / ×¼. */
export function stageMult(stage: number): number {
  return stage >= 0 ? (2 + stage) / 2 : 2 / (2 - stage);
}

/** Accuracy/evasion use a 3-based table instead. */
export function accuracyMult(stage: number): number {
  return stage >= 0 ? (3 + stage) / 3 : 3 / (3 - stage);
}

function getStage(b: Battler, stat: StageStat): number {
  return b.stages?.[stat] ?? 0;
}

/** Battle-effective stat: base × stage, with burn/paralysis penalties. */
export function effStat(
  b: Battler,
  stat: "atk" | "def" | "spa" | "spd" | "spe",
): number {
  let value = b.stats[stat] * stageMult(getStage(b, stat));
  if (stat === "atk" && b.status === "burn") value *= 0.5;
  if (stat === "spe" && b.status === "paralysis") value *= 0.5;
  return Math.max(1, Math.floor(value));
}

/** Type-based condition immunities, like the games. */
export const AILMENT_IMMUNE: Partial<Record<Ailment, string[]>> = {
  burn: ["fire"],
  paralysis: ["electric"],
  poison: ["poison", "steel"],
  freeze: ["ice"],
};

/** Resolved power: a base power for the formula, or a flat damage amount. */
type ResolvedPower =
  | { kind: "power"; value: number }
  | { kind: "fixed"; value: number };

/** Target-weight tiers (kg → power) for Grass Knot / Low Kick. */
const WEIGHT_TIERS: Array<[number, number]> = [
  [200, 120],
  [100, 100],
  [50, 80],
  [25, 60],
  [10, 40],
  [0, 20],
];

/** Fallback base power for variable moves without a dedicated formula. */
const VARIABLE_POWER_DEFAULT = 60;

/**
 * Effective power of one move this turn. Listed powers pass straight through;
 * variable moves (PokéAPI power = null) use simplified main-series mechanics
 * over the data this engine tracks (level, HP, speed, weight). `damageTaken`
 * is the damage the attacker received earlier this turn, for Counter-style
 * paybacks.
 */
function resolveMovePower(
  attacker: Battler,
  defender: Battler,
  move: BattleMove,
  rng: Rng,
  damageTaken: number,
): ResolvedPower {
  if (move.power !== null) return { kind: "power", value: move.power };
  const hpPct = attacker.hp / attacker.maxHp;

  switch (move.slug) {
    // Heavier targets take more.
    case "grass-knot":
    case "low-kick":
      return {
        kind: "power",
        value: WEIGHT_TIERS.find(([min]) => defender.weight >= min)![1],
      };
    // Heavier attackers hit harder relative to the target.
    case "heavy-slam":
    case "heat-crash": {
      const ratio = attacker.weight / Math.max(0.1, defender.weight);
      return {
        kind: "power",
        value: ratio >= 5 ? 120 : ratio >= 4 ? 100 : ratio >= 3 ? 80 : ratio >= 2 ? 60 : 40,
      };
    }
    // Speed ratios.
    case "gyro-ball":
      return {
        kind: "power",
        value: Math.min(
          150,
          Math.floor((25 * effStat(defender, "spe")) / effStat(attacker, "spe")) + 1,
        ),
      };
    case "electro-ball": {
      const ratio = effStat(attacker, "spe") / effStat(defender, "spe");
      return {
        kind: "power",
        value: ratio >= 4 ? 150 : ratio >= 3 ? 120 : ratio >= 2 ? 80 : ratio >= 1 ? 60 : 40,
      };
    }
    // Stronger while healthy…
    case "eruption":
    case "water-spout":
    case "dragon-energy":
      return { kind: "power", value: Math.max(1, Math.floor(150 * hpPct)) };
    // …or while desperate.
    case "flail":
    case "reversal":
      return {
        kind: "power",
        value:
          hpPct > 0.6875 ? 20
          : hpPct > 0.3542 ? 40
          : hpPct > 0.2083 ? 80
          : hpPct > 0.1042 ? 100
          : hpPct > 0.0417 ? 150
          : 200,
      };
    // Scales with the target's remaining HP.
    case "crush-grip":
    case "wring-out":
      return {
        kind: "power",
        value: Math.max(1, Math.floor((120 * defender.hp) / defender.maxHp)),
      };
    case "hard-press":
      return {
        kind: "power",
        value: Math.max(1, Math.floor((100 * defender.hp) / defender.maxHp)),
      };
    // Friendship-based — assume a fully bonded partner.
    case "return":
    case "frustration":
      return { kind: "power", value: 102 };
    // Random tiers (real Magnitude odds; Present without the heal branch).
    case "magnitude": {
      const r = rng();
      return {
        kind: "power",
        value:
          r < 0.05 ? 10
          : r < 0.15 ? 30
          : r < 0.35 ? 50
          : r < 0.65 ? 70
          : r < 0.85 ? 90
          : r < 0.95 ? 110
          : 150,
      };
    }
    case "present": {
      const r = rng();
      return { kind: "power", value: r < 0.4 ? 40 : r < 0.7 ? 80 : 120 };
    }
    // Flat damage (ignores stats, STAB and multipliers; immunity still applies).
    case "seismic-toss":
    case "night-shade":
      return { kind: "fixed", value: attacker.level };
    case "dragon-rage":
      return { kind: "fixed", value: 40 };
    case "sonic-boom":
      return { kind: "fixed", value: 20 };
    case "super-fang":
    case "natures-madness":
    case "ruination":
      return { kind: "fixed", value: Math.max(1, Math.floor(defender.hp / 2)) };
    case "endeavor":
      return { kind: "fixed", value: Math.max(0, defender.hp - attacker.hp) };
    case "final-gambit":
      return { kind: "fixed", value: attacker.hp };
    // Payback moves return double the damage received this turn (0 → fails).
    case "counter":
    case "mirror-coat":
    case "metal-burst":
    case "comeuppance":
      return { kind: "fixed", value: damageTaken * 2 };
    // One-hit KO — their ~30 accuracy is the real gate.
    case "guillotine":
    case "horn-drill":
    case "fissure":
    case "sheer-cold":
      return { kind: "fixed", value: defender.hp };
    default:
      return { kind: "power", value: VARIABLE_POWER_DEFAULT };
  }
}

/** Scoring estimate for AI heuristics, where no battle context exists yet. */
export function estimatePower(move: BattleMove): number {
  if (move.damageClass === "status") return 0;
  return move.power ?? VARIABLE_POWER_DEFAULT;
}

/**
 * Los dos dados que el motor tira dentro de la fórmula del daño, sacados
 * fuera para poder FIJARLOS.
 *
 * `crit` y `roll` los sortea `rollDamage` en el combate real; el cerebro
 * rival, en cambio, necesita preguntar «¿cuánto haría este movimiento de
 * media?» sin tirar ningún dado y sin reimplementar la fórmula por su cuenta
 * — una segunda copia de la fórmula es una copia que se queda atrás.
 */
export interface DamageDice {
  crit: boolean;
  /** Variación 0.85-1.0. La media exacta de ese intervalo es 0.925. */
  roll: number;
  /** Dado de los movimientos de potencia variable (Magnitud, Regalo). */
  powerRoll?: number;
}

/**
 * Simplified main-series damage formula (crit ×1.5, roll 0.85-1) with the
 * dice supplied by the caller. `damageTaken` (damage the attacker received
 * earlier this turn) feeds Counter-style moves; fixed-damage moves skip the
 * formula entirely.
 */
export function damageWith(
  attacker: Battler,
  defender: Battler,
  move: BattleMove,
  dice: DamageDice,
  damageTaken = 0,
): DamageRoll {
  const eff = effectiveness(move.type, defender.types);
  if (eff === 0) return { damage: 0, effectiveness: 0, crit: false };

  // La potencia variable consume su propio dado; con uno fijo, la estimación
  // de la IA es reproducible y no depende del orden en que se tiren.
  const powerRng: Rng = () => dice.powerRoll ?? 0.5;
  const resolved = resolveMovePower(attacker, defender, move, powerRng, damageTaken);
  if (resolved.kind === "fixed") {
    return { damage: Math.max(0, resolved.value), effectiveness: 1, crit: false };
  }

  const atk =
    move.damageClass === "physical"
      ? effStat(attacker, "atk")
      : effStat(attacker, "spa");
  const def =
    move.damageClass === "physical"
      ? effStat(defender, "def")
      : effStat(defender, "spd");
  const stab = attacker.types.includes(move.type) ? 1.5 : 1;

  const core = ((2 * attacker.level) / 5 + 2) * resolved.value * (atk / def);
  const damage = Math.max(
    1,
    Math.floor(
      (core / 50 + 2) * stab * eff * (dice.crit ? 1.5 : 1) * dice.roll,
    ),
  );
  return { damage, effectiveness: eff, crit: dice.crit };
}

/**
 * Un golpe real: los mismos cálculos, con los dados tirados aquí (crítico
 * 1/16, variación 0.85-1).
 */
export function rollDamage(
  attacker: Battler,
  defender: Battler,
  move: BattleMove,
  rng: Rng,
  damageTaken = 0,
): DamageRoll {
  return damageWith(
    attacker,
    defender,
    move,
    { powerRoll: rng(), crit: rng() < 1 / 16, roll: 0.85 + rng() * 0.15 },
    damageTaken,
  );
}

const active = (state: BattleState, side: Side): Battler =>
  state[side].team[state[side].active];

const alive = (state: BattleState, side: Side): boolean =>
  state[side].team.some((b) => b.hp > 0);

/**
 * Applies flat damage outside the normal attack path (recoil, chip damage,
 * confusion self-hits), emitting damage/faint/end events. Returns true when
 * the battle ended.
 */
function dealRawDamage(
  state: BattleState,
  victimSide: Side,
  amount: number,
  text: string,
  events: BattleEvent[],
  texts: EngineTexts,
): boolean {
  const victim = active(state, victimSide);
  const dmg = Math.max(1, Math.min(amount, victim.hp));
  victim.hp -= dmg;
  events.push({
    kind: "damage",
    side: victimSide,
    amount: dmg,
    newHp: victim.hp,
    effectiveness: 1,
    crit: false,
    text,
  });
  if (victim.hp === 0) {
    victim.charging = null;
    events.push({
      kind: "faint",
      side: victimSide,
      text: texts.faint(victim.label, victimSide),
    });
    if (!alive(state, victimSide)) {
      const winner: Side = victimSide === "player" ? "rival" : "player";
      events.push({
        kind: "end",
        winner,
        text: winner === "player" ? texts.win : texts.lose,
      });
      return true;
    }
  }
  return false;
}

/** Applies stage deltas with ±6 clamping, emitting one note per stat. */
function applyStatChanges(
  recipient: Battler,
  side: Side,
  changes: Array<{ stat: StageStat; change: number }>,
  events: BattleEvent[],
  texts: EngineTexts,
): void {
  for (const { stat, change } of changes) {
    if (change === 0) continue;
    recipient.stages ??= {};
    const current = recipient.stages[stat] ?? 0;
    const next = Math.max(-STAGE_CAP, Math.min(STAGE_CAP, current + change));
    const statName = texts.statNames[stat];
    if (next === current) {
      events.push({
        kind: "note",
        side,
        text:
          change > 0
            ? texts.statNoHigher(recipient.label, side, statName)
            : texts.statNoLower(recipient.label, side, statName),
      });
      continue;
    }
    recipient.stages[stat] = next;
    events.push({
      kind: "note",
      side,
      text:
        change > 0
          ? texts.statRose(recipient.label, side, statName, change >= 2)
          : texts.statFell(recipient.label, side, statName, change <= -2),
    });
  }
}

/** Tries to inflict a condition; `quiet` mutes failure notes (secondaries). */
function inflictAilment(
  recipient: Battler,
  side: Side,
  ailment: Ailment,
  rng: Rng,
  events: BattleEvent[],
  texts: EngineTexts,
  quiet: boolean,
): void {
  const failNote = () => {
    if (!quiet) events.push({ kind: "note", side, text: texts.noEffectGeneric });
  };
  if (AILMENT_IMMUNE[ailment]?.some((t) => recipient.types.includes(t))) {
    return failNote();
  }
  if (ailment === "confusion") {
    if ((recipient.confusedTurns ?? 0) > 0) return failNote();
    recipient.confusedTurns = 2 + Math.floor(rng() * 3); // 2-4 turns.
  } else {
    if (recipient.status) return failNote();
    recipient.status = ailment;
    if (ailment === "sleep") recipient.sleepTurns = 1 + Math.floor(rng() * 3);
  }
  events.push({
    kind: "note",
    side,
    text: texts.inflicted[ailment](recipient.label, side),
  });
}

/** Executes a status move: stat stages, healing and/or a condition. */
function performStatusMove(
  side: Side,
  attacker: Battler,
  defender: Battler,
  move: BattleMove,
  events: BattleEvent[],
  rng: Rng,
  texts: EngineTexts,
): void {
  const target: Side = side === "player" ? "rival" : "player";
  const e = move.effects;
  if (!e) {
    // Field/unique mechanics the engine doesn't model (Protect, Reflect…).
    events.push({ kind: "note", side, text: texts.fail });
    return;
  }
  // Foe-targeted status moves respect type immunities (T-Wave vs Ground…).
  if (e.target === "foe" && effectiveness(move.type, defender.types) === 0) {
    events.push({
      kind: "miss",
      side,
      text: texts.noEffect(defender.label, target),
    });
    return;
  }
  const recipient = e.target === "self" ? attacker : defender;
  const recipientSide = e.target === "self" ? side : target;
  let acted = false;
  if (e.statChanges.length > 0) {
    applyStatChanges(recipient, recipientSide, e.statChanges, events, texts);
    acted = true;
  }
  if (e.healingPct > 0) {
    const amount = Math.min(
      attacker.maxHp - attacker.hp,
      Math.max(1, Math.floor((attacker.maxHp * e.healingPct) / 100)),
    );
    if (amount > 0) {
      attacker.hp += amount;
      events.push({
        kind: "heal",
        side,
        amount,
        text: texts.healed(attacker.label, side),
      });
    } else {
      events.push({
        kind: "note",
        side,
        text: texts.healFull(attacker.label, side),
      });
    }
    acted = true;
  }
  if (e.ailment) {
    inflictAilment(recipient, recipientSide, e.ailment, rng, events, texts, false);
    acted = true;
  }
  if (!acted) events.push({ kind: "note", side, text: texts.fail });
}

/** Executes one move (attack or status), appending its events. Returns true
 *  when someone fainted because of it. */
function performMove(
  state: BattleState,
  side: Side,
  moveSlug: string,
  events: BattleEvent[],
  rng: Rng,
  texts: EngineTexts,
): boolean {
  const attacker = active(state, side);
  const target: Side = side === "player" ? "rival" : "player";
  const defender = active(state, target);

  // Release turn of a two-turn move: the stance ends now no matter what —
  // even a paralysis/confusion interruption brings the Pokémon back down.
  const wasCharging = attacker.charging ?? null;
  attacker.charging = null;
  /** Emits the sprite's return when an interruption cuts a charge short. */
  const interrupted = () => {
    if (wasCharging) events.push({ kind: "reappear", side, text: "" });
  };

  const move =
    (wasCharging
      ? attacker.moves.find((m) => m.slug === wasCharging.move)
      : undefined) ??
    attacker.moves.find((m) => m.slug === moveSlug && m.pp > 0) ??
    attacker.moves.find((m) => m.pp > 0);
  if (!move) {
    interrupted();
    return false;
  }

  // Pre-action condition checks: sleep, freeze, paralysis, confusion.
  if (attacker.status === "sleep") {
    attacker.sleepTurns = (attacker.sleepTurns ?? 1) - 1;
    if ((attacker.sleepTurns ?? 0) > 0) {
      events.push({ kind: "note", side, text: texts.asleep(attacker.label, side) });
      interrupted();
      return false;
    }
    attacker.status = null;
    events.push({ kind: "note", side, text: texts.wokeUp(attacker.label, side) });
  } else if (attacker.status === "freeze") {
    if (rng() < 0.2) {
      attacker.status = null;
      events.push({ kind: "note", side, text: texts.thawed(attacker.label, side) });
    } else {
      events.push({
        kind: "note",
        side,
        text: texts.frozenSolid(attacker.label, side),
      });
      interrupted();
      return false;
    }
  }
  if (attacker.status === "paralysis" && rng() < 0.25) {
    events.push({
      kind: "note",
      side,
      text: texts.fullyParalyzed(attacker.label, side),
    });
    interrupted();
    return false;
  }
  if ((attacker.confusedTurns ?? 0) > 0) {
    attacker.confusedTurns = (attacker.confusedTurns ?? 1) - 1;
    if (attacker.confusedTurns === 0) {
      events.push({ kind: "note", side, text: texts.snappedOut(attacker.label, side) });
    } else {
      events.push({
        kind: "note",
        side,
        text: texts.confusedCheck(attacker.label, side),
      });
      if (rng() < 1 / 3) {
        // Typeless 40-power physical self-hit, like the games.
        const core =
          ((2 * attacker.level) / 5 + 2) *
          40 *
          (effStat(attacker, "atk") / effStat(attacker, "def"));
        const selfDamage = Math.max(1, Math.floor(core / 50 + 2));
        interrupted();
        return dealRawDamage(state, side, selfDamage, texts.hurtItself, events, texts);
      }
    }
  }

  // Turn 1 of a two-turn move: announce, hide and lock next turn's action.
  // PP is spent on the release turn, like the games.
  const stance = TWO_TURN_MOVES[move.slug];
  if (!wasCharging && stance && move.damageClass !== "status") {
    attacker.charging = { move: move.slug, stance };
    events.push({
      kind: "use-move",
      side,
      move,
      text: texts.useMove(attacker.label, side, move.label),
    });
    events.push({
      kind: "charge",
      side,
      move,
      stance,
      text: texts.charge[stance](attacker.label, side),
    });
    return false;
  }

  move.pp = Math.max(0, move.pp - 1);
  events.push({
    kind: "use-move",
    side,
    move,
    release: wasCharging !== null,
    text: texts.useMove(attacker.label, side, move.label),
  });

  // Semi-invulnerable defender (Dig, Fly…): only its stance breakers land;
  // everything else — including foe-targeted status moves — just misses.
  const defStance =
    defender.charging && defender.charging.stance !== "charging"
      ? defender.charging.stance
      : null;
  let stanceMult = 1;
  if (
    defStance &&
    (move.damageClass !== "status" || move.effects?.target === "foe")
  ) {
    const pierce = STANCE_BREAKERS[defStance][move.slug];
    if (pierce === undefined) {
      events.push({
        kind: "miss",
        side,
        text: texts.avoided(defender.label, target),
      });
      return false;
    }
    stanceMult = pierce;
  }

  // Accuracy, shifted by the attacker's accuracy vs the defender's evasion.
  if (move.accuracy !== null) {
    const stageDiff = Math.max(
      -STAGE_CAP,
      Math.min(STAGE_CAP, getStage(attacker, "acc") - getStage(defender, "eva")),
    );
    if (rng() * 100 >= move.accuracy * accuracyMult(stageDiff)) {
      events.push({ kind: "miss", side, text: texts.miss(attacker.label, side) });
      return false;
    }
  }

  if (move.damageClass === "status") {
    performStatusMove(side, attacker, defender, move, events, rng, texts);
    return false;
  }

  // Damage this side already received this turn feeds Counter-style moves.
  const damageTaken = events
    .filter(
      (e): e is Extract<BattleEvent, { kind: "damage" }> =>
        e.kind === "damage" && e.side === side,
    )
    .reduce((sum, e) => sum + e.amount, 0);

  const roll = rollDamage(attacker, defender, move, rng, damageTaken);
  const { effectiveness: eff, crit } = roll;
  // Stance breakers (Earthquake into Dig…) land with their games multiplier.
  const damage = Math.floor(roll.damage * stanceMult);
  if (eff === 0) {
    events.push({
      kind: "miss",
      side,
      text: texts.noEffect(defender.label, target),
    });
    return false;
  }
  // A payback with nothing to return (Counter with no hit taken, Endeavor
  // against a weaker target…) simply fails.
  if (damage <= 0) {
    events.push({
      kind: "miss",
      side,
      text: texts.miss(attacker.label, side),
    });
    return false;
  }

  defender.hp = Math.max(0, defender.hp - damage);
  const notes = [
    crit ? texts.crit : null,
    eff > 1 ? texts.superEffective : eff < 1 ? texts.notVeryEffective : null,
  ]
    .filter(Boolean)
    .join(" ");
  events.push({
    kind: "damage",
    side: target,
    amount: damage,
    newHp: defender.hp,
    effectiveness: eff,
    crit,
    text: notes,
  });

  // Los que se llevan por delante a quien los usa. El motor se lo saltaba, y
  // Sacrificio en particular quedaba como un cañonazo gratis: pegaba tantos PS
  // como le quedaban al usuario y el usuario seguía en pie. Un cerebro que
  // busca el mejor valor esperado encuentra eso y no lo suelta.
  const selfKo = SELF_KO_MOVES.has(move.slug);
  const targetFainted = defender.hp === 0;
  if (targetFainted) defender.charging = null;
  if (selfKo) {
    attacker.hp = 0;
    attacker.charging = null;
    events.push({
      kind: "faint",
      side,
      text: texts.faint(attacker.label, side),
    });
  }
  if (targetFainted) {
    events.push({
      kind: "faint",
      side: target,
      text: texts.faint(defender.label, target),
    });
  }
  if (selfKo || targetFainted) {
    const attackerStanding = alive(state, side);
    const targetStanding = alive(state, target);
    if (!attackerStanding || !targetStanding) {
      // Si caen los dos últimos a la vez, el combate lo gana quien encajó el
      // golpe: el que lo lanzó se fue con él.
      const winner: Side = targetStanding ? target : side;
      events.push({
        kind: "end",
        winner,
        text: winner === "player" ? texts.win : texts.lose,
      });
    }
    return true;
  }

  // Drain / recoil / secondary effects, only while the target stands (a
  // small simplification that keeps the event order readable).
  const e = move.effects;
  if (e) {
    if (e.drainPct > 0) {
      const amount = Math.min(
        attacker.maxHp - attacker.hp,
        Math.max(1, Math.floor((damage * e.drainPct) / 100)),
      );
      if (amount > 0) {
        attacker.hp += amount;
        events.push({
          kind: "heal",
          side,
          amount,
          text: texts.drained(attacker.label, side),
        });
      }
    } else if (e.drainPct < 0) {
      const amount = Math.max(1, Math.floor((damage * -e.drainPct) / 100));
      if (
        dealRawDamage(state, side, amount, texts.recoil(attacker.label, side), events, texts)
      ) {
        return true;
      }
    }
    if (e.ailment && rng() * 100 < (e.ailmentChance || 100)) {
      inflictAilment(defender, target, e.ailment, rng, events, texts, true);
    }
    if (e.statChanges.length > 0 && rng() * 100 < (e.statChance || 100)) {
      const recipient = e.target === "self" ? attacker : defender;
      const rSide = e.target === "self" ? side : target;
      applyStatChanges(recipient, rSide, e.statChanges, events, texts);
    }
  }
  return false;
}

/** Applies a non-move action (switch/item). These always act first. */
function performInstant(
  state: BattleState,
  side: Side,
  action: BattleAction,
  events: BattleEvent[],
  texts: EngineTexts,
  items: ItemTexts,
  itemName: (id: BagItemId) => string,
): void {
  const s = state[side];
  if (action.kind === "switch") {
    const to = s.team[action.to];
    if (!to || to.hp <= 0 || action.to === s.active) return;
    // Switching out clears stages, confusion and any in-progress charge
    // (major status persists).
    const out = s.team[s.active];
    out.stages = {};
    out.confusedTurns = 0;
    out.charging = null;
    s.active = action.to;
    events.push({
      kind: "switch",
      side,
      to: action.to,
      text: texts.sendOut(to.label, side),
    });
  } else if (action.kind === "item") {
    spendItem(state, side, action, events, texts, items, itemName);
  }
}

/**
 * Spends one bag item. Revive targets a fainted bench member; everything else
 * acts on the battler that's out. A use that would do nothing (a full-HP
 * Potion, a Full Heal with no status) is a no-op and doesn't burn the item —
 * the HUD greys those out, so this is only a guard against a stale click.
 */
function spendItem(
  state: BattleState,
  side: Side,
  action: Extract<BattleAction, { kind: "item" }>,
  events: BattleEvent[],
  texts: EngineTexts,
  items: ItemTexts,
  itemName: (id: BagItemId) => string,
): void {
  const s = state[side];
  const spec = BAG_ITEMS[action.item];
  if (!spec || (s.bag[action.item] ?? 0) <= 0) return;

  const target = spec.revives
    ? s.team[action.target ?? -1]
    : s.team[s.active];
  if (!target) return;
  if (spec.revives && target.hp > 0) return;

  // Work out the effect first, so a useless item is never consumed.
  const healed = spec.revives
    ? Math.max(1, Math.floor(target.maxHp / 2))
    : Math.min(
        healValue(action.item, target.maxHp),
        target.maxHp - target.hp,
      );
  const cures = Boolean(spec.curesStatus && target.status);
  if (healed <= 0 && !cures && !spec.stage) return;

  s.bag[action.item] = (s.bag[action.item] ?? 0) - 1;
  events.push({
    kind: "note",
    side,
    text: items.use(itemName(action.item), side),
    item: action.item,
  });

  if (healed > 0) {
    target.hp += healed;
    events.push({
      kind: "heal",
      side,
      amount: healed,
      text: spec.revives
        ? items.revived(target.label, side)
        : items.restored(target.label, side, healed),
    });
  }
  if (cures) {
    target.status = null;
    target.sleepTurns = 0;
    events.push({ kind: "note", side, text: items.cured(target.label, side) });
  }
  if (spec.stage) {
    applyStatChanges(target, side, [spec.stage], events, texts);
  }
}

/**
 * Resolves one full turn, mutating `state` and returning the ordered events.
 * Switches and potions resolve first (player before rival); then moves in
 * speed order (speed tie broken by rng). A fainted battler never moves; the
 * UI handles forced replacements after replaying the events.
 *
 * `texts` selects the language of the emitted battle lines; it defaults to
 * the Spanish bundle so existing callers keep working unchanged.
 */
export function resolveTurn(
  state: BattleState,
  playerAction: BattleAction,
  rivalAction: BattleAction,
  rng: Rng = Math.random,
  texts: EngineTexts = battleDict.es.engine,
  items: ItemTexts = bagDict.es.engine,
  itemName: (id: BagItemId) => string = (id) => bagDict.es.itemName[id],
): BattleEvent[] {
  const events: BattleEvent[] = [];
  state.turn += 1;

  // A battler midway through a two-turn move is locked into releasing it:
  // whatever the side chose, the engine forces the charged move (the UI
  // skips the menus, but the rival AI's answer must be overridden too).
  const lockCharge = (side: Side, chosen: BattleAction): BattleAction => {
    const c = active(state, side).charging;
    return c ? { kind: "move", move: c.move } : chosen;
  };
  playerAction = lockCharge("player", playerAction);
  rivalAction = lockCharge("rival", rivalAction);

  if (playerAction.kind !== "move")
    performInstant(state, "player", playerAction, events, texts, items, itemName);
  if (rivalAction.kind !== "move")
    performInstant(state, "rival", rivalAction, events, texts, items, itemName);

  const movers: Side[] = [];
  if (playerAction.kind === "move") movers.push("player");
  if (rivalAction.kind === "move") movers.push("rival");
  movers.sort((a, b) => {
    // Effective speed: stages + paralysis included.
    const diff = effStat(active(state, b), "spe") - effStat(active(state, a), "spe");
    return diff !== 0 ? diff : rng() < 0.5 ? -1 : 1;
  });

  for (const side of movers) {
    if (active(state, side).hp <= 0) continue; // Fainted before acting.
    const action = side === "player" ? playerAction : rivalAction;
    if (action.kind !== "move") continue;
    const fainted = performMove(state, side, action.move, events, rng, texts);
    if (fainted && events.some((e) => e.kind === "end")) break;
  }

  // End-of-turn chip damage (burn/poison), player first like the games.
  if (!events.some((e) => e.kind === "end")) {
    for (const side of ["player", "rival"] as Side[]) {
      const b = active(state, side);
      if (b.hp <= 0) continue;
      if (b.status === "burn") {
        if (
          dealRawDamage(
            state,
            side,
            Math.max(1, Math.floor(b.maxHp / 16)),
            texts.hurtByBurn(b.label, side),
            events,
            texts,
          )
        ) {
          break;
        }
      } else if (b.status === "poison") {
        if (
          dealRawDamage(
            state,
            side,
            Math.max(1, Math.floor(b.maxHp / 8)),
            texts.hurtByPoison(b.label, side),
            events,
            texts,
          )
        ) {
          break;
        }
      }
    }
  }

  return events;
}

/**
 * Best bench index for a forced replacement (type edge, then HP).
 *
 * `side` va con valor por defecto para que las llamadas de la arena sigan
 * igual; lo necesita el banco de pruebas, que juega los dos asientos.
 */
export function pickRivalReplacement(
  state: BattleState,
  side: Side = "rival",
): number | null {
  const foeSide: Side = side === "rival" ? "player" : "rival";
  const playerActive = active(state, foeSide);
  const bench = state[side];
  let bestIndex = -1;
  let bestScore = -Infinity;
  for (let index = 0; index < bench.team.length; index++) {
    const b = bench.team[index];
    if (b.hp <= 0 || index === bench.active) continue;
    const offense = Math.max(
      ...b.moves.map((m) => effectiveness(m.type, playerActive.types)),
      0,
    );
    const defense = Math.max(
      ...playerActive.types.map((t) => effectiveness(t, b.types)),
    );
    const score = offense * 2 - defense + b.hp / b.maxHp;
    if (score > bestScore) {
      bestScore = score;
      bestIndex = index;
    }
  }
  return bestIndex === -1 ? null : bestIndex;
}

/**
 * The rival reaching into its own bag: it patches up an active Pokémon that
 * is nearly down, picking the smallest item that still fills the gap so it
 * doesn't waste a Full Restore on a scratch. Returns null when it should just
 * keep attacking — which is most turns.
 */
export function pickRivalItem(
  state: BattleState,
  side: Side = "rival",
): BattleAction | null {
  const b = active(state, side);
  const missing = b.maxHp - b.hp;
  if (b.hp <= 0 || b.hp / b.maxHp > RIVAL_HEAL_THRESHOLD) return null;

  const bag = state[side].bag;
  const usable = (Object.keys(bag) as BagItemId[]).filter(
    (id) => (bag[id] ?? 0) > 0,
  );
  const healers = usable
    .filter((id) => BAG_ITEMS[id].heal > 0 || BAG_ITEMS[id].healAll)
    .sort((a, c) => {
      const value = (id: BagItemId) => healValue(id, b.maxHp);
      // Smallest item that covers the damage taken; otherwise the biggest.
      const coversA = value(a) >= missing;
      const coversC = value(c) >= missing;
      if (coversA !== coversC) return coversA ? -1 : 1;
      return coversA ? value(a) - value(c) : value(c) - value(a);
    });
  return healers[0] ? { kind: "item", item: healers[0] } : null;
}

/** Heuristic move choice — the rival's fallback when the LLM is unavailable. */
export function pickFallbackMove(state: BattleState): BattleAction {
  const attacker = active(state, "rival");
  const defender = active(state, "player");
  const usable = attacker.moves.filter((m) => m.pp > 0);
  if (usable.length === 0) return { kind: "move", move: attacker.moves[0]?.slug ?? "" };
  const scored = usable
    .map((m) => ({
      m,
      score:
        estimatePower(m) *
        effectiveness(m.type, defender.types) *
        (attacker.types.includes(m.type) ? 1.5 : 1),
    }))
    .sort((a, b) => b.score - a.score);
  return { kind: "move", move: scored[0].m.slug };
}
