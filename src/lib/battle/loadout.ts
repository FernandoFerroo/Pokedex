/**
 * Server-side loadout builder: hydrates a slim TeamMember into a battle-ready
 * Battler (real stats, 4 damaging moves with Spanish names, sprites and the
 * community glTF model URL). All PokéAPI traffic goes through pokeFetch, so
 * it lands in the framework fetch cache (24h) after the first battle.
 */
import {
  idFromUrl,
  mapWithConcurrency,
  PokeApiError,
  pokeFetch,
} from "@/lib/pokeapi/client";
import type {
  MoveResponse,
  PokemonResponse,
  PokemonSpeciesResponse,
} from "@/lib/pokeapi/types";
import { formatName } from "@/lib/pokemon-meta";
import type { BattleMove, Battler } from "@/types/battle";
import { computeStats } from "./engine";

/** Same community model CDN the detail page's 3D tab streams from. */
const MODEL_BASE =
  "https://cdn.jsdelivr.net/gh/Sudhanshu-Ambastha/Pokemon-3D-api@main/models/opt";

/** Level-up candidates fetched per Pokémon (each is one /move request). */
const MOVE_CANDIDATES = 12;

/** Last-resort move so a battler is never left without a usable attack. */
const STRUGGLE: BattleMove = {
  slug: "struggle",
  label: "Forcejeo",
  type: "normal",
  damageClass: "physical",
  power: 40,
  accuracy: null,
  pp: 99,
  maxPp: 99,
};

const STAT_KEYS: Record<string, keyof ReturnType<typeof baseStats>> = {
  hp: "hp",
  attack: "atk",
  defense: "def",
  "special-attack": "spa",
  "special-defense": "spd",
  speed: "spe",
};

function baseStats(pokemon: PokemonResponse) {
  const base = { hp: 50, atk: 50, def: 50, spa: 50, spd: 50, spe: 50 };
  for (const s of pokemon.stats) {
    const key = STAT_KEYS[s.stat.name];
    if (key) base[key] = s.base_stat;
  }
  return base;
}

/**
 * Picks up to 4 damaging moves: level-up moves of the newest version group,
 * known at the battler's level, scored by power × STAB, with a soft cap of
 * two moves per type so loadouts keep some coverage.
 */
async function pickMoves(
  pokemon: PokemonResponse,
  level: number,
  types: string[],
): Promise<BattleMove[]> {
  // Newest version group that actually carries level-up data — the very
  // newest (e.g. Legends Z-A) may only list method "train" with level 0.
  const newestLevelUpGroup = Math.max(
    0,
    ...pokemon.moves.flatMap((m) =>
      m.version_group_details
        .filter((d) => d.move_learn_method.name === "level-up")
        .map((d) => idFromUrl(d.version_group.url)),
    ),
  );
  const newestGroup = Math.max(
    0,
    ...pokemon.moves.flatMap((m) =>
      m.version_group_details.map((d) => idFromUrl(d.version_group.url)),
    ),
  );

  const levelUp =
    newestLevelUpGroup > 0
      ? pokemon.moves.flatMap(({ move, version_group_details }) =>
          version_group_details
            .filter(
              (d) =>
                idFromUrl(d.version_group.url) === newestLevelUpGroup &&
                d.move_learn_method.name === "level-up",
            )
            .map((d) => ({ slug: move.name, learnedAt: d.level_learned_at })),
        )
      : // No level-up data at all: any move of the newest game counts as known.
        pokemon.moves.flatMap(({ move, version_group_details }) =>
          version_group_details
            .filter((d) => idFromUrl(d.version_group.url) === newestGroup)
            .map(() => ({ slug: move.name, learnedAt: 0 })),
        );

  // Known at this level first (newest learned first); if that's thin, allow
  // future level-up moves too rather than sending someone out empty-handed.
  const known = levelUp
    .filter((m) => m.learnedAt <= level)
    .sort((a, b) => b.learnedAt - a.learnedAt);
  const future = levelUp
    .filter((m) => m.learnedAt > level)
    .sort((a, b) => a.learnedAt - b.learnedAt);
  const seen = new Set<string>();
  const candidates = [...known, ...future]
    .filter((m) => !seen.has(m.slug) && seen.add(m.slug))
    .slice(0, MOVE_CANDIDATES);

  const details = await mapWithConcurrency(candidates, 6, async (c) => {
    try {
      return await pokeFetch<MoveResponse>(`/move/${c.slug}`);
    } catch {
      return null; // A missing move entry just drops that candidate.
    }
  });

  const damaging = details
    .filter((d): d is MoveResponse => d !== null)
    .filter(
      (d) =>
        d.power !== null &&
        d.power > 0 &&
        (d.damage_class?.name === "physical" ||
          d.damage_class?.name === "special"),
    )
    .map((d): BattleMove => {
      const pp = d.pp ?? 10;
      return {
        slug: d.name,
        label:
          d.names.find((n) => n.language.name === "es")?.name ??
          formatName(d.name),
        type: d.type.name,
        damageClass: d.damage_class!.name as "physical" | "special",
        power: d.power!,
        accuracy: d.accuracy,
        pp,
        maxPp: pp,
      };
    })
    .sort((a, b) => {
      const score = (m: BattleMove) =>
        m.power * (types.includes(m.type) ? 1.5 : 1);
      return score(b) - score(a);
    });

  const picked: BattleMove[] = [];
  for (const capPerType of [2, 4]) {
    for (const move of damaging) {
      if (picked.length === 4) break;
      if (picked.some((p) => p.slug === move.slug)) continue;
      if (picked.filter((p) => p.type === move.type).length >= capPerType)
        continue;
      picked.push(move);
    }
  }

  return picked.length > 0 ? picked : [{ ...STRUGGLE }];
}

export interface LoadoutMember {
  id: number;
  name: string;
  types: string[];
  level: number;
}

/**
 * Species whose default variety has its own slug (mimikyu →
 * mimikyu-disguised) 404 on /pokemon/{species}; resolve via the species.
 */
async function fetchPokemon(name: string): Promise<PokemonResponse> {
  try {
    return await pokeFetch<PokemonResponse>(`/pokemon/${name}`);
  } catch (err) {
    if (!(err instanceof PokeApiError) || err.status !== 404) throw err;
    const species = await pokeFetch<PokemonSpeciesResponse>(
      `/pokemon-species/${name}`,
    );
    const variety =
      species.varieties.find((v) => v.is_default) ?? species.varieties[0];
    if (!variety) throw err;
    return pokeFetch<PokemonResponse>(`/pokemon/${variety.pokemon.name}`);
  }
}

/** Builds one battle-ready Pokémon from its slim team snapshot. */
export async function buildBattler(member: LoadoutMember): Promise<Battler> {
  const pokemon = await fetchPokemon(member.name);
  const types =
    member.types.length > 0
      ? member.types
      : pokemon.types.map((t) => t.type.name);
  const stats = computeStats(baseStats(pokemon), member.level);
  const moves = await pickMoves(pokemon, member.level, types);

  const showdown = pokemon.sprites.other?.showdown;
  const artwork =
    pokemon.sprites.other?.["official-artwork"]?.front_default ??
    pokemon.sprites.front_default ??
    "";
  const front =
    showdown?.front_default ?? pokemon.sprites.front_default ?? artwork;
  const back =
    showdown?.back_default ?? pokemon.sprites.back_default ?? front;

  return {
    id: pokemon.id,
    name: member.name,
    label: formatName(member.name),
    level: member.level,
    types,
    stats,
    maxHp: stats.hp,
    hp: stats.hp,
    moves,
    sprites: { front, back },
    modelUrl: `${MODEL_BASE}/regular/${pokemon.id}.glb`,
  };
}

/** Hydrates a whole roster, capping PokéAPI concurrency. */
export function buildTeam(members: LoadoutMember[]): Promise<Battler[]> {
  return mapWithConcurrency(members, 3, buildBattler);
}
