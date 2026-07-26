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
}
