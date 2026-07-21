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
 * Builds the compact client-side index (name + generation + types + evolution
 * chain) by aggregating PokéAPI's inverted endpoints instead of fetching each
 * of the ~1300 Pokémon individually:
 *
 *  - /generation/{id}      (~9 requests)  -> species -> generation
 *  - /type/{id}            (~20 requests) -> pokemon -> types
 *  - /evolution-chain/{id} (~550 requests, parallel) -> chain membership
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
  for (const { id, chain } of chains) {
    const members: string[] = [];
    collectChainSpecies(chain, members);
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
      })),
    )
    .sort((a, b) => a.id - b.id);

  // Some species' default variety has a different pokemon name (e.g. species
  // "deoxys" -> pokemon "deoxys-normal"), so they miss the type map above.
  // Resolve only those (~30) through their species detail.
  const missingTypes = entries.filter((entry) => entry.types.length === 0);
  await mapWithConcurrency(missingTypes, 10, async (entry) => {
    const species = await pokeFetch<PokemonSpeciesResponse>(
      `/pokemon-species/${entry.name}`,
    );
    const variety =
      species.varieties.find((v) => v.is_default) ?? species.varieties[0];
    if (variety) {
      entry.types = typesByPokemon.get(variety.pokemon.name) ?? [];
    }
  });

  return { entries, chains: chainMembers };
}

function collectChainSpecies(link: ChainLink, acc: string[]): void {
  acc.push(link.species.name);
  for (const next of link.evolves_to) {
    collectChainSpecies(next, acc);
  }
}

/** Deduplicated per request render; fetch-level caching handles cross-request reuse. */
export const getPokemonIndex = cache(buildPokemonIndex);
