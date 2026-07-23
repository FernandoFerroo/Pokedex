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
}

export interface PokemonResponse {
  id: number;
  name: string;
  height: number;
  weight: number;
  base_experience: number | null;
  abilities: Array<{
    ability: NamedAPIResource;
    is_hidden: boolean;
    slot: number;
  }>;
  cries?: {
    latest: string | null;
    legacy: string | null;
  };
  stats: Array<{
    base_stat: number;
    stat: NamedAPIResource;
  }>;
  types: Array<{
    slot: number;
    type: NamedAPIResource;
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
