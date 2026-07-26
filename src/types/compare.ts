/** Shared contracts between the Pokémon comparator UI and its API routes. */

/** One base stat of a compared species. */
export interface CompareStat {
  /** PokéAPI stat slug, e.g. "special-attack". */
  name: string;
  /** Base value, 1-255. */
  base: number;
  /** EV yield granted on defeat (0-3). */
  effort: number;
}

export interface CompareAbility {
  slug: string;
  /** Localized name, e.g. "Mar Llamas". */
  label: string;
  isHidden: boolean;
}

/** Everything the versus layout needs about one side. */
export interface ComparePokemon {
  /** National Pokédex id — drives the artwork URL. */
  id: number;
  /** Species slug, e.g. "garchomp". */
  name: string;
  /** Localized species name, e.g. "Garchomp" / "ガブリアス". */
  label: string;
  /** Type slugs ordered by slot. */
  types: string[];
  /** Decimetres, as PokéAPI reports it. */
  height: number;
  /** Hectograms, as PokéAPI reports it. */
  weight: number;
  /** Generation number, 1-based. */
  generation: number;
  abilities: CompareAbility[];
  stats: CompareStat[];
}

/** Response of `GET /api/compare?name=…`. */
export interface CompareResponse {
  pokemon: ComparePokemon;
}

/** Structured verdict returned by the AI analyst. */
export interface CompareVerdict {
  /** Developed read of the matchup, 3-5 sentences. */
  veredicto: string;
  /** 4 takeaways backing it. */
  claves: string[];
  /** What would flip the duel — absent when the model skips it. */
  riesgo?: string;
  /** Which side the model favours in a straight 1v1. */
  ganador: "a" | "b" | "empate";
}

/** Response of `POST /api/compare/verdict`. */
export interface CompareVerdictResponse {
  verdict: CompareVerdict;
}
