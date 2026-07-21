import type {
  PokemonFilters,
  PokemonIndex,
  PokemonIndexEntry,
} from "@/types/pokemon";

/**
 * Real-time search + filters over the in-memory index.
 *
 * The search matches by name AND by evolution chain: every Pokémon whose name
 * matches the query pulls in its whole evolution family. Searching "pikachu"
 * therefore also returns "pichu" and "raichu", and branched chains (Eevee)
 * are handled for free because chain membership was flattened at build time.
 *
 * Semantics are an intersection: searchResults ∩ type ∩ generation.
 */
export function filterPokemon(
  index: PokemonIndex,
  filters: PokemonFilters,
): PokemonIndexEntry[] {
  const query = filters.query.trim().toLowerCase();

  let matchedBySearch: Set<string> | null = null;
  if (query) {
    matchedBySearch = new Set<string>();
    const matchedChains = new Set<number>();
    for (const entry of index.entries) {
      if (entry.name.includes(query)) {
        matchedBySearch.add(entry.name);
        matchedChains.add(entry.chainId);
      }
    }
    for (const chainId of matchedChains) {
      for (const member of index.chains[chainId] ?? []) {
        matchedBySearch.add(member);
      }
    }
  }

  return index.entries.filter(
    (entry) =>
      (matchedBySearch === null || matchedBySearch.has(entry.name)) &&
      (filters.type === null || entry.types.includes(filters.type)) &&
      (filters.generation === null || entry.generation === filters.generation),
  );
}
