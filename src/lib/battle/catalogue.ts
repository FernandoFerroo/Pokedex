/**
 * The build editor's catalogue for one species: the abilities it may enter
 * combat with and every move it can legally be taught, localized.
 *
 * It lives here rather than in the route that first needed it because two
 * surfaces must agree on it exactly: `/api/battle/build-options` fills the
 * editor's shelves with it, and `/api/battle/move-coach` uses the very same
 * list as the only vocabulary the model is allowed to answer with. If the two
 * ever drifted, the coach could propose a move the editor refuses to show.
 *
 * Every upstream read goes through pokeFetch's 24h cache, so the second caller
 * for a species pays nothing.
 */
import { fetchLearnset, isSelectableMethod } from "@/lib/battle/learnset";
import { LOCALE, type Lang } from "@/lib/i18n/config";
import { mapWithConcurrency, pokeFetch } from "@/lib/pokeapi/client";
import type {
  AbilityResponse,
  MoveResponse,
  PokemonResponse,
} from "@/lib/pokeapi/types";
import { formatName } from "@/lib/pokemon-meta";
import type { AbilityOption, MoveOption } from "@/types/team";

/**
 * Abilities of a species: current generation first (slot order), then the
 * older-generation ones (`past_abilities` — Gengar's Levitate lives there),
 * deduped and localized. Same merge the detail page's ability panel applies.
 */
export async function fetchAbilityOptions(
  pokemon: PokemonResponse,
  lang: Lang,
): Promise<AbilityOption[]> {
  const seen = new Set<string>();
  const entries = [
    ...[...pokemon.abilities].sort((a, b) => a.slot - b.slot),
    ...(pokemon.past_abilities ?? []).flatMap((p) => p.abilities),
  ]
    .filter((a): a is (typeof pokemon.abilities)[number] => a.ability !== null)
    .filter((a) => {
      if (seen.has(a.ability.name)) return false;
      seen.add(a.ability.name);
      return true;
    });

  return Promise.all(
    entries.map(async ({ ability, is_hidden }) => {
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
}

/**
 * Learnset of the newest game, like the detail page's "Movimientos" tab, but
 * keeping how (and at what level) each move is learned so a caller can tell
 * what the Pokémon already knows. Only the two shelves the editor offers
 * survive the filter — an egg or tutor move never leaves this function, so it
 * can never be picked (or proposed) either.
 */
export async function fetchMoveOptions(
  pokemon: PokemonResponse,
  lang: Lang,
): Promise<MoveOption[]> {
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

  return details
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
}
