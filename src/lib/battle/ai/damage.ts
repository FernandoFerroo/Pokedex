/**
 * Cuánto haría un movimiento, sin tirar un solo dado.
 *
 * Todo lo que decide el cerebro rival cuelga de esta pregunta, así que la
 * respuesta NO puede ser una segunda fórmula del daño: se le piden al motor
 * los mismos cálculos de siempre con los dados fijados a mano (`damageWith`).
 * Una copia de la fórmula viviendo aquí es una copia que se queda atrás en
 * cuanto alguien toca `engine.ts`, y entonces la IA juega a otro juego.
 */
import {
  STANCE_BREAKERS,
  accuracyMult,
  damageWith,
  effStat,
} from "@/lib/battle/engine";
import { effectiveness } from "@/lib/battle/type-chart";
import type { BattleMove, Battler } from "@/types/battle";

/**
 * La variación 0.85-1.0, muestreada en cinco puntos en vez de en su media.
 *
 * Parece un detalle y no lo es. La fórmula redondea hacia abajo al final, así
 * que `floor(daño con la tirada media)` NO es la media de `floor(daño)`: se
 * queda medio punto corto siempre. Sobre un golpe de 100 PS da igual; sobre
 * uno de 9 es un 5% de error, y son justo los golpes pequeños los que deciden
 * si algo llega o no llega a tumbar al rival.
 */
const ROLLS = [0.85, 0.8875, 0.925, 0.9625, 1] as const;

/**
 * Esperanza del crítico: 1/16 de las veces multiplica por 1.5, o sea un 3.125%
 * más de media. Se aplica encima del golpe sin crítico en vez de estimar con
 * el crítico puesto, que inflaría cada movimiento.
 */
const CRIT_EXPECTATION = 1 + (1 / 16) * 0.5;

export interface Estimate {
  /** Daño medio esperado, ya con la esperanza del crítico dentro. */
  avg: number;
  /** El peor golpe (sin crítico, variación mínima). */
  min: number;
  /** El mejor (crítico y variación máxima) — el que decide si hay K.O. */
  max: number;
  /** Probabilidad de acertar, 0-1, con precisión y evasión contadas. */
  hit: number;
  /** Multiplicador de tipo contra el objetivo tal y como está ahora. */
  eff: number;
  /**
   * El movimiento no puede conectar de ninguna manera: inmunidad de tipo, o
   * un objetivo semiinvulnerable al que este movimiento no alcanza. Tirar el
   * turno aquí es el error más caro que existe, y es justo el que cometía la
   * IA anterior cada vez que alguien se enterraba.
   */
  wasted: boolean;
}

const EMPTY: Estimate = {
  avg: 0,
  min: 0,
  max: 0,
  hit: 0,
  eff: 0,
  wasted: true,
};

/**
 * Multiplicador contra un objetivo a medio movimiento de dos turnos: 1 si
 * está a la vista, el multiplicador de la tabla si el movimiento lo alcanza
 * bajo tierra o en el aire, y `null` si sencillamente no llega.
 */
export function stancePierce(move: BattleMove, defender: Battler): number | null {
  const stance = defender.charging?.stance;
  // "charging" (Rayo Solar) no da invulnerabilidad: se queda a la vista.
  if (!stance || stance === "charging") return 1;
  return STANCE_BREAKERS[stance][move.slug] ?? null;
}

/** Probabilidad de acertar, 0-1. Un movimiento sin precisión nunca falla. */
export function hitChance(
  move: BattleMove,
  attacker: Battler,
  defender: Battler,
): number {
  if (move.accuracy === null) return 1;
  const stage = Math.max(
    -6,
    Math.min(6, (attacker.stages?.acc ?? 0) - (defender.stages?.eva ?? 0)),
  );
  return Math.min(1, (move.accuracy / 100) * accuracyMult(stage));
}

/**
 * Lo que cabe esperar de un movimiento este turno. `damageTaken` alimenta a
 * los de devolución (Contraataque), igual que en el motor.
 */
export function expectedDamage(
  attacker: Battler,
  defender: Battler,
  move: BattleMove,
  damageTaken = 0,
): Estimate {
  if (move.damageClass === "status") return { ...EMPTY, eff: 1 };

  const eff = effectiveness(move.type, defender.types);
  if (eff === 0) return EMPTY;

  const pierce = stancePierce(move, defender);
  if (pierce === null) return { ...EMPTY, eff };

  const dice = (crit: boolean, roll: number) =>
    damageWith(attacker, defender, move, { crit, roll, powerRoll: 0.5 }, damageTaken)
      .damage * pierce;

  const base =
    ROLLS.reduce((sum, roll) => sum + dice(false, roll), 0) / ROLLS.length;
  return {
    avg: base * CRIT_EXPECTATION,
    min: dice(false, 0.85),
    max: dice(true, 1),
    hit: hitChance(move, attacker, defender),
    eff,
    wasted: false,
  };
}

/**
 * Probabilidad de que el golpe deje K.O. Se interpola sobre la horquilla del
 * daño en vez de comparar sólo con la media: un movimiento que tumba al rival
 * en su mejor tirada vale más que uno que nunca llega, aunque de media hagan
 * lo mismo.
 */
export function koChance(est: Estimate, hp: number): number {
  if (est.max < hp) return 0;
  if (est.min >= hp) return est.hit;
  const span = Math.max(1, est.max - est.min);
  return est.hit * Math.min(1, Math.max(0, (est.max - hp) / span));
}

/** Quién mueve antes. 0.5 en empate, que es lo que hace el motor. */
export function speedEdge(a: Battler, b: Battler): number {
  const diff = effStat(a, "spe") - effStat(b, "spe");
  return diff === 0 ? 0.5 : diff > 0 ? 1 : 0;
}
