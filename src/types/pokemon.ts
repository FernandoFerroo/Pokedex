/**
 * Domain types consumed by the app. Raw PokéAPI shapes live in
 * `lib/pokeapi/types.ts` and never leak past the data layer.
 */

export type PokemonCategory = "normal" | "baby" | "legendary" | "mythical";

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
  /** Pokédex color slug, e.g. "red". */
  color: string | null;
  /** Habitat slug — PokéAPI only records habitats for Gen I–III species. */
  habitat: string | null;
  /** Body shape slug, e.g. "quadruped". */
  shape: string | null;
  /** Egg group slugs, e.g. ["monster", "dragon"]. */
  eggGroups: string[];
  category: PokemonCategory;
  /** Position in its evolution chain, 1-based (1 = basic form). */
  stage: number;
  /** True when nothing evolves from it (its chain ends here). */
  isFinal: boolean;
}

export interface PokemonIndex {
  /** Every species, sorted by National Pokédex id. */
  entries: PokemonIndexEntry[];
  /** chainId -> species names of every member of that evolution chain. */
  chains: Record<number, string[]>;
}

/** Evolution-stage filter: chain position, or "final" for fully evolved. */
export type StageFilter = "1" | "2" | "3" | "final";

export interface PokemonFilters {
  query: string;
  type: string | null;
  generation: number | null;
  color: string | null;
  habitat: string | null;
  shape: string | null;
  eggGroup: string | null;
  category: PokemonCategory | null;
  stage: StageFilter | null;
  /** Species slugs to leave out, e.g. ["pikachu"] for "…menos Pikachu". */
  exclude?: string[];
  /** Extends `exclude` to the whole evolution family of each named species. */
  excludeFamily?: boolean;
}

/** List ordering. `id-asc` doubles as generation order (ids are gen-grouped). */
export type PokemonSort = "id-asc" | "id-desc" | "name-asc" | "name-desc";
