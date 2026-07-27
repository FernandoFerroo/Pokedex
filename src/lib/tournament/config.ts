/**
 * Rules of the tournament ladder: how many rounds each format lasts, how hard
 * the trainer of every round plays and what it brings to the field. Pure data
 * shared by the bracket API route and the client screens.
 */
import { DEFAULT_BAG, type Bag } from "@/lib/battle/items";
import {
  GYM_LEADERS,
  LANCE,
  trainerArt,
  type OfficialTrainer,
} from "@/lib/trainers/roster";
import {
  isArcadePace,
  type RivalTier,
  type TournamentDifficulty,
  type TournamentFormat,
  type TournamentPace,
} from "@/types/tournament";

/** Re-exportada donde siempre estuvo: el catálogo i18n la importa de aquí. */
export type { TrainerClassKey } from "@/lib/trainers/roster";

/**
 * Tier of a given round, escalating inside each cup and between cups. The
 * difficulty sets where the ladder starts and how high it climbs, which is
 * what makes the three cups feel different rather than merely longer:
 *
 * - easy   rookies all the way, one seasoned trainer waiting in the final;
 * - medium rookies in the first half, veterans after, a champion at the end;
 * - hard   veterans from the first bell and champions for most of the run.
 */
export function tierForRound(
  round: number,
  total: number,
  difficulty: TournamentDifficulty,
): RivalTier {
  const isFinal = round >= total;
  switch (difficulty) {
    case "easy":
      return isFinal ? "veteran" : "rookie";
    case "medium":
      if (isFinal) return "champion";
      return round <= Math.ceil(total / 2) ? "rookie" : "veteran";
    case "hard":
      return round <= 2 && !isFinal ? "veteran" : "champion";
  }
}

/**
 * A rung of the classic ladder is a full 6-on-6: each trainer fields six
 * distinct species, so a round is only won once all six are down. The tier no
 * longer changes how many they bring, only which ones and how well they are
 * played.
 *
 * A player entering with fewer than six is deliberately outnumbered — the
 * lobby says so before the draw, and the fix is to fill the team.
 */
export const RIVAL_ROSTER_SIZE = 6;

/**
 * Y una del Relámpago son tres. No es medio torneo: es el que cabe en un rato.
 *
 * Tres es el número, y no cuatro, porque los turnos son donde vive TODO el
 * tiempo de una partida — la animación y lo que el jugador tarda en decidir —,
 * y un 3 vs 3 necesita en torno al 40 % de los turnos de un 6 vs 6. Acelerar
 * las animaciones ayuda; recortar el plantel es lo que de verdad cambia la
 * duración.
 */
export const BLITZ_ROSTER_SIZE = 3;

/**
 * Pokémon que planta cada bando en una ronda de este ritmo.
 *
 * El Turbo se queda con los seis a propósito: es lo ÚNICO que lo separa del
 * Relámpago, y también todo lo que hace falta para que dure el doble. El
 * plantel es la palanca de la duración; el compás sólo la afina.
 */
export function rosterSizeFor(pace: TournamentPace): number {
  return pace === "blitz" ? BLITZ_ROSTER_SIZE : RIVAL_ROSTER_SIZE;
}

/**
 * El compás del guion de combate, como multiplicador de la velocidad normal.
 *
 * Que el clásico devuelva exactamente 1 es lo que convierte «el torneo de
 * siempre no cambia» en un hecho del compilador y no en una promesa: la arena
 * divide sus esperas por este número, y dividir por uno no es dividir.
 *
 * Relámpago y Turbo comparten el mismo doble: la promesa del Turbo es «igual
 * de rápido, con el equipo entero», así que acelerarlo más lo convertiría en
 * otra cosa en vez de en el escalón de en medio.
 */
export function speedFor(pace: TournamentPace): number {
  return isArcadePace(pace) ? 2 : 1;
}

/**
 * The rival's bag per tier. Rookies fight bare-handed, veterans carry a couple
 * of potions and the champion travels with a full competitive kit.
 *
 * En Relámpago la mochila se recorta al mismo ritmo que el plantel, y por un
 * motivo concreto: el rival gasta un TURNO ENTERO por objeto, así que un
 * Campeón con cinco objetos delante de tres Pokémon puede pasar más turnos
 * curándose que los que hacen falta para tumbarlo — justo el atasco que el
 * Relámpago viene a matar. La invariante que hay que mantener al tocar esta
 * tabla es que los objetos de un tier sean SIEMPRE menos que
 * `rosterSizeFor(pace)`.
 *
 * Y nada de Revivir: devolver un cuarto cuerpo a un 3 vs 3 alarga un combate
 * que ya estaba ganado, que es la peor manera de perder tiempo.
 */
const CLASSIC_BAG: Record<RivalTier, Bag> = {
  rookie: {},
  veteran: { potion: 2, "super-potion": 1 },
  champion: { "full-restore": 2, "hyper-potion": 2, revive: 1 },
};

const BLITZ_BAG: Record<RivalTier, Bag> = {
  rookie: {},
  veteran: { potion: 1 },
  champion: { "full-restore": 1, "hyper-potion": 1 },
};

/**
 * El Turbo pelea a seis, así que aguanta más objetos que el Relámpago; lo que
 * no aguanta es el Revivir, por el mismo motivo que allí: un cuerpo de vuelta
 * alarga un combate ya decidido, y aquí el reloj está corriendo.
 */
const TURBO_BAG: Record<RivalTier, Bag> = {
  rookie: {},
  veteran: { potion: 1, "super-potion": 1 },
  champion: { "full-restore": 1, "hyper-potion": 2 },
};

const BAGS: Record<TournamentPace, Record<RivalTier, Bag>> = {
  blitz: BLITZ_BAG,
  turbo: TURBO_BAG,
  classic: CLASSIC_BAG,
};

export function bagForTier(tier: RivalTier, pace: TournamentPace): Bag {
  return { ...(BAGS[pace][tier] ?? DEFAULT_BAG) };
}

/**
 * Round labels are derived from the distance to the final, which in a
 * knockout bracket is also the size of the field still standing: one round
 * left means four trainers (semi-final), two means eight (quarters), three
 * means sixteen, four means thirty-two.
 */
export function roundKey(
  round: number,
  total: number,
): "final" | "semi" | "quarter" | "round16" | "round32" | "plain" {
  switch (total - round) {
    case 0:
      return "final";
    case 1:
      return "semi";
    case 2:
      return "quarter";
    case 3:
      return "round16";
    case 4:
      return "round32";
    default:
      return "plain";
  }
}

/**
 * La escalera del torneo: cinco Entrenadores fijos, uno por ronda, en orden
 * creciente de veteranía — de Brock al Campeón.
 *
 * Son los de los juegos, no personajes inventados: los Líderes de Gimnasio de
 * Kanto en orden de medalla, con sus nombres y sus sprites (ver
 * `src/lib/trainers/roster.ts`). Antes el plantel se pintaba con un generador
 * de imágenes, y el resultado siempre era el mismo: figuras correctas de nadie
 * conocido. Enfrentarse a Misty en la segunda ronda dice por sí solo en qué
 * punto del circuito estás.
 *
 * Se indexan por RONDA, no por tier, así que la copa que se juegue decide
 * cuántos aparecen: la Relámpago llega hasta Lt. Surge (3 rondas), la Élite
 * hasta Sabrina (4) y sólo la Maestra, de 5 combates, se planta delante del
 * Campeón. El tier — que es quien decide equipo, mochila y cerebro — lo sigue
 * fijando `tierForRound` a partir de la dificultad, así que el mismo
 * Entrenador aprieta más en la Maestra que en la Relámpago.
 */
export interface LadderTrainer extends OfficialTrainer {
  /** Ronda que ocupa, 1-based. */
  round: number;
}

const [BROCK, MISTY, SURGE, , , SABRINA] = GYM_LEADERS;

export const LADDER: LadderTrainer[] = [
  { round: 1, ...BROCK },
  { round: 2, ...MISTY },
  { round: 3, ...SURGE },
  { round: 4, ...SABRINA },
  { round: 5, ...LANCE },
];

/** El Entrenador de una ronda; más allá de la quinta se repite el Campeón. */
export function ladderTrainer(round: number): LadderTrainer {
  return LADDER[Math.min(Math.max(round, 1), LADDER.length) - 1];
}

/** Sprite del Entrenador de una ronda. */
export function ladderArt(round: number): string {
  return trainerArt(ladderTrainer(round).slug);
}

/**
 * El neón de cada copa. Lo comparten la tarjeta del vestíbulo, el cartel de
 * Entrenadores y el botón de entrada, que es lo que hace que elegir una copa
 * tiña la pantalla entera de su color en vez de encender sólo una tarjeta.
 */
export const CUP_EDGE: Record<TournamentFormat, string> = {
  3: "#22c55e",
  4: "#fbbf24",
  5: "#a855f7",
};

/** Storage keys of the run in progress and the hall of fame. */
export const TOURNAMENT_RUN_KEY = "pokedex-tournament-run-v1";
export const TOURNAMENT_RECORD_KEY = "pokedex-tournament-record-v1";

export function isTournamentFormat(value: unknown): value is TournamentFormat {
  return value === 3 || value === 4 || value === 5;
}

export function isTournamentPace(value: unknown): value is TournamentPace {
  return value === "blitz" || value === "turbo" || value === "classic";
}
