/** Shared contract between the trainer chat API route and its client panel. */

import type { PokemonCategory, PokemonSort, StageFilter } from "@/types/pokemon";
import type { TeamMember } from "@/types/team";

/** Subset of the URL filter state the trainer AI is allowed to patch. */
export interface TrainerFilterPatch {
  q?: string | null;
  type?: string | null;
  gen?: number | null;
  sort?: PokemonSort | null;
  color?: string | null;
  habitat?: string | null;
  shape?: string | null;
  egg?: string | null;
  cat?: PokemonCategory | null;
  stage?: StageFilter | null;
  /** Solo favoritos (corazón). El asistente solo lo limpia, no lo activa. */
  fav?: boolean | null;
  /** Especies excluidas, separadas por comas («…menos Pikachu»). */
  x?: string | null;
  /** Extiende `x` a toda la familia evolutiva de cada especie nombrada. */
  xfam?: boolean | null;
}

/** UI side effects the client executes after each assistant reply. */
export type TrainerAction =
  | { type: "set_filters"; patch: TrainerFilterPatch }
  | { type: "clear_filters" }
  | { type: "open_pokemon"; name: string }
  /**
   * The roster after everything the professor did to it this turn. Sent as
   * one final state (not as add/remove deltas) so the client can never drift
   * from what the model was told it had. `summary` is already localized.
   */
  | { type: "set_team"; members: TeamMember[]; summary: string }
  | { type: "open_team" }
  | { type: "start_battle" };

export interface TrainerResponse {
  message: string;
  actions: TrainerAction[];
}
