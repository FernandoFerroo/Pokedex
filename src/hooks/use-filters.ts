"use client";

import {
  parseAsBoolean,
  parseAsInteger,
  parseAsString,
  parseAsStringLiteral,
  useQueryStates,
} from "nuqs";
import { SORT_OPTIONS } from "@/lib/sort";

const CATEGORY_OPTIONS = ["normal", "baby", "legendary", "mythical"] as const;
const STAGE_OPTIONS = ["1", "2", "3", "final"] as const;

/**
 * Filter state lives in the URL (?q=&type=&gen=&sort=&color=&habitat=&shape=
 * &egg=&cat=&stage=&x=&xfam=&page=), which is what preserves it when going back
 * from the detail view — and makes it shareable and refresh-proof for free.
 * `history: "replace"` keeps typing from polluting the back stack.
 */
export function useFilters() {
  return useQueryStates(
    {
      q: parseAsString.withDefault(""),
      type: parseAsString,
      gen: parseAsInteger,
      sort: parseAsStringLiteral(SORT_OPTIONS).withDefault("id-asc"),
      color: parseAsString,
      habitat: parseAsString,
      shape: parseAsString,
      egg: parseAsString,
      cat: parseAsStringLiteral(CATEGORY_OPTIONS),
      stage: parseAsStringLiteral(STAGE_OPTIONS),
      /** Solo especies marcadas con el corazón (se guardan en localStorage). */
      fav: parseAsBoolean,
      /** Especies excluidas, separadas por comas ("…menos Pikachu"). */
      x: parseAsString,
      /** Extiende `x` a toda la familia evolutiva de cada especie nombrada. */
      xfam: parseAsBoolean,
      page: parseAsInteger.withDefault(1),
    },
    { history: "replace" },
  );
}
