/**
 * Rules of the tournament ladder: how many rounds each format lasts, how hard
 * the trainer of every round plays and what it brings to the field. Pure data
 * shared by the bracket API route and the client screens.
 */
import { DEFAULT_BAG, type Bag } from "@/lib/battle/items";
import type {
  RivalTier,
  TournamentDifficulty,
  TournamentFormat,
} from "@/types/tournament";

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
 * Every rung of the ladder is a full 6-on-6: each trainer fields six distinct
 * species, so a round is only won once all six are down. The tier no longer
 * changes how many they bring, only which ones and how well they are played.
 *
 * A player entering with fewer than six is deliberately outnumbered — the
 * lobby says so before the draw, and the fix is to fill the team.
 */
export const RIVAL_ROSTER_SIZE = 6;

/**
 * The rival's bag per tier. Rookies fight bare-handed, veterans carry a couple
 * of potions and the champion travels with a full competitive kit.
 */
export function bagForTier(tier: RivalTier): Bag {
  switch (tier) {
    case "rookie":
      return {};
    case "veteran":
      return { potion: 2, "super-potion": 1 };
    case "champion":
      return { "full-restore": 2, "hyper-potion": 2, revive: 1 };
    default:
      return { ...DEFAULT_BAG };
  }
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
 * Las clases de Entrenador llevan género en los idiomas que lo marcan —
 * «Chica», «Entrenadora Guay», «Acampador», «Veterano» —, así que la clave
 * elegida tiene que concordar con la cara que hay pintada. De ahí que el
 * Campeonato tenga las dos formas: la escalera la cierra Rhea, y «Campeón
 * Rhea» chirría en medio idioma del catálogo.
 */
export type TrainerClassKey =
  | "youngster"
  | "bugCatcher"
  | "lass"
  | "camper"
  | "coolTrainer"
  | "veteran"
  | "ace"
  | "blackBelt"
  | "champion"
  | "championF"
  | "eliteFour";

/**
 * La escalera del torneo: cinco Entrenadores fijos, uno por ronda, en orden
 * creciente de veteranía — del chaval con gorra al Campeón.
 *
 * Son personajes, no personas distintas cada partida. Cada uno tiene su cara
 * pintada de antemano en `public/trainers/`, y por eso su nombre y su clase
 * también son fijos: un retrato de Campeón con la etiqueta «Cazabichos» debajo
 * delata el truco al instante. Lo que sigue inventando el modelo son sus
 * frases y su descripción, que es lo que cambia de partida en partida.
 *
 * Se indexan por RONDA, no por tier, así que la copa que se juegue decide
 * cuántos aparecen: la Relámpago llega hasta Iris (3 rondas), la Élite hasta
 * Dante (4) y sólo la Maestra, de 5 combates, se encuentra con Rhea. El tier
 * — que es quien decide equipo, mochila y cerebro — lo sigue fijando
 * `tierForRound` a partir de la dificultad, así que el mismo Entrenador
 * aprieta más en la Maestra que en la Relámpago.
 *
 * El arte se genera con `scripts/generate-trainers.mjs`, que guarda ahí la
 * descripción visual de cada uno. Si cambias un `art`, regenera.
 */
export interface LadderTrainer {
  /** Ronda que ocupa, 1-based. */
  round: number;
  /** Nombre propio; igual en todos los idiomas, como el resto del plantel. */
  name: string;
  /** Clase, traducida en la UI a partir de esta clave. */
  classKey: TrainerClassKey;
  emoji: string;
  /** Slug del arte: `/trainers/<slug>-field.webp` y `-bust.webp`. */
  art: string;
}

export const LADDER: LadderTrainer[] = [
  { round: 1, name: "Leo", classKey: "youngster", emoji: "🧢", art: "leo" },
  { round: 2, name: "Kenta", classKey: "blackBelt", emoji: "🥋", art: "kenta" },
  { round: 3, name: "Iris", classKey: "coolTrainer", emoji: "😎", art: "iris" },
  { round: 4, name: "Dante", classKey: "ace", emoji: "🃏", art: "dante" },
  { round: 5, name: "Rhea", classKey: "championF", emoji: "👑", art: "rhea" },
];

/** El Entrenador de una ronda; más allá de la quinta se repite el Campeón. */
export function ladderTrainer(round: number): LadderTrainer {
  return LADDER[Math.min(Math.max(round, 1), LADDER.length) - 1];
}

/** Rutas del arte ya pintado de un Entrenador de la escalera. */
export function ladderArt(round: number): { field: string; bust: string } {
  const { art } = ladderTrainer(round);
  return {
    field: `/trainers/${art}-field.webp`,
    bust: `/trainers/${art}-bust.webp`,
  };
}

/** Storage keys of the run in progress and the hall of fame. */
export const TOURNAMENT_RUN_KEY = "pokedex-tournament-run-v1";
export const TOURNAMENT_RECORD_KEY = "pokedex-tournament-record-v1";

export function isTournamentFormat(value: unknown): value is TournamentFormat {
  return value === 3 || value === 4 || value === 5;
}
