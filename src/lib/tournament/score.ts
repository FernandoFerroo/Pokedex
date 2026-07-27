/**
 * La puntuación de los modos con reloj — Relámpago y Turbo —: lo que convierte
 * ganar una copa en una marca que batir.
 *
 * El reloj mide lo rápido que juegas; los puntos miden lo bien que lo haces, y
 * a propósito son dos números separados. Meter el tiempo dentro de la
 * puntuación la habría vuelto una función del rato que tardas en leer, y de
 * paso habría dejado una sola cosa que perseguir en vez de dos.
 */
import type { RivalTier, RoundOutcome } from "@/types/tournament";

/** Lo que vale ganar la ronda, antes de mirar cómo se ganó. */
const WIN = 1000;

/**
 * Prima por rapidez, que se agota a los cinco turnos por Pokémon del plantel:
 * quince en un 3 vs 3, treinta en un 6 vs 6. Un combate limpio se resuelve en
 * unos tres turnos por cabeza, así que esto premia ir al grano sin castigar el
 * que se complica de verdad — a partir de ahí simplemente no suma.
 *
 * La ventana se mide en plantel y no en turnos fijos porque si no el modo
 * Turbo no cobraría la prima NUNCA: sus combates arrancan ya por encima de los
 * quince turnos, y una prima que nadie puede cobrar no premia ir rápido, sólo
 * hace que sus puntuaciones parezcan peores que las del Relámpago.
 */
const PACE_BONUS = 600;
const paceDecay = (rosterSize: number) => PACE_BONUS / (5 * rosterSize);

/** Por cada Pokémon que sigue en pie al acabar. */
const PER_SURVIVOR = 150;

/** Repartido según los PS que le quedan al equipo entero. */
const HEALTH_BONUS = 300;

/** Lo que añade la talla del rival: ganar a un Campeón no vale lo mismo. */
const TIER_BONUS: Record<RivalTier, number> = {
  rookie: 0,
  veteran: 150,
  champion: 300,
};

/**
 * Puntos de una ronda. Perder no puntúa: la puntuación de la partida es la de
 * las rondas que ganaste, y esa es toda la regla.
 *
 * Fuera queda `damageByMember` a propósito. El daño total que reparte tu
 * equipo lo fija la vida del rival, que es constante en cada ronda, así que
 * sumaría casi siempre lo mismo; y premiar al que más pega penalizaría cambiar
 * de Pokémon, que es justo lo que hay que hacer cuando la tabla de tipos se
 * pone en tu contra.
 */
export function roundScore(
  outcome: RoundOutcome,
  tier: RivalTier,
  /** Pokémon que planta cada bando: fija la ventana de la prima por rapidez. */
  rosterSize: number,
): number {
  if (!outcome.won) return 0;
  const standing = outcome.playerTeam.filter((b) => b.hp > 0).length;
  const hp = outcome.playerTeam.reduce((total, b) => total + b.hp, 0);
  const maxHp = outcome.playerTeam.reduce((total, b) => total + b.maxHp, 0);
  return Math.round(
    WIN +
      Math.max(0, PACE_BONUS - outcome.turns * paceDecay(rosterSize)) +
      standing * PER_SURVIVOR +
      (maxHp > 0 ? hp / maxHp : 0) * HEALTH_BONUS +
      TIER_BONUS[tier],
  );
}

/**
 * El reloj de la partida, en el formato de un marcador: `m:ss`. Por encima de
 * la hora se rinde y enseña los minutos enteros, que a esas alturas ya no es
 * una partida Relámpago.
 */
export function formatClock(ms: number): string {
  const total = Math.max(0, Math.floor(ms / 1000));
  const minutes = Math.floor(total / 60);
  const seconds = total % 60;
  return `${minutes}:${String(seconds).padStart(2, "0")}`;
}
