"use client";

import { parseAsInteger, parseAsString, useQueryStates } from "nuqs";

/**
 * Filter state lives in the URL (?q=&type=&gen=), which is what preserves it
 * when navigating back from the detail view — and makes it shareable and
 * refresh-proof for free. `history: "replace"` keeps typing from polluting
 * the back stack.
 */
export function useFilters() {
  return useQueryStates(
    {
      q: parseAsString.withDefault(""),
      type: parseAsString,
      gen: parseAsInteger,
    },
    { history: "replace" },
  );
}
