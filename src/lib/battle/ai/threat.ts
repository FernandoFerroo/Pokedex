/**
 * Quién va ganando el intercambio, y qué se supone que sabe la IA.
 *
 * Lo segundo importa tanto como lo primero. El estado del combate lleva dentro
 * el equipo entero del jugador con sus cuatro movimientos, así que un cerebro
 * que lo lea todo juega con las cartas del otro boca arriba — y eso no se lee
 * como «difícil», se lee como tramposo: cambia para esquivar un Rayo Hielo que
 * nunca has usado. Por eso casi todos los Entrenadores razonan sobre lo que
 * han VISTO, más una sospecha razonable a partir de los tipos del rival.
 */
import { effectiveness } from "@/lib/battle/type-chart";
import type { BattleMove, Battler } from "@/types/battle";
import { expectedDamage, speedEdge, type Estimate } from "./damage";

/** Qué ve la IA del equipo contrario. */
export type Knowledge = "revealed" | "full";

/**
 * Potencia de la sospecha: un ataque genérico del tipo del rival, para razonar
 * sobre un Pokémon del que todavía no se ha visto nada. 80 es la potencia
 * típica de un movimiento fuerte de nivel medio en el juego.
 */
const PRIOR_POWER = 80;

/** Movimiento imaginario del tipo `type`, físico, para las sospechas. */
function priorMove(type: string): BattleMove {
  return {
    slug: `~prior-${type}`,
    label: type,
    type,
    damageClass: "physical",
    power: PRIOR_POWER,
    accuracy: 100,
    pp: 1,
    maxPp: 1,
  };
}

/**
 * Los movimientos con los que hay que contar del contrario. Con conocimiento
 * completo, los suyos. Con conocimiento parcial, los que ya ha enseñado más un
 * ataque supuesto por cada uno de sus tipos: así respeta lo que le han hecho y
 * trata lo desconocido como una posibilidad, no como una certeza.
 */
export function knownMoves(
  foe: Battler,
  knowledge: Knowledge,
  seen: readonly string[],
): BattleMove[] {
  if (knowledge === "full") return foe.moves;
  const revealed = foe.moves.filter((m) => seen.includes(m.slug));
  const priors = foe.types.map(priorMove);
  return [...revealed, ...priors];
}

export interface Threat {
  move: BattleMove | null;
  est: Estimate;
  /** Daño esperado ya ponderado por la probabilidad de acertar. */
  ev: number;
}

const NO_THREAT: Threat = {
  move: null,
  est: { avg: 0, min: 0, max: 0, hit: 0, eff: 1, wasted: true },
  ev: 0,
};

/** El movimiento que más daño esperado hace, de los que puede usar. */
export function bestAttack(
  attacker: Battler,
  defender: Battler,
  moves: readonly BattleMove[],
): Threat {
  let best = NO_THREAT;
  for (const move of moves) {
    if (move.pp <= 0 && !move.slug.startsWith("~prior-")) continue;
    if (move.damageClass === "status") continue;
    const est = expectedDamage(attacker, defender, move);
    if (est.wasted) continue;
    const ev = est.avg * est.hit;
    if (ev > best.ev) best = { move, est, ev };
  }
  return best;
}

/** Turnos que tarda `attacker` en tumbar a `defender`, o Infinity. */
export function turnsToKO(
  attacker: Battler,
  defender: Battler,
  moves: readonly BattleMove[],
): number {
  const { ev } = bestAttack(attacker, defender, moves);
  if (ev <= 0) return Infinity;
  return Math.ceil(defender.hp / ev);
}

/**
 * Cómo de bien va el intercambio, de −1 a +1. Cuenta los turnos que tarda cada
 * uno en tumbar al otro y quién pega primero, que es lo que decide un
 * intercambio parejo.
 */
export function raceScore(
  me: Battler,
  foe: Battler,
  myMoves: readonly BattleMove[],
  foeMoves: readonly BattleMove[],
): number {
  const mine = turnsToKO(me, foe, myMoves);
  const theirs = turnsToKO(foe, me, foeMoves);
  // Los dos incapaces de matar: tablas.
  if (mine === Infinity && theirs === Infinity) return 0;
  if (mine === Infinity) return -1;
  if (theirs === Infinity) return 1;
  const edge = theirs - mine + (speedEdge(me, foe) - 0.5);
  return Math.tanh(edge / 2);
}

/** La peor cara que le pone el atacante al defensor con sus tipos propios. */
export function typePressure(attacker: Battler, defender: Battler): number {
  return Math.max(
    ...attacker.types.map((t) => effectiveness(t, defender.types)),
    0,
  );
}
