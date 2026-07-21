import { cache } from "react";
import {
  idFromUrl,
  mapWithConcurrency,
  pokeFetch,
} from "@/lib/pokeapi/client";
import type {
  APIResourceList,
  ChainLink,
  EvolutionChainResponse,
  GenerationResponse,
  PokemonSpeciesResponse,
  TypeResponse,
} from "@/lib/pokeapi/types";
import type { PokemonIndex, PokemonIndexEntry } from "@/types/pokemon";

/**
 * Builds the compact client-side index by aggregating PokéAPI's inverted
 * endpoints plus one species sweep for the filterable attributes:
 *
 *  - /generation/{id}       (~9 requests)  -> species -> generation
 *  - /type/{id}             (~20 requests) -> pokemon -> types
 *  - /evolution-chain/{id}  (~550 requests, parallel) -> chain membership + stage
 *  - /pokemon-species/{id}  (~1025 requests, parallel) -> color, habitat,
 *    shape, egg groups, legendary/mythical/baby flags
 *
 * Every fetch goes through Next's data cache with a 24h revalidate, so this
 * cost is paid once per deployment/revalidation — never per visitor.
 */
async function buildPokemonIndex(): Promise<PokemonIndex> {
  const [generationList, typeList, chainList] = await Promise.all([
    pokeFetch<APIResourceList>("/generation?limit=100"),
    pokeFetch<APIResourceList>("/type?limit=100"),
    pokeFetch<APIResourceList>("/evolution-chain?limit=2000"),
  ]);

  const [generations, types, chains] = await Promise.all([
    mapWithConcurrency(generationList.results, 10, (g) =>
      pokeFetch<GenerationResponse>(`/generation/${idFromUrl(g.url)}`),
    ),
    mapWithConcurrency(typeList.results, 10, (t) =>
      pokeFetch<TypeResponse>(`/type/${idFromUrl(t.url)}`),
    ),
    mapWithConcurrency(chainList.results, 25, (c) =>
      pokeFetch<EvolutionChainResponse>(`/evolution-chain/${idFromUrl(c.url)}`),
    ),
  ]);

  // pokemon name (default variety) -> types ordered by slot
  const typesByPokemon = new Map<string, string[]>();
  for (const type of types) {
    for (const { slot, pokemon } of type.pokemon) {
      const current = typesByPokemon.get(pokemon.name) ?? [];
      current[slot - 1] = type.name;
      typesByPokemon.set(pokemon.name, current);
    }
  }

  // species name -> chain id, and chain id -> all member species names
  const chainBySpecies = new Map<string, number>();
  const chainMembers: Record<number, string[]> = {};
  const stageBySpecies = new Map<string, { stage: number; isFinal: boolean }>();
  for (const { id, chain } of chains) {
    const members: string[] = [];
    collectChainSpecies(chain, members, stageBySpecies, 1);
    chainMembers[id] = members;
    for (const name of members) {
      chainBySpecies.set(name, id);
    }
  }

  const entries: PokemonIndexEntry[] = generations
    .flatMap((generation) =>
      generation.pokemon_species.map((species) => ({
        id: idFromUrl(species.url),
        name: species.name,
        generation: generation.id,
        types: typesByPokemon.get(species.name) ?? [],
        // Species without a chain get a unique negative id so an empty
        // chainId never groups unrelated Pokémon together in search.
        chainId: chainBySpecies.get(species.name) ?? -idFromUrl(species.url),
        color: null as string | null,
        habitat: null as string | null,
        shape: null as string | null,
        eggGroups: [] as string[],
        category: "normal" as PokemonIndexEntry["category"],
        stage: stageBySpecies.get(species.name)?.stage ?? 1,
        isFinal: stageBySpecies.get(species.name)?.isFinal ?? true,
      })),
    )
    .sort((a, b) => a.id - b.id);

  // One species sweep fills the filterable attributes and doubles as the
  // fixup for species whose default variety has a different pokemon name
  // (e.g. species "deoxys" -> pokemon "deoxys-normal"), which the type map
  // above misses.
  await mapWithConcurrency(entries, 25, async (entry) => {
    const species = await pokeFetch<PokemonSpeciesResponse>(
      `/pokemon-species/${entry.id}`,
    );
    entry.color = species.color?.name ?? null;
    entry.habitat = species.habitat?.name ?? null;
    entry.shape = species.shape?.name ?? null;
    entry.eggGroups = species.egg_groups.map((group) => group.name);
    entry.category = species.is_mythical
      ? "mythical"
      : species.is_legendary
        ? "legendary"
        : species.is_baby
          ? "baby"
          : "normal";
    if (entry.types.length === 0) {
      const variety =
        species.varieties.find((v) => v.is_default) ?? species.varieties[0];
      if (variety) {
        entry.types = typesByPokemon.get(variety.pokemon.name) ?? [];
      }
    }
  });

  return { entries, chains: chainMembers };
}

function collectChainSpecies(
  link: ChainLink,
  acc: string[],
  stages: Map<string, { stage: number; isFinal: boolean }>,
  depth: number,
): void {
  acc.push(link.species.name);
  stages.set(link.species.name, {
    // Chains never exceed three stages; clamp defensively anyway.
    stage: Math.min(depth, 3),
    isFinal: link.evolves_to.length === 0,
  });
  for (const next of link.evolves_to) {
    collectChainSpecies(next, acc, stages, depth + 1);
  }
}

/** Deduplicated per request render; fetch-level caching handles cross-request reuse. */
export const getPokemonIndex = cache(buildPokemonIndex);
