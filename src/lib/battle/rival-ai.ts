/**
 * Tiered rival brain for the tournament ladder.
 *
 * The AI battle mode asks a language model what to do each turn; the
 * tournament wants a *predictable* difficulty curve instead, so every round
 * resolves its action here first and only asks the model for flavour. Three
 * tiers, mirroring how trainers escalate in the main-series facilities:
 *
 *  - `rookie`   — barely reads the type chart, hits mostly at random.
 *  - `veteran`  — always looks for the super-effective hit and heals up.
 *  - `champion` — sets up, uses status moves and pivots out of bad matchups.
 */
import { estimatePower, pickRivalItem } from "./engine";
import { effectiveness } from "./type-chart";
import type { BattleAction, BattleMove, BattleState, Battler } from "@/types/battle";
import type { RivalTier } from "@/types/tournament";

/** Carried between turns so the champion never ping-pongs its switches. */
export interface RivalMemory {
  /** Turn number of the last switch; -1 when it has never switched. */
  lastSwitchTurn: number;
  /** Slugs of the status moves already used, so it doesn't re-apply them. */
  usedStatus: string[];
}

export function createRivalMemory(): RivalMemory {
  return { lastSwitchTurn: -1, usedStatus: [] };
}

type Rng = () => number;

const usableMoves = (b: Battler): BattleMove[] => b.moves.filter((m) => m.pp > 0);

/** Damage-ish score of a move against the current foe (STAB and types in). */
function score(move: BattleMove, attacker: Battler, defender: Battler): number {
  return (
    estimatePower(move) *
    effectiveness(move.type, defender.types) *
    (attacker.types.includes(move.type) ? 1.5 : 1)
  );
}

/** Worst multiplier the defender takes from the attacker's STAB types. */
function typePressure(attacker: Battler, defender: Battler): number {
  return Math.max(
    ...attacker.types.map((t) => effectiveness(t, defender.types)),
    0,
  );
}

/** A rookie swings mostly on instinct, with a soft spot for its own type. */
function rookieMove(state: BattleState, rng: Rng): BattleAction {
  const attacker = state.rival.team[state.rival.active];
  const defender = state.player.team[state.player.active];
  const usable = usableMoves(attacker);
  if (usable.length === 0) {
    return { kind: "move", move: attacker.moves[0]?.slug ?? "" };
  }
  // Just over half the time it picks blind; the rest it at least reaches for
  // something it gets STAB on. Status moves are left to the better trainers.
  const damaging = usable.filter((m) => m.damageClass !== "status");
  const pool = damaging.length > 0 ? damaging : usable;
  if (rng() < 0.55) {
    return { kind: "move", move: pool[Math.floor(rng() * pool.length)].slug };
  }
  const stab = pool.filter((m) => attacker.types.includes(m.type));
  const shortlist = stab.length > 0 ? stab : pool;
  const best = [...shortlist].sort(
    (a, b) => score(b, attacker, defender) - score(a, attacker, defender),
  )[0];
  return { kind: "move", move: best.slug };
}

/** Highest expected damage; the workhorse decision of the upper tiers. */
function bestMove(state: BattleState): BattleAction {
  const attacker = state.rival.team[state.rival.active];
  const defender = state.player.team[state.player.active];
  const usable = usableMoves(attacker).filter((m) => m.damageClass !== "status");
  const pool = usable.length > 0 ? usable : usableMoves(attacker);
  if (pool.length === 0) {
    return { kind: "move", move: attacker.moves[0]?.slug ?? "" };
  }
  const best = [...pool].sort(
    (a, b) => score(b, attacker, defender) - score(a, attacker, defender),
  )[0];
  return { kind: "move", move: best.slug };
}

/**
 * Bench index the champion would rather have in front of it: something that
 * blunts the player's STAB and answers back hard. `null` when nothing on the
 * bench improves the matchup enough to be worth the free turn.
 */
function pivotTarget(state: BattleState): number | null {
  const foe = state.player.team[state.player.active];
  const current = state.rival.team[state.rival.active];
  const currentPressure = typePressure(foe, current);
  // Only bail out of a matchup that is actually losing: the foe hits us for
  // super effective damage and we have no super effective answer.
  const ourBest = Math.max(
    ...usableMoves(current).map((m) => effectiveness(m.type, foe.types)),
    0,
  );
  if (currentPressure < 2 || ourBest >= 2) return null;

  let bestIndex: number | null = null;
  let bestScore = 0;
  state.rival.team.forEach((b, index) => {
    if (index === state.rival.active || b.hp <= 0) return;
    const incoming = typePressure(foe, b);
    const outgoing = Math.max(
      ...usableMoves(b).map((m) => effectiveness(m.type, foe.types)),
      0,
    );
    // Wants to resist what is coming and threaten back.
    const value = outgoing * 2 - incoming * 2 + b.hp / b.maxHp;
    if (incoming <= 1 && value > bestScore) {
      bestScore = value;
      bestIndex = index;
    }
  });
  return bestIndex;
}

/**
 * A status move worth spending a turn on: a boost for itself or a condition
 * for a healthy foe. Returns null once the trick has already been played.
 */
function setupMove(
  state: BattleState,
  memory: RivalMemory,
  rng: Rng,
): BattleMove | null {
  const attacker = state.rival.team[state.rival.active];
  const foe = state.player.team[state.player.active];
  // No time for set-up when the foe is nearly down or we are.
  if (foe.hp / foe.maxHp < 0.55 || attacker.hp / attacker.maxHp < 0.5) return null;
  const candidates = usableMoves(attacker).filter(
    (m) =>
      m.damageClass === "status" &&
      m.effects &&
      !memory.usedStatus.includes(m.slug) &&
      // A condition only lands on a foe that has none, and a boost is only
      // worth it while there is a battle left to use it in.
      (m.effects.statChanges.length > 0 ||
        (m.effects.ailment !== null && !foe.status)),
  );
  if (candidates.length === 0) return null;
  // Deliberately not automatic: a champion that always opens with the same
  // set-up turn is as readable as one that never does.
  return rng() < 0.7 ? candidates[Math.floor(rng() * candidates.length)] : null;
}

/**
 * One tournament turn for the rival. `memory` is kept by the caller across the
 * whole battle so switch and set-up decisions can look back at what the
 * trainer already did.
 */
export function pickTieredAction(
  state: BattleState,
  tier: RivalTier,
  memory: RivalMemory,
  rng: Rng = Math.random,
): BattleAction {
  const active = state.rival.team[state.rival.active];

  // Everyone above the rookie tier patches up a Pokémon that is about to drop.
  if (tier !== "rookie") {
    const item = pickRivalItem(state);
    if (item) return item;
  }

  if (tier === "rookie") return rookieMove(state, rng);
  if (tier === "veteran") return bestMove(state);

  // Champion: pivot out of a losing matchup (never two turns running), set a
  // condition or a boost while there is time, then hit as hard as it can.
  if (memory.lastSwitchTurn !== state.turn - 1 && active.hp > 0) {
    const target = pivotTarget(state);
    if (target !== null) {
      memory.lastSwitchTurn = state.turn;
      return { kind: "switch", to: target };
    }
  }
  const setup = setupMove(state, memory, rng);
  if (setup) {
    memory.usedStatus.push(setup.slug);
    return { kind: "move", move: setup.slug };
  }
  return bestMove(state);
}
