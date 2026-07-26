/**
 * Client-side state of a tournament run: the healing nurse between rounds and
 * the two things that outlive the page — the run in progress and the hall of
 * fame.
 */
import type { Battler } from "@/types/battle";
import type {
  TournamentFormat,
  TournamentRecord,
  TournamentTrainer,
} from "@/types/tournament";
import {
  isTournamentFormat,
  TOURNAMENT_RECORD_KEY,
  TOURNAMENT_RUN_KEY,
} from "./config";

/** A run saved from the rest phase, resumable from the lobby. */
export interface StoredRun {
  format: TournamentFormat;
  /** Whether the team is patched up between rounds. */
  heal: boolean;
  /** Next round to play, 1-based. */
  round: number;
  /** Rounds already won. */
  wins: number;
  trainers: TournamentTrainer[];
  /** The player's roster as the last battle left it. */
  playerTeam: Battler[];
}

/**
 * Pokémon Center between rounds: full HP and PP, no status, no stat stages
 * and nothing left half-charged.
 */
export function healTeam(team: Battler[]): Battler[] {
  return team.map((b) => ({
    ...b,
    hp: b.maxHp,
    status: null,
    sleepTurns: 0,
    confusedTurns: 0,
    charging: null,
    stages: {},
    moves: b.moves.map((m) => ({ ...m, pp: m.maxPp })),
  }));
}

/** Members still standing — the check the rest phase shows and the run needs. */
export function standing(team: Battler[]): number {
  return team.filter((b) => b.hp > 0).length;
}

const EMPTY_RECORD: TournamentRecord = { titles: 0, bestStreak: 0 };

export function loadRecord(): TournamentRecord {
  if (typeof window === "undefined") return { ...EMPTY_RECORD };
  try {
    const saved = localStorage.getItem(TOURNAMENT_RECORD_KEY);
    if (!saved) return { ...EMPTY_RECORD };
    const parsed = JSON.parse(saved) as Partial<TournamentRecord>;
    return {
      titles: Math.max(0, Math.floor(Number(parsed.titles) || 0)),
      bestStreak: Math.max(0, Math.floor(Number(parsed.bestStreak) || 0)),
    };
  } catch {
    return { ...EMPTY_RECORD };
  }
}

export function saveRecord(record: TournamentRecord) {
  try {
    localStorage.setItem(TOURNAMENT_RECORD_KEY, JSON.stringify(record));
  } catch {
    // Storage unavailable: the trophy just isn't remembered next time.
  }
}

export function loadRun(): StoredRun | null {
  if (typeof window === "undefined") return null;
  try {
    const saved = localStorage.getItem(TOURNAMENT_RUN_KEY);
    if (!saved) return null;
    const parsed = JSON.parse(saved) as StoredRun;
    // A run is only resumable while it still describes a full ladder of a
    // format that still exists — runs saved under the old 4/8-round cups are
    // dropped here rather than resumed into a bracket that can't hold them.
    if (
      !isTournamentFormat(parsed?.format) ||
      !Array.isArray(parsed?.trainers) ||
      parsed.trainers.length !== parsed.format ||
      !Array.isArray(parsed?.playerTeam) ||
      parsed.playerTeam.length === 0 ||
      typeof parsed.round !== "number" ||
      parsed.round > parsed.trainers.length
    ) {
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
}

export function saveRun(run: StoredRun) {
  try {
    localStorage.setItem(TOURNAMENT_RUN_KEY, JSON.stringify(run));
  } catch {
    // Storage full or unavailable: the run simply can't be resumed later.
  }
}

export function clearRun() {
  try {
    localStorage.removeItem(TOURNAMENT_RUN_KEY);
  } catch {
    // Nothing to do: the stale run is harmless, the lobby validates it.
  }
}
