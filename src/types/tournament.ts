/** Shared contracts of the AI tournament mode (bracket API, engine and UI). */

import type { Battler } from "@/types/battle";

/**
 * How hard the trainer of a round plays. The tier drives three things at
 * once: which species it fields, what it carries in its bag and which brain
 * picks its actions (see `lib/battle/rival-ai`).
 */
export type RivalTier = "rookie" | "veteran" | "champion";

/**
 * Rounds a run lasts. A knockout bracket halves its field every round, so the
 * number of rounds IS the size of the draw: 3 rounds start at eight trainers
 * (quarters), 4 at sixteen (last 16) and 5 at thirty-two. Anything else would
 * put a number on screen that the bracket cannot actually produce.
 */
export type TournamentFormat = 3 | 4 | 5;

/** How hard the ladder plays. One difficulty per cup, so the two never drift. */
export type TournamentDifficulty = "easy" | "medium" | "hard";

/**
 * A qué ritmo se juega la copa. No es una dificultad: es cuánto dura.
 *
 * - `classic` es el torneo de siempre — 6 vs 6 y el compás de los juegos, unos
 *   veinte minutos largos por copa;
 * - `blitz` lo comprime a una sesión de recreativa: tres Pokémon por bando,
 *   las pausas de lectura a la mitad y un reloj corriendo, para que una copa
 *   entera quepa en el rato que se tarda en tomar un café;
 * - `turbo` es el escalón de en medio: el compás y el nervio del Relámpago
 *   —mismo doble de velocidad, mismo reloj, mismo marcador— pero con el equipo
 *   ENTERO de seis. Duplicar el plantel duplica los turnos, así que una copa
 *   sale por unos seis minutos: el doble que la Relámpago y un tercio de la
 *   Clásica.
 *
 * Los tres usan el mismo cuadro, los mismos Entrenadores y el mismo motor; lo
 * único que cambia es el tamaño del plantel y el compás.
 */
export type TournamentPace = "blitz" | "turbo" | "classic";

/**
 * Los ritmos de recreativa: los que llevan reloj, marcador y enfermería
 * automática. Es la lista que recorre el vestíbulo para enseñar marcas, y la
 * razón de que el modo Turbo herede el nervio del Relámpago sin copiar nada.
 */
export const ARCADE_PACES = ["blitz", "turbo"] as const satisfies ReadonlyArray<
  Exclude<TournamentPace, "classic">
>;

/** Un ritmo de los que llevan reloj: el que puede dejar marca. */
export type ArcadePace = (typeof ARCADE_PACES)[number];

/** Ritmo con reloj y marcador: todo lo que no sea la partida larga. */
export function isArcadePace(pace: TournamentPace): boolean {
  return pace !== "classic";
}

/** Se entra a Relámpago salvo que se pida lo contrario: es la puerta corta. */
export const DEFAULT_PACE: TournamentPace = "blitz";

/** Trainers in the draw of a format — 2^rounds, the bracket's own arithmetic. */
export function drawSize(format: TournamentFormat): number {
  return 2 ** format;
}

/** The three cups offered in the lobby, easiest first. */
export const CUPS: Array<{
  format: TournamentFormat;
  difficulty: TournamentDifficulty;
}> = [
  { format: 3, difficulty: "easy" },
  { format: 4, difficulty: "medium" },
  { format: 5, difficulty: "hard" },
];

export function difficultyOf(format: TournamentFormat): TournamentDifficulty {
  return CUPS.find((cup) => cup.format === format)?.difficulty ?? "medium";
}

/** Every Pokémon in the tournament fights at the flat competitive level. */
export const TOURNAMENT_LEVEL = 50;

/** The three lines a tournament trainer says during its battle. */
export interface TrainerLines {
  /** Said the moment the battle starts. */
  start: string;
  /** Said when it is down to its last Pokémon or under 25% HP. */
  pinch: string;
  /** Said when it loses. */
  defeat: string;
}

/** One species of a rival roster, already levelled for the tournament. */
export interface TournamentSpecies {
  id: number;
  /** PokéAPI slug, e.g. "pikachu". */
  name: string;
  types: string[];
  level: number;
}

/** One rung of the ladder: the trainer the player meets in that round. */
export interface TournamentTrainer {
  /** Round number, 1-based — also the slot in the bracket. */
  round: number;
  /** Proper name, e.g. "Sara". */
  name: string;
  /** Localized trainer class, e.g. "Entrenadora Guay". */
  trainerClass: string;
  /** Emoji badge standing in for the trainer sprite. */
  emoji: string;
  /** Short visual description, fed to the avatar generator. */
  style: string;
  tier: RivalTier;
  lines: TrainerLines;
  species: TournamentSpecies[];
}

export interface TournamentBracketResponse {
  format: TournamentFormat;
  trainers: TournamentTrainer[];
}

export interface TournamentRoundResponse {
  /** Only present when the request asked for the player's roster too. */
  player?: Battler[];
  rival: Battler[];
}

/** Result of one tournament battle, handed back by the arena. */
export interface RoundOutcome {
  won: boolean;
  fled: boolean;
  /** The player's roster as it ended the battle (HP, PP and status kept). */
  playerTeam: Battler[];
  /** Total damage each of the player's Pokémon dealt, by team index. */
  damageByMember: number[];
  /** Turns the battle lasted. */
  turns: number;
}

/** Persisted hall of fame, kept in localStorage between runs. */
export interface TournamentRecord {
  /** Tournaments won outright. */
  titles: number;
  /** Best round ever reached (won rounds). */
  bestStreak: number;
  /**
   * Titles per cup. Optional because records saved before the collection mode
   * existed have no idea which cup they won.
   */
  byCup?: Partial<Record<TournamentFormat, number>>;
  /** Cups lifted without a single Pokémon fainting, per format. */
  flawless?: Partial<Record<TournamentFormat, number>>;
  /**
   * La marca del modo Relámpago: la copa más rápida levantada, en milisegundos,
   * y la mejor puntuación de una partida. Cero significa «todavía ninguna», no
   * «instantánea», así que compararlas pide `> 0` antes del mínimo.
   */
  bestBlitzMs?: number;
  bestBlitzScore?: number;
  /**
   * Lo mismo para el Turbo, en campos APARTE y no en un único «mejor tiempo de
   * arcade»: seis Pokémon tardan el doble que tres, así que una marca de Turbo
   * nunca podría batir a una de Relámpago y el récord se congelaría el día que
   * se mezclaran.
   */
  bestTurboMs?: number;
  bestTurboScore?: number;
}
