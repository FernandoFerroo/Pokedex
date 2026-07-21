"use client";

import {
  parseAsInteger,
  parseAsString,
  parseAsStringLiteral,
  useQueryStates,
} from "nuqs";
import { SORT_OPTIONS } from "@/lib/sort";

/**
 * Filter state lives in the URL (?q=&type=&gen=&sort=), which is what
 * preserves it when navigating back from the detail view — and makes it
 * shareable and refresh-proof for free. `history: "replace"` keeps typing
 * from polluting the back stack.
 */
export function useFilters() {
  return useQueryStates(
    {
      q: parseAsString.withDefault(""),
      type: parseAsString,
      gen: parseAsInteger,
      sort: parseAsStringLiteral(SORT_OPTIONS).withDefault("id-asc"),
    },
    { history: "replace" },
  );
}
