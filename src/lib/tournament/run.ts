/**
 * Client-side state of a tournament run: the healing nurse between rounds and
 * the two things that outlive the page — the run in progress and the hall of
 * fame.
 */
import type { Battler } from "@/types/battle";
import type {
  ArcadePace,
  TournamentFormat,
  TournamentPace,
  TournamentRecord,
  TournamentTrainer,
} from "@/types/tournament";
import {
  isTournamentFormat,
  isTournamentPace,
  rosterSizeFor,
  TOURNAMENT_RECORD_KEY,
  TOURNAMENT_RUN_KEY,
} from "./config";

/** A run saved from the rest phase, resumable from the lobby. */
export interface StoredRun {
  format: TournamentFormat;
  /**
   * El ritmo con el que se sorteó. Sólo se guardan partidas Clásicas — las de
   * reloj se terminan de una sentada y no hay nada que reanudar —, pero el campo
   * viaja igualmente para que una partida guardada nunca se reanude al compás
   * equivocado ni con un plantel que no cuadre con el que tiene dibujado.
   */
  pace: TournamentPace;
  /** Whether the team is patched up between rounds. */
  heal: boolean;
  /** Next round to play, 1-based. */
  round: number;
  /** Rounds already won. */
  wins: number;
  trainers: TournamentTrainer[];
  /** The player's roster as the last battle left it. */
  playerTeam: Battler[];
  /**
   * No Pokémon has fainted in any round so far. Absent in runs saved before
   * the collection mode existed, and read as `false` — the safe direction,
   * since it gates the God Pack.
   */
  flawless?: boolean;
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

/**
 * Fábrica, no constante. El registro dejó de ser plano cuando ganó los
 * contadores por copa: una copia superficial de una constante compartiría los
 * objetos anidados entre todos los que la piden, y la primera mutación
 * envenenaría al resto.
 */
function emptyRecord(): TournamentRecord {
  return {
    titles: 0,
    bestStreak: 0,
    byCup: {},
    flawless: {},
    bestBlitzMs: 0,
    bestBlitzScore: 0,
    bestTurboMs: 0,
    bestTurboScore: 0,
  };
}

/**
 * Los dos campos del registro que le tocan a cada ritmo de recreativa.
 *
 * Existe esta tabla para que el resto del código pida «la marca de ESTE ritmo»
 * en vez de encadenar condicionales: añadir un cuarto ritmo con reloj sería
 * una fila aquí y nada más.
 */
const ARCADE_FIELDS = {
  blitz: { ms: "bestBlitzMs", score: "bestBlitzScore" },
  turbo: { ms: "bestTurboMs", score: "bestTurboScore" },
} as const satisfies Record<
  ArcadePace,
  { ms: keyof TournamentRecord; score: keyof TournamentRecord }
>;

/** La marca guardada de un ritmo. Cero en las dos cifras es «todavía ninguna». */
export function arcadeMark(
  record: TournamentRecord,
  pace: ArcadePace,
): { ms: number; score: number } {
  const fields = ARCADE_FIELDS[pace];
  return {
    ms: (record[fields.ms] as number | undefined) ?? 0,
    score: (record[fields.score] as number | undefined) ?? 0,
  };
}

/**
 * El registro con la marca de un ritmo actualizada: el tiempo se queda con el
 * MÍNIMO y la puntuación con el máximo.
 *
 * `ms` es opcional porque un tiempo significa una copa terminada: caer
 * eliminado deja puntuación y ningún tiempo. Y el cero centinela obliga al
 * `> 0` antes del mínimo — si no, el «ninguna todavía» ganaría siempre.
 */
export function withArcadeMark(
  record: TournamentRecord,
  pace: ArcadePace,
  mark: { ms?: number; score: number },
): TournamentRecord {
  const fields = ARCADE_FIELDS[pace];
  const previous = arcadeMark(record, pace);
  return {
    ...record,
    [fields.score]: Math.max(previous.score, mark.score),
    ...(mark.ms === undefined
      ? {}
      : {
          [fields.ms]:
            previous.ms > 0 ? Math.min(previous.ms, mark.ms) : mark.ms,
        }),
  };
}

/** Lee un mapa por formato tolerando registros viejos que no lo tenían. */
function readCupCounts(
  value: unknown,
): Partial<Record<TournamentFormat, number>> {
  const out: Partial<Record<TournamentFormat, number>> = {};
  if (!value || typeof value !== "object") return out;
  const raw = value as Record<string, unknown>;
  for (const format of [3, 4, 5] as const) {
    const n = Number(raw[format]);
    if (Number.isFinite(n) && n > 0) out[format] = Math.floor(n);
  }
  return out;
}

export function loadRecord(): TournamentRecord {
  if (typeof window === "undefined") return emptyRecord();
  try {
    const saved = localStorage.getItem(TOURNAMENT_RECORD_KEY);
    if (!saved) return emptyRecord();
    const parsed = JSON.parse(saved) as Partial<TournamentRecord>;
    return {
      titles: Math.max(0, Math.floor(Number(parsed.titles) || 0)),
      bestStreak: Math.max(0, Math.floor(Number(parsed.bestStreak) || 0)),
      byCup: readCupCounts(parsed.byCup),
      flawless: readCupCounts(parsed.flawless),
      // Cero es «todavía ninguna», que es justo lo que devuelve un registro
      // guardado antes de que el Relámpago existiera. Por eso comparar el
      // mejor tiempo pide un `> 0` antes del mínimo: si no, el primer cero
      // ganaría para siempre. Lo mismo vale para el Turbo, que llegó después.
      bestBlitzMs: Math.max(0, Math.floor(Number(parsed.bestBlitzMs) || 0)),
      bestBlitzScore: Math.max(
        0,
        Math.floor(Number(parsed.bestBlitzScore) || 0),
      ),
      bestTurboMs: Math.max(0, Math.floor(Number(parsed.bestTurboMs) || 0)),
      bestTurboScore: Math.max(
        0,
        Math.floor(Number(parsed.bestTurboScore) || 0),
      ),
    };
  } catch {
    return emptyRecord();
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
    // Una partida guardada antes de que existiera el ritmo se jugó en Clásico
    // — es literalmente el comportamiento con el que se guardó —, y hay que
    // devolverla en un objeto nuevo: `parsed` viene del JSON tal cual y no
    // recogería el valor por defecto.
    const pace: TournamentPace = isTournamentPace(parsed.pace)
      ? parsed.pace
      : "classic";
    // Y si el plantel dibujado no cuadra con el ritmo, la partida se descarta:
    // reanudarla dejaría al rival con seis bolas pintadas y tres peleando.
    if (parsed.trainers[0]?.species?.length !== rosterSizeFor(pace)) return null;
    return { ...parsed, pace };
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
