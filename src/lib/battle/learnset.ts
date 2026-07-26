/**
 * Level-aware learnset of one species, shared by every surface that has to
 * answer "can this Pokémon know that move right now?": the build editor's
 * catalogue (/api/battle/build-options), the battle loadout builder and the
 * AI team generator.
 *
 * PokéAPI lists a move once per version group and learn method, so a raw
 * `pokemon.moves` walk mixes decades of games. We collapse it the same way
 * the detail page's "Movimientos" tab does — newest version group that
 * actually carries usable data — and keep, per move, the cheapest way the
 * species gets it.
 */
import { idFromUrl, mapWithConcurrency, pokeFetch } from "@/lib/pokeapi/client";
import type { PokemonResponse, VersionGroupResponse } from "@/lib/pokeapi/types";

/** How a species gets a move, normalized to the four methods the UI shows. */
export type LearnMethod = "level-up" | "machine" | "egg" | "tutor";

export interface LearnableMove {
  /** PokéAPI move slug, e.g. "flamethrower". */
  slug: string;
  method: LearnMethod;
  /** Level the move is learned at; null for every non level-up method. */
  learnLevel: number | null;
}

/** Cheapest-first: a move reachable by level-up is shown as a level-up move. */
const METHOD_RANK: Record<LearnMethod, number> = {
  "level-up": 0,
  machine: 1,
  tutor: 2,
  egg: 3,
};

function toMethod(name: string): LearnMethod | null {
  if (name === "level-up") return "level-up";
  if (name === "machine") return "machine";
  if (name === "egg") return "egg";
  if (name === "tutor") return "tutor";
  return null; // "train", "form-change", "light-ball-egg"… not selectable.
}

/** All (slug, method, level) triples this species has in one version group. */
function entriesOfGroup(pokemon: PokemonResponse, groupId: number) {
  return pokemon.moves.flatMap(({ move, version_group_details }) =>
    version_group_details
      .filter((d) => idFromUrl(d.version_group.url) === groupId)
      .flatMap((d) => {
        const method = toMethod(d.move_learn_method.name);
        return method
          ? [
              {
                slug: move.name,
                method,
                learnLevel:
                  method === "level-up" ? d.level_learned_at : null,
              } satisfies LearnableMove,
            ]
          : [];
      }),
  );
}

/**
 * Picks the newest version group with usable data. Preference goes to one
 * that carries level-up entries: the very newest games (Legends Z-A) may only
 * list method "train" at level 0, which tells us nothing about levels.
 *
 * `groups` are the /version-group sheets of every group this species appears
 * in — the caller fetches them (they are tiny and cached for a day).
 */
export function pickLearnsetGroup(
  pokemon: PokemonResponse,
  groups: VersionGroupResponse[],
): number | null {
  const ranked = [...groups].sort((a, b) => b.order - a.order);
  const withLevelUp = ranked.find((g) =>
    entriesOfGroup(pokemon, g.id).some((e) => e.method === "level-up"),
  );
  if (withLevelUp) return withLevelUp.id;
  const withAnything = ranked.find(
    (g) => entriesOfGroup(pokemon, g.id).length > 0,
  );
  return withAnything?.id ?? null;
}

/** Every version-group id this species lists a move in. */
export function versionGroupIds(pokemon: PokemonResponse): number[] {
  return [
    ...new Set(
      pokemon.moves.flatMap((m) =>
        m.version_group_details.map((d) => idFromUrl(d.version_group.url)),
      ),
    ),
  ];
}

/**
 * The species' learnset in one version group, one entry per move (cheapest
 * method wins; for level-up, the lowest level wins).
 */
export function learnsetOfGroup(
  pokemon: PokemonResponse,
  groupId: number,
): LearnableMove[] {
  const best = new Map<string, LearnableMove>();
  for (const entry of entriesOfGroup(pokemon, groupId)) {
    const current = best.get(entry.slug);
    if (
      !current ||
      METHOD_RANK[entry.method] < METHOD_RANK[current.method] ||
      (entry.method === current.method &&
        entry.method === "level-up" &&
        (entry.learnLevel ?? 0) < (current.learnLevel ?? 0))
    ) {
      best.set(entry.slug, entry);
    }
  }
  return [...best.values()];
}

/**
 * The two sources a build may draw from: what the species unlocks by leveling
 * up, and the TMs/HMs it can be taught. Egg and tutor moves are legal in the
 * games but deliberately out of scope here — the team builder offers exactly
 * these two shelves, so anything else must never become selectable.
 */
export const SELECTABLE_METHODS = ["level-up", "machine"] as const;

export type SelectableMethod = (typeof SELECTABLE_METHODS)[number];

/** True for moves that come from one of the two offered shelves. */
export function isSelectableMethod(
  method: LearnMethod,
): method is SelectableMethod {
  return method === "level-up" || method === "machine";
}

/**
 * Whether a battler of `level` may already carry this move.
 *
 * Level-up moves need the level; a TM has no level requirement in the games
 * (any Pokémon can be taught one at any level), so machine moves stay
 * available throughout. Egg and tutor moves are not selectable at all.
 */
export function isKnownAt(move: LearnableMove, level: number): boolean {
  if (!isSelectableMethod(move.method)) return false;
  return move.method !== "level-up" || (move.learnLevel ?? 0) <= level;
}

/**
 * Slugs a battler of `level` may carry, for validating hand-picked builds and
 * anything the AI proposes. Re-checked server-side because a build saved in
 * the browser outlives later level edits — and because a payload can always
 * be forged.
 */
export function legalSlugsAt(
  learnset: LearnableMove[],
  level: number,
): Set<string> {
  return new Set(
    learnset.filter((m) => isKnownAt(m, level)).map((m) => m.slug),
  );
}

/**
 * Full learnset of an already-fetched species sheet. Resolves the version
 * groups it needs through pokeFetch, so everything lands in the 24h cache and
 * repeat calls (build editor, battle setup, AI generator) are free.
 */
export async function fetchLearnset(
  pokemon: PokemonResponse,
): Promise<LearnableMove[]> {
  const ids = versionGroupIds(pokemon);
  if (ids.length === 0) return [];
  const groups = await mapWithConcurrency(ids, 10, (id) =>
    pokeFetch<VersionGroupResponse>(`/version-group/${id}`),
  );
  const groupId = pickLearnsetGroup(pokemon, groups);
  return groupId === null ? [] : learnsetOfGroup(pokemon, groupId);
}
