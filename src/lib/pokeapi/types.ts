/** Raw PokéAPI response shapes (only the fields we consume). */

export interface NamedAPIResource {
  name: string;
  url: string;
}

export interface APIResourceList {
  count: number;
  results: NamedAPIResource[];
}

export interface GenerationResponse {
  id: number;
  name: string;
  pokemon_species: NamedAPIResource[];
}

export interface TypeResponse {
  id: number;
  name: string;
  pokemon: Array<{
    slot: number;
    pokemon: NamedAPIResource;
  }>;
  damage_relations: {
    double_damage_from: NamedAPIResource[];
    half_damage_from: NamedAPIResource[];
    no_damage_from: NamedAPIResource[];
  };
}

export interface ChainLink {
  species: NamedAPIResource;
  evolves_to: ChainLink[];
}

export interface EvolutionChainResponse {
  id: number;
  chain: ChainLink;
}

export interface PokemonSpeciesResponse {
  id: number;
  name: string;
  generation: NamedAPIResource;
  evolution_chain: { url: string };
  color: NamedAPIResource | null;
  shape: NamedAPIResource | null;
  habitat: NamedAPIResource | null;
  egg_groups: NamedAPIResource[];
  is_baby: boolean;
  is_legendary: boolean;
  is_mythical: boolean;
  /** Female eighths: -1 = genderless, 0 = male only … 8 = female only. */
  gender_rate: number;
  capture_rate: number;
  base_happiness: number | null;
  hatch_counter: number | null;
  growth_rate: NamedAPIResource | null;
  genera: Array<{
    genus: string;
    language: NamedAPIResource;
  }>;
  varieties: Array<{
    is_default: boolean;
    pokemon: NamedAPIResource;
  }>;
  flavor_text_entries: Array<{
    flavor_text: string;
    language: NamedAPIResource;
    version: NamedAPIResource;
  }>;
  names: Array<{
    name: string;
    language: NamedAPIResource;
  }>;
}

export interface AbilityResponse {
  name: string;
  names: Array<{
    name: string;
    language: NamedAPIResource;
  }>;
  flavor_text_entries: Array<{
    flavor_text: string;
    language: NamedAPIResource;
  }>;
  /** Every pokemon (variety) that can have this ability. */
  pokemon: Array<{
    is_hidden: boolean;
    pokemon: NamedAPIResource;
  }>;
}

export interface ItemResponse {
  name: string;
  names: Array<{
    name: string;
    language: NamedAPIResource;
  }>;
  sprites: {
    default: string | null;
  };
}

export interface MoveResponse {
  name: string;
  power: number | null;
  accuracy: number | null;
  pp: number | null;
  type: NamedAPIResource;
  damage_class: NamedAPIResource | null;
  /** Who the move points at ("user", "selected-pokemon"…). */
  target?: NamedAPIResource | null;
  /** Stage deltas, e.g. Swords Dance = [{ change: 2, stat: attack }]. */
  stat_changes?: Array<{
    change: number;
    stat: NamedAPIResource;
  }>;
  /** Effect metadata: ailment, chances, healing and drain percentages. */
  meta?: {
    ailment: NamedAPIResource | null;
    ailment_chance: number;
    /** % of max HP restored to the user. */
    healing: number;
    /** % of dealt damage drained (negative = recoil). */
    drain: number;
    /** % chance the stat changes apply; 0 = always. */
    stat_chance: number;
  } | null;
  names: Array<{
    name: string;
    language: NamedAPIResource;
  }>;
}

export interface VersionGroupResponse {
  id: number;
  name: string;
  /** Chronological rank across all games (ids are NOT chronological). */
  order: number;
  versions: NamedAPIResource[];
}

export interface PokemonResponse {
  id: number;
  name: string;
  height: number;
  weight: number;
  base_experience: number | null;
  /** Species this form belongs to — for alternate forms (Mega, regional) the
      species id differs from the Pokémon id, so gender/flavor lookups must
      follow this link rather than reuse `id`. */
  species: NamedAPIResource;
  abilities: Array<{
    ability: NamedAPIResource;
    is_hidden: boolean;
    slot: number;
  }>;
  /** Ability sets of older generations (`abilities` above only covers the
      current one). Each entry lists what the slots held up to and including
      that generation; `ability: null` marks a slot that was empty back then. */
  past_abilities?: Array<{
    generation: NamedAPIResource;
    abilities: Array<{
      ability: NamedAPIResource | null;
      is_hidden: boolean;
      slot: number;
    }>;
  }>;
  cries?: {
    latest: string | null;
    legacy: string | null;
  };
  stats: Array<{
    base_stat: number;
    /** EV yield granted on defeat (0-3). */
    effort: number;
    stat: NamedAPIResource;
  }>;
  held_items: Array<{
    item: NamedAPIResource;
  }>;
  types: Array<{
    slot: number;
    type: NamedAPIResource;
  }>;
  moves: Array<{
    move: NamedAPIResource;
    version_group_details: Array<{
      level_learned_at: number;
      move_learn_method: NamedAPIResource;
      version_group: NamedAPIResource;
    }>;
  }>;
  sprites: {
    front_default: string | null;
    back_default: string | null;
    front_shiny: string | null;
    back_shiny: string | null;
    other?: {
      "official-artwork"?: {
        front_default: string | null;
        front_shiny: string | null;
      };
      home?: {
        front_default: string | null;
        front_shiny: string | null;
      };
      showdown?: {
        front_default: string | null;
        back_default: string | null;
        front_shiny: string | null;
        back_shiny: string | null;
      };
    };
  };
}
