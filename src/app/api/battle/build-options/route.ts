import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { fetchLearnset, isSelectableMethod } from "@/lib/battle/learnset";
import { fetchPokemon } from "@/lib/battle/loadout";
import { getDict } from "@/lib/i18n";
import { LOCALE } from "@/lib/i18n/config";
import { getLang } from "@/lib/i18n/server";
import { mapWithConcurrency, pokeFetch } from "@/lib/pokeapi/client";
import type { AbilityResponse, MoveResponse } from "@/lib/pokeapi/types";
import { formatName } from "@/lib/pokemon-meta";
import type {
  AbilityOption,
  BuildOptionsResponse,
  MoveOption,
} from "@/types/team";

/**
 * Build-editor catalogue for one species: its abilities (normal + hidden)
 * and every move it can learn in its most recent game, each tagged with how
 * it is learned (level N, MT/MO, egg, tutor) so the editor can hide what the
 * Pokémon doesn't know yet at its level. Localized to the request's UI
 * language (lang cookie). Every upstream fetch goes through pokeFetch's 24h
 * cache, so repeat opens are cheap.
 */

export async function GET(request: NextRequest) {
  const lang = await getLang();
  const t = getDict(lang).team;
  const species = request.nextUrl.searchParams.get("species") ?? "";
  if (!/^[a-z0-9-]{1,40}$/.test(species)) {
    return NextResponse.json({ error: t.apiInvalidSpecies }, { status: 400 });
  }

  try {
    const pokemon = await fetchPokemon(species);

    // Abilities: current generation first (slot order), then older-gen ones
    // (`past_abilities` — Gengar's Levitate lives there), deduped, localized.
    // Same merge the detail page's ability panel applies.
    const seenAbilities = new Set<string>();
    const abilityEntries = [
      ...[...pokemon.abilities].sort((a, b) => a.slot - b.slot),
      ...(pokemon.past_abilities ?? []).flatMap((p) => p.abilities),
    ]
      .filter(
        (a): a is (typeof pokemon.abilities)[number] => a.ability !== null,
      )
      .filter((a) => {
        if (seenAbilities.has(a.ability.name)) return false;
        seenAbilities.add(a.ability.name);
        return true;
      });
    const abilitiesPromise: Promise<AbilityOption[]> = Promise.all(
      abilityEntries.map(async ({ ability, is_hidden }) => {
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

    // Learnset of the newest game, like the detail page's "Movimientos" tab,
    // but keeping how (and at what level) each move is learned. Only the two
    // shelves the editor offers survive the filter — an egg or tutor move
    // never reaches the client, so it can never be picked either.
    const learnset = (await fetchLearnset(pokemon)).filter((move) =>
      isSelectableMethod(move.method),
    );

    const details = await mapWithConcurrency(learnset, 20, async (entry) => {
      try {
        return {
          entry,
          sheet: await pokeFetch<MoveResponse>(`/move/${entry.slug}`),
        };
      } catch {
        return null; // A missing move sheet just drops that option.
      }
    });
    const moves: MoveOption[] = details
      .filter((d): d is NonNullable<typeof d> => d !== null)
      .map(({ entry, sheet: d }): MoveOption => {
        const cls = d.damage_class?.name;
        return {
          slug: d.name,
          label:
            d.names.find((n) => n.language.name === lang)?.name ??
            formatName(d.name),
          type: d.type.name,
          damageClass:
            cls === "physical" || cls === "special" || cls === "status"
              ? cls
              : "status",
          power: d.power,
          accuracy: d.accuracy,
          pp: d.pp,
          method: entry.method,
          learnLevel: entry.learnLevel,
        };
      })
      .sort((a, b) => a.label.localeCompare(b.label, LOCALE[lang]));

    const payload: BuildOptionsResponse = {
      abilities: await abilitiesPromise,
      moves,
    };
    return NextResponse.json(payload);
  } catch (err) {
    console.error("battle/build-options failed", err);
    return NextResponse.json(
      { error: t.apiOptionsError },
      { status: 502 },
    );
  }
}
