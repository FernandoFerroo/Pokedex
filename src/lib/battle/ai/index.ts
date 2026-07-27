/**
 * El cerebro rival: una jugada por turno.
 *
 * Es paramétrico en el LADO a propósito. Todo lo que había antes daba por
 * hecho que quien pensaba era `state.rival`, y eso hacía imposible la única
 * prueba que de verdad demuestra algo sobre una IA: ponerla a jugar contra la
 * anterior unos cientos de combates y contar quién gana.
 */
import type { BattleAction, BattleState, Side } from "@/types/battle";
import { buildContext, itemCandidates, moveCandidates, switchCandidates } from "./actions";
import type { Candidate, Reason } from "./actions";
import { refine, select } from "./search";
import { profileFor, type AiProfile, type AiProfileKey } from "./profiles";

export type { AiProfile, AiProfileKey } from "./profiles";
export type { Reason } from "./actions";
export { PROFILES, profileFor, scaleProfile } from "./profiles";

/**
 * Lo que el Entrenador recuerda del combate. Vive fuera del cerebro porque
 * tiene que durar todo el combate: quién ha enseñado qué, y cuándo cambió por
 * última vez.
 */
export interface RivalMemory {
  /** Turno del último cambio; −1 si nunca ha cambiado. */
  lastSwitchTurn: number;
  /** Movimientos de estado ya gastados (compatibilidad con el cerebro viejo). */
  usedStatus: string[];
  /** Slugs que el jugador ha llegado a usar. Es todo lo que la IA «ha visto». */
  seenPlayerMoves: string[];
  /** Por qué eligió lo último que eligió, para la frase del Entrenador. */
  lastReason: Reason | null;
}

export function createRivalMemory(): RivalMemory {
  return {
    lastSwitchTurn: -1,
    usedStatus: [],
    seenPlayerMoves: [],
    lastReason: null,
  };
}

/** Apunta un movimiento visto del rival, sin repetirlo. */
export function rememberMove(memory: RivalMemory, slug: string): void {
  if (!memory.seenPlayerMoves.includes(slug)) memory.seenPlayerMoves.push(slug);
}

/**
 * Una jugada. `side` es quien piensa, así que el banco de pruebas puede
 * sentar a dos cerebros distintos uno enfrente del otro.
 */
export function pickAction(
  state: BattleState,
  side: Side,
  profile: AiProfile,
  memory: RivalMemory,
  rng: () => number = Math.random,
): BattleAction {
  const me = state[side].team[state[side].active];

  // A medio movimiento de dos turnos no hay nada que decidir: el motor forzaría
  // la liberación de todas formas.
  if (me?.charging) return { kind: "move", move: me.charging.move };

  const ctx = buildContext(
    state,
    side,
    profile,
    memory.seenPlayerMoves,
    memory.lastSwitchTurn,
  );

  const candidates: Candidate[] = [
    ...moveCandidates(ctx),
    ...switchCandidates(ctx),
    ...itemCandidates(ctx),
  ];
  if (candidates.length === 0) {
    return { kind: "move", move: me?.moves[0]?.slug ?? "" };
  }

  const chosen = select(refine(candidates, ctx), ctx, rng);

  if (chosen.action.kind === "switch") memory.lastSwitchTurn = state.turn;
  if (chosen.action.kind === "move" && chosen.reason === "setup") {
    memory.usedStatus.push(chosen.action.move);
  }
  memory.lastReason = chosen.reason;
  return chosen.action;
}

/** Atajo para quien sólo tiene la clave del perfil. */
export function pickActionFor(
  state: BattleState,
  side: Side,
  key: AiProfileKey,
  memory: RivalMemory,
  rng: () => number = Math.random,
): BattleAction {
  return pickAction(state, side, profileFor(key), memory, rng);
}
