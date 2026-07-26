/**
 * Server-side loadout builder: hydrates a slim TeamMember into a battle-ready
 * Battler (real stats, 4 damaging moves named in the request's language,
 * sprites and the community glTF model URL). All PokéAPI traffic goes through
 * pokeFetch, so it lands in the framework fetch cache (24h) after the first
 * battle.
 */
import { DEFAULT_LANG, type Lang } from "@/lib/i18n/config";
import {
  idFromUrl,
  mapWithConcurrency,
  PokeApiError,
  pokeFetch,
} from "@/lib/pokeapi/client";
import type {
  AbilityResponse,
  MoveResponse,
  PokemonResponse,
  PokemonSpeciesResponse,
} from "@/lib/pokeapi/types";
import { formatName } from "@/lib/pokemon-meta";
import { fetchLearnset, legalSlugsAt } from "./learnset";
import type {
  Ailment,
  BattleMove,
  Battler,
  BattlerAbility,
  MoveEffects,
  StageStat,
} from "@/types/battle";
import type { MemberBuild } from "@/types/team";
import { computeStats, estimatePower } from "./engine";

/** Same community model CDN the detail page's 3D tab streams from. */
const MODEL_BASE =
  "https://cdn.jsdelivr.net/gh/Sudhanshu-Ambastha/Pokemon-3D-api@main/models/opt";

/** Level-up candidates fetched per Pokémon (each is one /move request). */
const MOVE_CANDIDATES = 12;

/** Struggle's display name per language (official localized move names). */
const STRUGGLE_LABEL: Record<Lang, string> = {
  es: "Forcejeo",
  en: "Struggle",
  fr: "Lutte",
  de: "Verzweifler",
  it: "Scontro",
  ja: "わるあがき",
  ko: "발버둥",
  "zh-Hans": "挣扎",
  "zh-Hant": "掙扎",
};

/** Last-resort move so a battler is never left without a usable attack. */
function struggle(lang: Lang): BattleMove {
  return {
    slug: "struggle",
    label: STRUGGLE_LABEL[lang],
    type: "normal",
    damageClass: "physical",
    power: 40,
    accuracy: null,
    pp: 99,
    maxPp: 99,
  };
}

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

/** PokéAPI ailment slug → the subset the engine simulates. */
const AILMENTS: Record<string, Ailment> = {
  paralysis: "paralysis",
  burn: "burn",
  poison: "poison",
  sleep: "sleep",
  freeze: "freeze",
  confusion: "confusion",
};

/** PokéAPI stat slug → engine stage key. */
const STAGE_KEYS: Record<string, StageStat> = {
  attack: "atk",
  defense: "def",
  "special-attack": "spa",
  "special-defense": "spd",
  speed: "spe",
  accuracy: "acc",
  evasion: "eva",
};

/** Targets that mean "the user's side" (everything else hits the foe). */
const SELF_TARGETS = new Set([
  "user",
  "users-field",
  "user-and-allies",
  "user-or-ally",
  "ally",
  "entire-field",
]);

/** Distills the /move sheet's meta into the effects the engine simulates. */
function toMoveEffects(d: MoveResponse): MoveEffects | undefined {
  const statChanges = (d.stat_changes ?? [])
    .map(({ change, stat }) => ({ stat: STAGE_KEYS[stat.name], change }))
    .filter((c): c is MoveEffects["statChanges"][number] => Boolean(c.stat));
  const ailment = d.meta?.ailment ? (AILMENTS[d.meta.ailment.name] ?? null) : null;
  const healingPct = Math.max(0, d.meta?.healing ?? 0);
  const drainPct = d.meta?.drain ?? 0;
  if (statChanges.length === 0 && !ailment && healingPct === 0 && drainPct === 0) {
    return undefined; // Nothing the engine can simulate (Protect, Reflect…).
  }
  return {
    target: SELF_TARGETS.has(d.target?.name ?? "") ? "self" : "foe",
    statChanges,
    statChance: d.meta?.stat_chance ?? 0,
    ailment,
    ailmentChance: d.meta?.ailment_chance ?? 0,
    healingPct,
    drainPct,
  };
}

/** Maps a /move sheet to a usable BattleMove (attacks and status moves).
    Variable-power attacks keep power null — the engine resolves them per turn. */
function toBattleMove(d: MoveResponse, lang: Lang): BattleMove | null {
  const cls = d.damage_class?.name;
  if (cls !== "physical" && cls !== "special" && cls !== "status") return null;
  const pp = d.pp ?? 10;
  return {
    slug: d.name,
    label:
      d.names.find((n) => n.language.name === lang)?.name ?? formatName(d.name),
    type: d.type.name,
    damageClass: cls,
    power: d.power && d.power > 0 ? d.power : null,
    accuracy: d.accuracy,
    pp,
    maxPp: pp,
    effects: toMoveEffects(d),
  };
}

/**
 * Picks up to 4 damaging default moves: level-up moves of the newest version
 * group, known at the battler's level, scored by power × STAB, with a soft
 * cap of two moves per type so loadouts keep some coverage. May return fewer
 * than 4 (even zero) — the caller falls back to Struggle.
 */
async function pickDefaultMoves(
  pokemon: PokemonResponse,
  level: number,
  types: string[],
  lang: Lang,
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

  // Only what it already knows at this level: a Lv. 5 starter goes out with
  // its two starting moves, like in the games. Future level-up moves are the
  // last resort, and only when nothing at all is known yet — otherwise a low
  // level would silently hand out its fully-evolved movepool.
  const known = levelUp
    .filter((m) => m.learnedAt <= level)
    .sort((a, b) => b.learnedAt - a.learnedAt);
  const future = levelUp
    .filter((m) => m.learnedAt > level)
    .sort((a, b) => a.learnedAt - b.learnedAt);
  const seen = new Set<string>();
  const candidates = (known.length > 0 ? known : future)
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
    .map((d) => toBattleMove(d, lang))
    // Autofill keeps its all-attacks policy; status moves are pick-only.
    .filter((m): m is BattleMove => m !== null && m.damageClass !== "status")
    .sort((a, b) => {
      const score = (m: BattleMove) =>
        estimatePower(m) * (types.includes(m.type) ? 1.5 : 1);
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

  return picked;
}

/**
 * Resolves the user's hand-picked move slugs, keeping only moves this
 * Pokémon already knows at `level` — the same legality rule the build editor
 * enforces, re-checked here because a saved build survives later level edits.
 */
async function pickChosenMoves(
  pokemon: PokemonResponse,
  slugs: string[],
  level: number,
  lang: Lang,
): Promise<BattleMove[]> {
  const learnable = legalSlugsAt(await fetchLearnset(pokemon), level);
  const wanted = [...new Set(slugs)].filter((s) => learnable.has(s)).slice(0, 4);
  const details = await mapWithConcurrency(wanted, 4, async (slug) => {
    try {
      return await pokeFetch<MoveResponse>(`/move/${slug}`);
    } catch {
      return null; // Unknown move entry just drops that pick.
    }
  });
  return details
    .filter((d): d is MoveResponse => d !== null)
    .map((d) => toBattleMove(d, lang))
    .filter((m): m is BattleMove => m !== null);
}

/**
 * Resolves the ability the battler enters combat with: the user's pick when
 * the species really has it, otherwise the primary (lowest slot, non-hidden)
 * one. Localized name via the cached /ability sheet.
 */
async function resolveAbility(
  pokemon: PokemonResponse,
  lang: Lang,
  chosen?: string,
): Promise<BattlerAbility | null> {
  const entries = [...pokemon.abilities].sort((a, b) => a.slot - b.slot);
  // Older-generation abilities (past_abilities) are pickable in the build
  // editor, so a chosen slug must match against both sets.
  const pastEntries = (pokemon.past_abilities ?? [])
    .flatMap((p) => p.abilities)
    .filter((a): a is (typeof entries)[number] => a.ability !== null);
  const entry =
    (chosen
      ? [...entries, ...pastEntries].find((a) => a.ability.name === chosen)
      : undefined) ??
    entries.find((a) => !a.is_hidden) ??
    entries[0] ??
    pastEntries[0];
  if (!entry) return null;
  const fallback: BattlerAbility = {
    slug: entry.ability.name,
    label: formatName(entry.ability.name),
    isHidden: entry.is_hidden,
  };
  try {
    const detail = await pokeFetch<AbilityResponse>(
      `/ability/${entry.ability.name}`,
    );
    return {
      ...fallback,
      label:
        detail.names.find((n) => n.language.name === lang)?.name ??
        fallback.label,
    };
  } catch {
    return fallback; // The formatted slug is better than no ability at all.
  }
}

export interface LoadoutMember {
  id: number;
  name: string;
  types: string[];
  level: number;
  /** Hand-picked build from the team builder; gaps are autofilled here. */
  build?: MemberBuild;
}

/**
 * Species whose default variety has its own slug (mimikyu →
 * mimikyu-disguised) 404 on /pokemon/{species}; resolve via the species.
 */
export async function fetchPokemon(name: string): Promise<PokemonResponse> {
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

/**
 * Species gender ratio → the battler's gender, shown in its status box.
 * `gender_rate` counts female eighths (−1 = genderless). The pick is
 * deterministic on the dex id so a Pokémon keeps its symbol across rematches
 * instead of flickering every time the arena reloads.
 */
function pickGender(rate: number, id: number): Battler["gender"] {
  if (rate < 0) return null;
  if (rate === 0) return "male";
  if (rate === 8) return "female";
  return id % 8 < rate ? "female" : "male";
}

/** Gender ratio of the species (one cached /pokemon-species request). */
async function fetchGender(
  pokemon: PokemonResponse,
): Promise<Battler["gender"]> {
  try {
    const species = await pokeFetch<PokemonSpeciesResponse>(
      `/pokemon-species/${idFromUrl(pokemon.species.url)}`,
    );
    return pickGender(species.gender_rate, pokemon.id);
  } catch {
    return null; // No species sheet: the box simply shows no symbol.
  }
}

/** Builds one battle-ready Pokémon from its slim team snapshot. */
export async function buildBattler(
  member: LoadoutMember,
  lang: Lang = DEFAULT_LANG,
): Promise<Battler> {
  const pokemon = await fetchPokemon(member.name);
  const types =
    member.types.length > 0
      ? member.types
      : pokemon.types.map((t) => t.type.name);
  const stats = computeStats(baseStats(pokemon), member.level);

  // User picks first; short slots are topped up with the default level-up
  // loadout (no duplicates), and Struggle remains the last resort.
  const chosen = member.build?.moves?.length
    ? await pickChosenMoves(pokemon, member.build.moves, member.level, lang)
    : [];
  let moves = chosen;
  if (moves.length < 4) {
    const defaults = await pickDefaultMoves(pokemon, member.level, types, lang);
    moves = [
      ...moves,
      ...defaults.filter((d) => !moves.some((m) => m.slug === d.slug)),
    ].slice(0, 4);
  }
  if (moves.length === 0) moves = [struggle(lang)];

  const ability = await resolveAbility(pokemon, lang, member.build?.ability);

  // The arena draws the official artwork: high-resolution, cel-shaded line
  // art with a transparent background — the same illustrations the games
  // print on their own screens. The pixel sprites stay behind it as the
  // fallback for the few entries with no artwork on file.
  const showdown = pokemon.sprites.other?.showdown;
  const art =
    pokemon.sprites.other?.["official-artwork"]?.front_default ??
    pokemon.sprites.other?.home?.front_default ??
    null;
  const front =
    showdown?.front_default ?? pokemon.sprites.front_default ?? art ?? "";
  const back =
    showdown?.back_default ?? pokemon.sprites.back_default ?? front;

  const gender = await fetchGender(pokemon);

  return {
    id: pokemon.id,
    name: member.name,
    label: formatName(member.name),
    level: member.level,
    types,
    // PokéAPI weight is hectograms; the engine's weight formulas use kg.
    weight: pokemon.weight / 10,
    stats,
    maxHp: stats.hp,
    hp: stats.hp,
    ability,
    moves,
    gender,
    sprites: { front, back, art },
    // The battle plays the species' real cry; the legacy recording covers
    // the entries whose "latest" file is missing.
    cry: pokemon.cries?.latest ?? pokemon.cries?.legacy ?? null,
    modelUrl: `${MODEL_BASE}/regular/${pokemon.id}.glb`,
  };
}

/** Hydrates a whole roster, capping PokéAPI concurrency. */
export function buildTeam(
  members: LoadoutMember[],
  lang: Lang = DEFAULT_LANG,
): Promise<Battler[]> {
  return mapWithConcurrency(members, 3, (m) => buildBattler(m, lang));
}
