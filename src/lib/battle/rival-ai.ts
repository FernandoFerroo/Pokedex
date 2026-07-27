/**
 * La cara pública del cerebro rival, con la firma de siempre.
 *
 * El cerebro vive en `./ai/`: mide el daño con la fórmula del motor en vez de
 * estimarla, cuenta los turnos que tarda cada uno en tumbar al otro, mira quién
 * pega primero y castiga las jugadas que no pueden funcionar. Este archivo
 * existe para que la arena siga llamando a lo mismo que llamaba antes.
 *
 * El tier sigue siendo el contrato de dificultad de la copa —
 * `rookie | veteran | champion` —, pero ya no ES la personalidad: eso lo pone
 * el Entrenador de la ronda a través de `profile`. Brock en la Copa Maestra
 * sigue siendo Brock; lo que cambia es cuánto acierta.
 */
import { pickAction, profileFor, scaleProfile } from "./ai";
import type { AiProfileKey } from "./ai";
import type { BattleAction, BattleState } from "@/types/battle";
import type { RivalTier } from "@/types/tournament";

export {
  createRivalMemory,
  rememberMove,
  pickAction,
  pickActionFor,
  profileFor,
  scaleProfile,
  PROFILES,
} from "./ai";
export type { RivalMemory, AiProfile, AiProfileKey, Reason } from "./ai";

/**
 * Un turno del rival de torneo. `memory` la conserva quien llama durante todo
 * el combate, que es lo que permite que el Entrenador recuerde lo que ya has
 * enseñado y no haga el yoyó con los cambios.
 */
export function pickTieredAction(
  state: BattleState,
  tier: RivalTier,
  memory: Parameters<typeof pickAction>[3],
  rng: () => number = Math.random,
  profile?: AiProfileKey,
): BattleAction {
  return pickAction(
    state,
    "rival",
    scaleProfile(profileFor(profile), tier),
    memory,
    rng,
  );
}
