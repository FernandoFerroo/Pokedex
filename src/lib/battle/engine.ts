/**
 * Pure, deterministic-given-rng battle engine. No fetches, no React: the
 * client orchestrator mutates a BattleState through `resolveTurn` and replays
 * the returned events with animations. All battle text is produced here so
 * every surface (log, tests) reads the same Spanish lines.
 */
import type {
  BattleAction,
  BattleEvent,
  BattleMove,
  BattleState,
  Battler,
  CombatStats,
  Side,
} from "@/types/battle";
import { effectiveness } from "./type-chart";

/** HP restored by one Potion. */
export const POTION_HEAL = 60;

/** Potions each side carries into battle. */
export const BAG_POTIONS = 3;

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

/** Simplified main-series damage formula (crit 1/16 ×1.5, roll 0.85-1). */
export function rollDamage(
  attacker: Battler,
  defender: Battler,
  move: BattleMove,
  rng: Rng,
): DamageRoll {
  const eff = effectiveness(move.type, defender.types);
  if (eff === 0) return { damage: 0, effectiveness: 0, crit: false };

  const atk = move.damageClass === "physical" ? attacker.stats.atk : attacker.stats.spa;
  const def = move.damageClass === "physical" ? defender.stats.def : defender.stats.spd;
  const stab = attacker.types.includes(move.type) ? 1.5 : 1;
  const crit = rng() < 1 / 16;
  const roll = 0.85 + rng() * 0.15;

  const core = ((2 * attacker.level) / 5 + 2) * move.power * (atk / def);
  const damage = Math.max(
    1,
    Math.floor((core / 50 + 2) * stab * eff * (crit ? 1.5 : 1) * roll),
  );
  return { damage, effectiveness: eff, crit };
}

const sideLabel = (side: Side) => (side === "player" ? "" : " enemigo");

const active = (state: BattleState, side: Side): Battler =>
  state[side].team[state[side].active];

const alive = (state: BattleState, side: Side): boolean =>
  state[side].team.some((b) => b.hp > 0);

/** Executes one damaging move, appending its events. Returns true on faint. */
function performMove(
  state: BattleState,
  side: Side,
  moveSlug: string,
  events: BattleEvent[],
  rng: Rng,
): boolean {
  const attacker = active(state, side);
  const target: Side = side === "player" ? "rival" : "player";
  const defender = active(state, target);

  const move =
    attacker.moves.find((m) => m.slug === moveSlug && m.pp > 0) ??
    attacker.moves.find((m) => m.pp > 0);
  if (!move) return false;
  move.pp -= 1;

  events.push({
    kind: "use-move",
    side,
    move,
    text: `¡${attacker.label}${sideLabel(side)} usó ${move.label}!`,
  });

  if (move.accuracy !== null && rng() * 100 >= move.accuracy) {
    events.push({
      kind: "miss",
      side,
      text: `¡${attacker.label} falló el ataque!`,
    });
    return false;
  }

  const { damage, effectiveness: eff, crit } = rollDamage(
    attacker,
    defender,
    move,
    rng,
  );
  if (eff === 0) {
    events.push({
      kind: "miss",
      side,
      text: `No afecta a ${defender.label}${sideLabel(target)}…`,
    });
    return false;
  }

  defender.hp = Math.max(0, defender.hp - damage);
  const notes = [
    crit ? "¡Golpe crítico!" : null,
    eff > 1 ? "¡Es súper eficaz!" : eff < 1 ? "No es muy eficaz…" : null,
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

  if (defender.hp === 0) {
    events.push({
      kind: "faint",
      side: target,
      text: `¡${defender.label}${sideLabel(target)} se debilitó!`,
    });
    if (!alive(state, target)) {
      events.push({
        kind: "end",
        winner: side,
        text:
          side === "player"
            ? "¡Has ganado el combate!"
            : "Te has quedado sin Pokémon… ¡Has perdido!",
      });
    }
    return true;
  }
  return false;
}

/** Applies a non-move action (switch/potion). These always act first. */
function performInstant(
  state: BattleState,
  side: Side,
  action: BattleAction,
  events: BattleEvent[],
): void {
  const s = state[side];
  if (action.kind === "switch") {
    const to = s.team[action.to];
    if (!to || to.hp <= 0 || action.to === s.active) return;
    s.active = action.to;
    events.push({
      kind: "switch",
      side,
      to: action.to,
      text:
        side === "player"
          ? `¡Adelante, ${to.label}!`
          : `¡El rival envía a ${to.label}!`,
    });
  } else if (action.kind === "potion") {
    if (s.potions <= 0) return;
    const b = s.team[s.active];
    const amount = Math.min(POTION_HEAL, b.maxHp - b.hp);
    if (amount <= 0) return;
    s.potions -= 1;
    b.hp += amount;
    events.push({
      kind: "heal",
      side,
      amount,
      text:
        side === "player"
          ? `Usaste una Poción: ${b.label} recupera ${amount} PS.`
          : `¡El rival usa una Poción y ${b.label} recupera ${amount} PS!`,
    });
  }
}

/**
 * Resolves one full turn, mutating `state` and returning the ordered events.
 * Switches and potions resolve first (player before rival); then moves in
 * speed order (speed tie broken by rng). A fainted battler never moves; the
 * UI handles forced replacements after replaying the events.
 */
export function resolveTurn(
  state: BattleState,
  playerAction: BattleAction,
  rivalAction: BattleAction,
  rng: Rng = Math.random,
): BattleEvent[] {
  const events: BattleEvent[] = [];
  state.turn += 1;

  if (playerAction.kind !== "move") performInstant(state, "player", playerAction, events);
  if (rivalAction.kind !== "move") performInstant(state, "rival", rivalAction, events);

  const movers: Side[] = [];
  if (playerAction.kind === "move") movers.push("player");
  if (rivalAction.kind === "move") movers.push("rival");
  movers.sort((a, b) => {
    const diff = active(state, b).stats.spe - active(state, a).stats.spe;
    return diff !== 0 ? diff : rng() < 0.5 ? -1 : 1;
  });

  for (const side of movers) {
    if (active(state, side).hp <= 0) continue; // Fainted before acting.
    const action = side === "player" ? playerAction : rivalAction;
    if (action.kind !== "move") continue;
    const fainted = performMove(state, side, action.move, events, rng);
    if (fainted && events.some((e) => e.kind === "end")) break;
  }

  return events;
}

/** Best bench index for a forced rival replacement (type edge, then HP). */
export function pickRivalReplacement(state: BattleState): number | null {
  const playerActive = active(state, "player");
  let bestIndex = -1;
  let bestScore = -Infinity;
  for (let index = 0; index < state.rival.team.length; index++) {
    const b = state.rival.team[index];
    if (b.hp <= 0 || index === state.rival.active) continue;
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
        m.power *
        effectiveness(m.type, defender.types) *
        (attacker.types.includes(m.type) ? 1.5 : 1),
    }))
    .sort((a, b) => b.score - a.score);
  return { kind: "move", move: scored[0].m.slug };
}
