/** Shared contract between the trainer chat API route and its client panel. */

import type { PokemonCategory, PokemonSort, StageFilter } from "@/types/pokemon";

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
}

/** UI side effects the client executes after each assistant reply. */
export type TrainerAction =
  | { type: "set_filters"; patch: TrainerFilterPatch }
  | { type: "clear_filters" }
  | { type: "open_pokemon"; name: string };

export interface TrainerResponse {
  message: string;
  actions: TrainerAction[];
}
