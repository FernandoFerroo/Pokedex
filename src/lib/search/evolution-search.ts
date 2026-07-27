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
 * Semantics are an intersection: searchResults ∩ type ∩ generation, minus the
 * `exclude` list — which is what makes "todos los eléctricos menos Pikachu y
 * sus evoluciones" expressible in one query.
 */
export function filterPokemon(
  index: PokemonIndex,
  filters: PokemonFilters,
): PokemonIndexEntry[] {
  const query = filters.query.trim().toLowerCase();

  // Excluded species (and, optionally, their whole evolution family): the
  // chain lookup is the same flattened map the search uses.
  const excluded = new Set<string>();
  for (const raw of filters.exclude ?? []) {
    const name = raw.trim().toLowerCase();
    if (!name) continue;
    excluded.add(name);
    if (filters.excludeFamily) {
      const entry = index.entries.find((e) => e.name === name);
      for (const member of (entry && index.chains[entry.chainId]) ?? []) {
        excluded.add(member);
      }
    }
  }

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
      !excluded.has(entry.name) &&
      (matchedBySearch === null || matchedBySearch.has(entry.name)) &&
      (filters.type === null || entry.types.includes(filters.type)) &&
      (filters.generation === null ||
        entry.generation === filters.generation) &&
      (filters.color === null || entry.color === filters.color) &&
      (filters.habitat === null || entry.habitat === filters.habitat) &&
      (filters.shape === null || entry.shape === filters.shape) &&
      (filters.eggGroup === null ||
        entry.eggGroups.includes(filters.eggGroup)) &&
      (filters.category === null || entry.category === filters.category) &&
      matchesStage(entry, filters.stage),
  );
}

function matchesStage(
  entry: PokemonIndexEntry,
  stage: PokemonFilters["stage"],
): boolean {
  if (stage === null) return true;
  if (stage === "final") return entry.isFinal;
  return entry.stage === Number(stage);
}
