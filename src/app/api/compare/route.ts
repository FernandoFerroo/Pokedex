import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { fetchPokemon } from "@/lib/battle/loadout";
import { getDict } from "@/lib/i18n";
import { getLang } from "@/lib/i18n/server";
import { pokeFetch } from "@/lib/pokeapi/client";
import type {
  AbilityResponse,
  PokemonSpeciesResponse,
} from "@/lib/pokeapi/types";
import { formatName, generationFromName } from "@/lib/pokemon-meta";
import type { CompareAbility, ComparePokemon } from "@/types/compare";

/**
 * Versus sheet for one species: types, size, generation, localized abilities
 * and the six base stats — everything the comparator needs about one corner
 * of the arena. Each side is fetched on its own so swapping one Pokémon never
 * refetches the other. Upstream calls ride pokeFetch's 24h cache, so repeat
 * comparisons are essentially free.
 */
export async function GET(request: NextRequest) {
  const lang = await getLang();
  const t = getDict(lang).compare;
  const name = request.nextUrl.searchParams.get("name") ?? "";
  if (!/^[a-z0-9-]{1,40}$/.test(name)) {
    return NextResponse.json({ error: t.apiInvalidSpecies }, { status: 400 });
  }

  try {
    const [pokemon, species] = await Promise.all([
      fetchPokemon(name),
      pokeFetch<PokemonSpeciesResponse>(`/pokemon-species/${name}`),
    ]);

    // Current-generation abilities only (slot order): the versus card lists
    // what the species can run today, hidden one included.
    const abilities: CompareAbility[] = await Promise.all(
      [...pokemon.abilities]
        .sort((a, b) => a.slot - b.slot)
        .map(async ({ ability, is_hidden }) => {
          const fallback = formatName(ability.name);
          try {
            const detail = await pokeFetch<AbilityResponse>(
              `/ability/${ability.name}`,
            );
            return {
              slug: ability.name,
              label:
                detail.names.find((n) => n.language.name === lang)?.name ??
                fallback,
              isHidden: is_hidden,
            };
          } catch {
            return { slug: ability.name, label: fallback, isHidden: is_hidden };
          }
        }),
    );

    const payload: ComparePokemon = {
      id: species.id,
      name: species.name,
      label:
        species.names.find((n) => n.language.name === lang)?.name ??
        formatName(species.name),
      types: pokemon.types.map((entry) => entry.type.name),
      height: pokemon.height,
      weight: pokemon.weight,
      generation: generationFromName(species.generation.name),
      abilities,
      stats: pokemon.stats.map((entry) => ({
        name: entry.stat.name,
        base: entry.base_stat,
        effort: entry.effort,
      })),
    };
    return NextResponse.json({ pokemon: payload });
  } catch (err) {
    console.error("compare sheet failed", err);
    return NextResponse.json({ error: t.apiSheetError }, { status: 502 });
  }
}
