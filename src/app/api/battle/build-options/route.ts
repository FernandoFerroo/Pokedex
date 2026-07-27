import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { fetchAbilityOptions, fetchMoveOptions } from "@/lib/battle/catalogue";
import { fetchPokemon } from "@/lib/battle/loadout";
import { getDict } from "@/lib/i18n";
import { getLang } from "@/lib/i18n/server";
import type { BuildOptionsResponse } from "@/types/team";

/**
 * Build-editor catalogue for one species: its abilities (normal + hidden)
 * and every move it can learn in its most recent game, each tagged with how
 * it is learned (level N, MT/MO) so the editor can hide what the Pokémon
 * doesn't know yet at its level. Localized to the request's UI language (lang
 * cookie). Every upstream fetch goes through pokeFetch's 24h cache, so repeat
 * opens are cheap.
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
    const [abilities, moves] = await Promise.all([
      fetchAbilityOptions(pokemon, lang),
      fetchMoveOptions(pokemon, lang),
    ]);
    const payload: BuildOptionsResponse = { abilities, moves };
    return NextResponse.json(payload);
  } catch (err) {
    console.error("battle/build-options failed", err);
    return NextResponse.json(
      { error: t.apiOptionsError },
      { status: 502 },
    );
  }
}
