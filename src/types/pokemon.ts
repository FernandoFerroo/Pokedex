/**
 * Domain types consumed by the app. Raw PokéAPI shapes live in
 * `lib/pokeapi/types.ts` and never leak past the data layer.
 */

export interface PokemonIndexEntry {
  /** National Pokédex id (species id — matches the default variety's id). */
  id: number;
  /** Species slug, e.g. "pikachu". Used as the detail route param. */
  name: string;
  /** Generation number, 1-based (1 = Kanto … 9 = Paldea). */
  generation: number;
  /** Type slugs ordered by slot, e.g. ["grass", "poison"]. */
  types: string[];
  /** Evolution chain id shared by every member of the same chain. */
  chainId: number;
}

export interface PokemonIndex {
  /** Every species, sorted by National Pokédex id. */
  entries: PokemonIndexEntry[];
  /** chainId -> species names of every member of that evolution chain. */
  chains: Record<number, string[]>;
}

export interface PokemonFilters {
  query: string;
  type: string | null;
  generation: number | null;
}
