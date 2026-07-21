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
  varieties: Array<{
    is_default: boolean;
    pokemon: NamedAPIResource;
  }>;
  flavor_text_entries: Array<{
    flavor_text: string;
    language: NamedAPIResource;
  }>;
  names: Array<{
    name: string;
    language: NamedAPIResource;
  }>;
}

export interface PokemonResponse {
  id: number;
  name: string;
  height: number;
  weight: number;
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
