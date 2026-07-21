import type { PokemonIndexEntry, PokemonSort } from "@/types/pokemon";

export const SORT_OPTIONS = [
  "id-asc",
  "id-desc",
  "name-asc",
  "name-desc",
] as const;

export const SORT_LABELS_ES: Record<PokemonSort, string> = {
  "id-asc": "Número: menor a mayor",
  "id-desc": "Número: mayor a menor",
  "name-asc": "Nombre: A → Z",
  "name-desc": "Nombre: Z → A",
};

/**
 * Pure sort over filtered results. The index is already ordered by dex id,
 * so `id-asc` (the default, and generation order too) is the identity.
 */
export function sortPokemon(
  entries: PokemonIndexEntry[],
  sort: PokemonSort,
): PokemonIndexEntry[] {
  switch (sort) {
    case "id-asc":
      return entries;
    case "id-desc":
      return [...entries].reverse();
    case "name-asc":
      return [...entries].sort((a, b) => a.name.localeCompare(b.name, "es"));
    case "name-desc":
      return [...entries].sort((a, b) => b.name.localeCompare(a.name, "es"));
  }
}
