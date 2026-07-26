import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { BackButton } from "@/components/pokemon/BackButton";
import {
  CardGallery,
  CardGallerySkeleton,
} from "@/components/pokemon/CardGallery";
import { CryButton } from "@/components/pokemon/CryButton";
import { DetailTabs } from "@/components/pokemon/DetailTabs";
import { EvolutionChain } from "@/components/pokemon/EvolutionChain";
import { MovesPanel, type MoveRow } from "@/components/pokemon/MovesPanel";
import { ProInsights } from "@/components/pokemon/ProInsights";
import { ScrollToTop } from "@/components/pokemon/ScrollToTop";
import { SpriteViewer } from "@/components/pokemon/SpriteViewer";
import { StatsDashboard } from "@/components/pokemon/StatsDashboard";
import { TypeMatchups } from "@/components/pokemon/TypeMatchups";
import { CurrentPokemonTracker } from "@/components/team/TeamProvider";
import { TypeBadge } from "@/components/ui/TypeBadge";
import { LOCALE } from "@/lib/i18n/config";
import { getDict } from "@/lib/i18n";
import { getLang } from "@/lib/i18n/server";
import { getDefensiveMatchups } from "@/lib/matchups";
import { ogDefaults } from "@/lib/site";
import {
  idFromUrl,
  mapWithConcurrency,
  PokeApiError,
  pokeFetch,
} from "@/lib/pokeapi/client";
import type {
  AbilityResponse,
  ChainLink,
  EvolutionChainResponse,
  ItemResponse,
  MoveResponse,
  PokemonResponse,
  PokemonSpeciesResponse,
  VersionGroupResponse,
} from "@/lib/pokeapi/types";
import Image from "next/image";
import type { CSSProperties, ReactNode } from "react";
import {
  artworkUrl,
  CATEGORY_LABELS,
  COLOR_LABELS,
  COLOR_SWATCH_HEX,
  EGG_GROUP_LABELS,
  formatDexNumber,
  formatName,
  generationFromName,
  generationLabel,
  growthLabel,
  HABITAT_LABELS,
  SHAPE_LABELS,
  typeAura,
  versionLabel,
} from "@/lib/pokemon-meta";

export const revalidate = 86400;

interface PageProps {
  params: Promise<{ name: string }>;
}

async function getSpecies(name: string): Promise<PokemonSpeciesResponse> {
  try {
    return await pokeFetch<PokemonSpeciesResponse>(`/pokemon-species/${name}`);
  } catch (error) {
    if (error instanceof PokeApiError && error.status === 404) {
      notFound();
    }
    throw error;
  }
}

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { name } = await params;
  const slug = decodeURIComponent(name).toLowerCase();
  const displayName = formatName(slug);
  const lang = await getLang();
  const d = getDict(lang).detail;
  const description = d.metaDescription(displayName);
  const url = `/pokemon/${encodeURIComponent(slug)}`;
  return {
    title: displayName,
    description,
    alternates: { canonical: url },
    // og:image comes from `opengraph-image.tsx` in this folder.
    openGraph: {
      ...ogDefaults(lang),
      title: displayName,
      description,
      url,
    },
  };
}

export default async function PokemonDetailPage({ params }: PageProps) {
  const { name } = await params;
  const lang = await getLang();
  const d = getDict(lang).detail;
  /** PokéAPI fallback when an entry is missing in the UI language. */
  const fallbackLang = lang === "en" ? "es" : "en";
  const species = await getSpecies(decodeURIComponent(name).toLowerCase());

  const variety =
    species.varieties.find((v) => v.is_default) ?? species.varieties[0];
  const [pokemon, chain] = await Promise.all([
    pokeFetch<PokemonResponse>(`/pokemon/${variety.pokemon.name}`),
    pokeFetch<EvolutionChainResponse>(
      `/evolution-chain/${idFromUrl(species.evolution_chain.url)}`,
    ),
  ]);

  // Species of this evolutionary line, to tell signature abilities apart:
  // holders are varieties ("zacian-crowned"), so we match by species prefix.
  const lineSpecies: string[] = [];
  (function walk(link: ChainLink) {
    lineSpecies.push(link.species.name);
    link.evolves_to.forEach(walk);
  })(chain.chain);
  const belongsToLine = (holder: string) =>
    lineSpecies.some((s) => holder === s || holder.startsWith(`${s}-`));

  /**
   * Full learnset in the species' most recent game: rank the version groups
   * present in the move data by their chronological `order` (ids are not
   * chronological — the Japanese Gen I groups have the highest ids), keep
   * only the newest one's entries and resolve each move's localized sheet.
   * The /version-group and /move fetches are shared across all species and
   * cached for a day, so the cost amortizes quickly.
   */
  async function buildMovesData(): Promise<{
    games: string;
    groups: {
      levelUp: MoveRow[];
      machine: MoveRow[];
      egg: MoveRow[];
      tutor: MoveRow[];
    };
  } | null> {
    const vgIds = [
      ...new Set(
        pokemon.moves.flatMap((m) =>
          m.version_group_details.map((d) => idFromUrl(d.version_group.url)),
        ),
      ),
    ];
    if (vgIds.length === 0) return null;
    const versionGroups = await mapWithConcurrency(vgIds, 10, (id) =>
      pokeFetch<VersionGroupResponse>(`/version-group/${id}`),
    );

    const entriesOf = (vgId: number) =>
      pokemon.moves.flatMap(({ move, version_group_details }) =>
        version_group_details
          .filter((d) => idFromUrl(d.version_group.url) === vgId)
          .map((d) => ({
            slug: move.name,
            method: d.move_learn_method.name,
            level: d.level_learned_at,
          })),
      );

    // Newest game first, but skip groups whose data the tabs can't show:
    // Pokémon Champions only has "train" entries, so a mon that is in
    // Champions would otherwise render an empty panel (Charizard) while its
    // pre-evolutions kept a full Scarlet/Violet learnset (Charmander).
    const ranked = [...versionGroups].sort((a, b) => b.order - a.order);
    const versionGroup =
      ranked.find((g) =>
        entriesOf(g.id).some((m) => m.method === "level-up"),
      ) ??
      ranked.find((g) =>
        entriesOf(g.id).some((m) =>
          ["machine", "egg", "tutor"].includes(m.method),
        ),
      );
    if (!versionGroup) return null;

    // Dedupe: each move lives in a single tab. A move you learn by level
    // shouldn't reappear under MT/MO or Tutor (SV lists Lanzallamas both
    // ways), and machine beats tutor beats egg for the leftovers. Level-up
    // keeps one row per (move, level) — multi-level repeats are real data.
    const methodRank: Record<string, number> = {
      "level-up": 0,
      machine: 1,
      tutor: 2,
      egg: 3,
    };
    const allEntries = entriesOf(versionGroup.id).sort(
      (a, b) => (methodRank[a.method] ?? 9) - (methodRank[b.method] ?? 9),
    );
    const levelUpSlugs = new Set(
      allEntries.filter((m) => m.method === "level-up").map((m) => m.slug),
    );
    const seenRows = new Set<string>();
    const learnset = allEntries.filter((m) => {
      if (m.method === "level-up") {
        const key = `${m.slug}@${m.level}`;
        if (seenRows.has(key)) return false;
        seenRows.add(key);
        return true;
      }
      if (levelUpSlugs.has(m.slug) || seenRows.has(m.slug)) return false;
      seenRows.add(m.slug);
      return true;
    });
    const uniqueSlugs = [...new Set(learnset.map((m) => m.slug))];

    const details = await mapWithConcurrency(uniqueSlugs, 20, (slug) =>
      pokeFetch<MoveResponse>(`/move/${slug}`),
    );
    const detailBySlug = new Map(details.map((d) => [d.name, d]));

    const toRow = (m: (typeof learnset)[number]): MoveRow => {
      const detail = detailBySlug.get(m.slug);
      return {
        slug: m.slug,
        label:
          detail?.names.find((n) => n.language.name === lang)?.name ??
          formatName(m.slug),
        type: detail?.type.name ?? "normal",
        damageClass: detail?.damage_class?.name ?? null,
        power: detail?.power ?? null,
        accuracy: detail?.accuracy ?? null,
        pp: detail?.pp ?? null,
        level: m.level,
      };
    };
    const byLabel = (a: MoveRow, b: MoveRow) =>
      a.label.localeCompare(b.label, LOCALE[lang]);
    const ofMethod = (method: string) =>
      learnset.filter((m) => m.method === method).map(toRow);

    return {
      games: versionGroup.versions
        .map((v) => versionLabel(v.name, lang))
        .join(" / "),
      groups: {
        levelUp: ofMethod("level-up").sort(
          (a, b) => (a.level ?? 0) - (b.level ?? 0) || byLabel(a, b),
        ),
        machine: ofMethod("machine").sort(byLabel),
        egg: ofMethod("egg").sort(byLabel),
        tutor: ofMethod("tutor").sort(byLabel),
      },
    };
  }

  // The API only lists the current generation's abilities and moves older
  // ones to `past_abilities` (Gengar's Levitate lives there). Merge both so
  // the sheet is complete, remembering until which generation each retired
  // ability applied (deduped to the most recent generation that had it).
  const untilGenByName = new Map<string, number>();
  for (const { generation, abilities: past } of pokemon.past_abilities ?? []) {
    const untilGen = generationFromName(generation.name);
    for (const { ability } of past) {
      if (!ability) continue;
      const prev = untilGenByName.get(ability.name) ?? 0;
      untilGenByName.set(ability.name, Math.max(prev, untilGen));
    }
  }
  const abilityEntries = [
    ...pokemon.abilities.map(({ ability, is_hidden }) => ({
      ability,
      is_hidden,
      untilGen: null as number | null,
    })),
    ...(pokemon.past_abilities ?? [])
      .flatMap(({ abilities: past }) => past)
      .filter(
        ({ ability }, index, all) =>
          ability !== null &&
          !pokemon.abilities.some((a) => a.ability.name === ability.name) &&
          all.findIndex((p) => p.ability?.name === ability.name) === index,
      )
      .map(({ ability, is_hidden }) => ({
        ability: ability!,
        is_hidden,
        untilGen: untilGenByName.get(ability!.name) ?? null,
      })),
  ];

  // Combat matchups (1-2 cached /type fetches), localized ability sheets
  // (≤4 cached /ability fetches), held-item names and the full learnset
  // resolve in parallel once the pokemon is known.
  const [matchups, abilities, heldItems, movesData] = await Promise.all([
    getDefensiveMatchups(pokemon.types.map(({ type }) => type.name)),
    Promise.all(
      abilityEntries.map(async ({ ability, is_hidden, untilGen }) => {
        const detail = await pokeFetch<AbilityResponse>(
          `/ability/${ability.name}`,
        );
        const holders = detail.pokemon.map((p) => p.pokemon.name);
        return {
          isHidden: is_hidden,
          untilGen,
          holdersCount: holders.length,
          isLineExclusive:
            holders.length > 0 && holders.every(belongsToLine),
          label:
            detail.names.find((n) => n.language.name === lang)?.name ??
            formatName(ability.name),
          description: (
            detail.flavor_text_entries.find((f) => f.language.name === lang) ??
            detail.flavor_text_entries.find(
              (f) => f.language.name === fallbackLang,
            )
          )?.flavor_text.replace(/\s+/g, " "),
        };
      }),
    ),
    Promise.all(
      pokemon.held_items.map(async ({ item }) => {
        const detail = await pokeFetch<ItemResponse>(`/item/${item.name}`);
        return {
          name: item.name,
          label:
            detail.names.find((n) => n.language.name === lang)?.name ??
            formatName(item.name),
          sprite: detail.sprites.default,
        };
      }),
    ),
    buildMovesData(),
  ]);

  const generation = generationFromName(species.generation.name);
  const flavorEntry =
    species.flavor_text_entries.find((f) => f.language.name === lang) ??
    species.flavor_text_entries.find(
      (f) => f.language.name === fallbackLang,
    );
  const flavorText = flavorEntry?.flavor_text.replace(/\s+/g, " ");
  const flavorVersion = flavorEntry
    ? versionLabel(flavorEntry.version.name, lang)
    : null;
  const genus =
    species.genera.find((g) => g.language.name === lang)?.genus ??
    species.genera.find((g) => g.language.name === fallbackLang)?.genus;
  const category = species.is_mythical
    ? "mythical"
    : species.is_legendary
      ? "legendary"
      : species.is_baby
        ? "baby"
        : "normal";
  /** Female share in %, or null for genderless species. */
  const femalePct =
    species.gender_rate >= 0 ? (species.gender_rate / 8) * 100 : null;
  /** Qualitative read of capture_rate so the number means something at a glance. */
  const captureEase =
    species.capture_rate >= 200
      ? d.captureVeryEasy
      : species.capture_rate >= 120
        ? d.captureEasy
        : species.capture_rate >= 45
          ? d.captureMedium
          : species.capture_rate >= 10
            ? d.captureHard
            : d.captureVeryHard;
  const crySrc = pokemon.cries?.latest ?? pokemon.cries?.legacy ?? null;
  const englishName =
    species.names.find((n) => n.language.name === "en")?.name ??
    formatName(species.name);
  const sprites = pokemon.sprites;
  const spriteSet = {
    artwork: {
      normal:
        sprites.other?.["official-artwork"]?.front_default ??
        artworkUrl(pokemon.id),
      shiny: sprites.other?.["official-artwork"]?.front_shiny ?? null,
    },
    home: {
      normal: sprites.other?.home?.front_default ?? null,
      shiny: sprites.other?.home?.front_shiny ?? null,
    },
    pixel: {
      front: sprites.front_default,
      back: sprites.back_default,
      frontShiny: sprites.front_shiny,
      backShiny: sprites.back_shiny,
    },
    anim: {
      front: sprites.other?.showdown?.front_default ?? null,
      back: sprites.other?.showdown?.back_default ?? null,
      frontShiny: sprites.other?.showdown?.front_shiny ?? null,
      backShiny: sprites.other?.showdown?.back_shiny ?? null,
    },
  };

  /** Framed HUD panel: cyberpunk header + aura-tinted glass body. */
  function Panel({
    title,
    label,
    children,
  }: {
    title: string;
    label?: string;
    children: ReactNode;
  }) {
    return (
      <section
        aria-label={label ?? title}
        className="glass-aura hud-panel rounded-2xl p-5"
      >
        <h2 className="mb-4 font-display text-sm font-bold tracking-[0.25em] text-slate-300 uppercase">
          <span aria-hidden className="neon-aura mr-2">
            ▰
          </span>
          {title}
        </h2>
        {children}
      </section>
    );
  }

  return (
    <main
      id="main-content"
      tabIndex={-1}
      style={
        {
          "--aura": typeAura(pokemon.types[0]?.type.name),
        } as CSSProperties
      }
      className="relative mx-auto w-full max-w-5xl flex-1 px-4 py-6"
    >
      {/* Aura global: el tipo dominante baña el fondo de toda la ficha. */}
      <div
        aria-hidden
        className="detail-ambient pointer-events-none absolute inset-x-0 top-0 -z-10 h-[520px]"
      />
      {/* La ficha siempre se abre por arriba, vengas del scroll que vengas. */}
      <ScrollToTop trigger={species.name} />
      {/* Marca esta especie como la "seleccionada" para el cajón del equipo. */}
      <CurrentPokemonTracker
        member={{
          id: species.id,
          name: species.name,
          types: pokemon.types.map(({ type }) => type.name),
        }}
      />
      <BackButton lang={lang} />

      <div className="mt-4 grid gap-6 md:grid-cols-[minmax(0,340px)_1fr]">
        {/* Escaparate: cristal neón enmarcado por el aura del tipo. */}
        <div className="glass-aura relative overflow-hidden rounded-3xl p-6">
          <div
            aria-hidden
            className="hud-corners absolute inset-2 opacity-60"
          />
          {crySrc && (
            <div className="absolute top-4 right-4 z-10">
              <CryButton src={crySrc} name={formatName(species.name)} />
            </div>
          )}
          <SpriteViewer
            name={formatName(species.name)}
            dexId={pokemon.id}
            sprites={spriteSet}
          />
        </div>

        <div className="relative flex flex-col gap-4">
          <div>
            <p className="neon-aura font-pixel text-xs">
              {formatDexNumber(species.id)}
            </p>
            <div className="mt-1 flex flex-wrap items-baseline gap-x-3 gap-y-1">
              <h1 className="font-display text-4xl font-bold tracking-wide text-slate-50">
                {formatName(species.name)}
              </h1>
              <span className="rounded-full border border-slate-700/80 px-2.5 py-0.5 font-mono text-xs tracking-wider text-slate-300 uppercase">
                {generationLabel(generation)}
              </span>
            </div>
            <div className="mt-1.5 flex flex-wrap items-center gap-2">
              {genus && (
                <p className="font-mono text-sm text-slate-300">{genus}</p>
              )}
              {category !== "normal" && (
                <span className="rounded-full border border-red-500/40 bg-red-500/10 px-2 py-0.5 font-mono text-xs font-semibold tracking-widest text-red-300 uppercase">
                  {CATEGORY_LABELS[lang][category]}
                </span>
              )}
            </div>
            <div
              aria-hidden
              className="mt-2 h-px w-32 bg-gradient-to-r from-[var(--aura)] to-transparent opacity-70"
            />
            <div className="mt-3 flex flex-wrap items-center gap-1.5">
              {pokemon.types.map(({ type }) => (
                <TypeBadge key={type.name} type={type.name} size="md" />
              ))}
            </div>
          </div>

          {flavorText && (
            <div className="rounded-r-xl border-l-2 border-[var(--aura)]/60 bg-slate-400/[0.04] p-4">
              <p className="font-mono text-xs tracking-[0.2em] text-slate-500 uppercase">
                {d.dexEntry}
                {flavorVersion && (
                  <span className="text-slate-600"> · {flavorVersion}</span>
                )}
              </p>
              <p className="mt-2 font-mono text-sm leading-relaxed text-slate-300">
                {flavorText}
              </p>
            </div>
          )}

          <dl className="grid grid-cols-2 gap-2.5 text-sm sm:grid-cols-3">
            {[
              [d.height, `${pokemon.height / 10} m`],
              [d.weight, `${pokemon.weight / 10} kg`],
              [d.baseExp, `${pokemon.base_experience ?? "—"}`],
              [d.growth, growthLabel(species.growth_rate?.name, lang)],
            ].map(([label, value]) => (
              <div key={label} className="data-pill rounded-2xl px-3.5 py-2.5">
                <dt className="font-mono text-xs tracking-widest text-slate-400 uppercase">
                  {label}
                </dt>
                <dd className="neon-value mt-0.5 font-mono text-sm font-bold text-slate-100">
                  {value}
                </dd>
              </div>
            ))}
            {(
              [
                [d.capture, species.capture_rate, captureEase],
                [d.happiness, species.base_happiness, null],
              ] as const
            ).map(([label, value, note]) => (
              <div key={label} className="data-pill rounded-2xl px-3.5 py-2.5">
                <dt className="font-mono text-xs tracking-widest text-slate-400 uppercase">
                  {label}
                </dt>
                <dd className="mt-0.5">
                  <p className="neon-value font-mono text-sm font-bold text-slate-100">
                    {value ?? "—"}
                    <span className="text-slate-500">/255</span>
                    {note && (
                      <span className="ml-1.5 text-xs font-normal text-slate-300 [text-shadow:none]">
                        {note}
                      </span>
                    )}
                  </p>
                  <div className="mt-1.5 h-1 overflow-hidden rounded-full bg-slate-800">
                    <div
                      className="stat-bar h-full rounded-full motion-safe:animate-[bar-grow_600ms_ease-out]"
                      style={
                        {
                          "--bar-from":
                            "color-mix(in srgb, var(--aura) 35%, transparent)",
                          "--bar-to": "var(--aura)",
                          width: `${Math.min(100, ((value ?? 0) / 255) * 100)}%`,
                        } as CSSProperties
                      }
                    />
                  </div>
                </dd>
              </div>
            ))}
          </dl>
        </div>
      </div>

      <DetailTabs
        tabs={[
          { id: "general", icon: "📊", label: d.tabGeneral },
          { id: "competitivo", icon: "⚔️", label: d.tabCompetitive },
          { id: "crianza", icon: "🥚", label: d.tabBreeding },
        ]}
        panels={{
          general: (
            <div className="flex flex-col gap-6">
              <Panel title={d.baseStats}>
                <StatsDashboard
                  stats={pokemon.stats.map((s) => ({
                    name: s.stat.name,
                    value: s.base_stat,
                    effort: s.effort,
                  }))}
                  type={pokemon.types[0]?.type.name ?? "normal"}
                  lang={lang}
                />
              </Panel>

              <Panel title={d.combatAnalysis}>
                <TypeMatchups matchups={matchups} lang={lang} />
              </Panel>
            </div>
          ),
          competitivo: (
            <div className="flex flex-col gap-6">
              {/* Quick competitive read: the numbers a pro checks first. */}
              <ProInsights
                stats={pokemon.stats.map((s) => ({
                  name: s.stat.name,
                  value: s.base_stat,
                  effort: s.effort,
                }))}
                matchups={matchups}
                lang={lang}
              />

              <Panel title={d.abilities}>
                <ul className="grid items-start gap-3 lg:grid-cols-2">
                  {abilities.map((ability, index) => (
                    <li
                      key={ability.label}
                      className="data-pill rounded-2xl px-4 py-3.5"
                    >
                      <div className="flex flex-wrap items-baseline gap-x-2.5 gap-y-1">
                        <span
                          aria-hidden
                          className="font-pixel text-xs text-[var(--aura)]"
                        >
                          {String(index + 1).padStart(2, "0")}
                        </span>
                        <h3 className="text-base font-semibold text-slate-100">
                          {ability.label}
                        </h3>
                        {ability.isHidden && (
                          <span className="rounded-full border border-violet-400/40 bg-violet-400/10 px-2 py-0.5 font-mono text-xs font-semibold tracking-widest text-violet-300/90 uppercase">
                            {d.hiddenBadge}
                          </span>
                        )}
                        {ability.untilGen !== null && (
                          <span className="rounded-full border border-rose-400/40 bg-rose-400/10 px-2 py-0.5 font-mono text-xs font-semibold tracking-widest text-rose-300/80 uppercase">
                            {d.untilGenBadge(generationLabel(ability.untilGen))}
                          </span>
                        )}
                        {ability.holdersCount === 1 ? (
                          <span className="rounded-full border border-amber-400/40 bg-amber-400/10 px-2 py-0.5 font-mono text-xs font-semibold tracking-widest text-amber-300/90 uppercase">
                            {d.uniqueBadge}
                          </span>
                        ) : (
                          ability.isLineExclusive && (
                            <span className="rounded-full border border-cyan-400/40 bg-cyan-400/10 px-2 py-0.5 font-mono text-xs font-semibold tracking-widest text-cyan-300/90 uppercase">
                              {d.lineExclusiveBadge}
                            </span>
                          )
                        )}
                        <span className="ml-auto font-mono text-xs text-slate-500">
                          {ability.holdersCount}{" "}
                          {d.holdersLabel(ability.holdersCount)}
                        </span>
                      </div>
                      {ability.description && (
                        <p className="mt-2 border-l-2 border-[var(--aura)]/40 pl-3 text-sm leading-relaxed text-slate-300">
                          {ability.description}
                        </p>
                      )}
                    </li>
                  ))}
                </ul>
              </Panel>

              {movesData && (
                <Panel title={d.moves}>
                  <MovesPanel
                    games={movesData.games}
                    groups={movesData.groups}
                  />
                </Panel>
              )}
            </div>
          ),
          crianza: (
            <div className="flex flex-col gap-6">
              <Panel title={d.breedingProfile}>
                <dl className="flex flex-col divide-y divide-slate-800/60 text-sm">
            <div className="py-3.5 first:pt-0 last:pb-0">
              <dt className="font-mono text-xs tracking-widest text-slate-400 uppercase">
                {d.gender}
              </dt>
              <dd className="mt-2">
                {femalePct === null ? (
                  <span className="font-mono text-sm text-slate-300">
                    {d.genderless}
                  </span>
                ) : (
                  <div className="flex items-center gap-2.5 font-mono text-xs">
                    <span className="shrink-0 text-sky-300">
                      ♂ {100 - femalePct}%
                    </span>
                    <div className="flex h-2 flex-1 overflow-hidden rounded-full bg-slate-800">
                      <span
                        style={{ width: `${100 - femalePct}%` }}
                        className="bg-sky-400/80"
                      />
                      <span
                        style={{ width: `${femalePct}%` }}
                        className="bg-pink-400/80"
                      />
                    </div>
                    <span className="shrink-0 text-pink-300">
                      ♀ {femalePct}%
                    </span>
                  </div>
                )}
              </dd>
            </div>

            <div className="py-3.5 first:pt-0 last:pb-0">
              <dt className="font-mono text-xs tracking-widest text-slate-400 uppercase">
                {d.eggGroups}
              </dt>
              <dd className="mt-1 font-mono text-sm font-semibold tracking-wide text-slate-200 uppercase">
                {species.egg_groups.length === 0
                  ? "—"
                  : species.egg_groups.map((group, index) => (
                      <span key={group.name}>
                        {index > 0 && (
                          <span
                            aria-hidden
                            className="mx-2 text-xs text-slate-600"
                          >
                            ◆
                          </span>
                        )}
                        {EGG_GROUP_LABELS[lang][group.name] ??
                          formatName(group.name)}
                      </span>
                    ))}
              </dd>
            </div>

            {species.hatch_counter !== null && (
              <div className="py-3.5 first:pt-0 last:pb-0">
                <dt className="font-mono text-xs tracking-widest text-slate-400 uppercase">
                  {d.eggCycles}
                </dt>
                <dd className="mt-1 font-mono text-sm text-slate-400">
                  <span className="font-semibold text-slate-200">
                    {d.cyclesCount(species.hatch_counter)}
                  </span>{" "}
                  {d.stepsApprox(
                    ((species.hatch_counter + 1) * 255).toLocaleString(
                      LOCALE[lang],
                    ),
                  )}
                </dd>
              </div>
            )}

            {heldItems.length > 0 && (
              <div className="py-3.5 first:pt-0 last:pb-0">
                <dt className="font-mono text-xs tracking-widest text-slate-400 uppercase">
                  {d.wildItems}
                </dt>
                <dd className="mt-1.5 flex flex-wrap gap-x-4 gap-y-1.5">
                  {heldItems.map((item) => (
                    <span
                      key={item.name}
                      className="flex items-center gap-1.5 font-mono text-sm text-slate-200"
                    >
                      {item.sprite && (
                        <Image
                          src={item.sprite}
                          alt=""
                          width={28}
                          height={28}
                          className="size-7 drop-shadow-[0_0_6px_rgba(148,163,184,0.45)]"
                        />
                      )}
                      {item.label}
                    </span>
                  ))}
                </dd>
              </div>
            )}

            <div className="grid grid-cols-2 gap-x-4 gap-y-3 py-3.5 first:pt-0 last:pb-0">
              {(
                [
                  [
                    d.habitat,
                    species.habitat
                      ? (HABITAT_LABELS[lang][species.habitat.name] ??
                        formatName(species.habitat.name))
                      : d.unknownHabitat,
                  ],
                  [
                    d.bodyShape,
                    species.shape
                      ? (SHAPE_LABELS[lang][species.shape.name] ??
                        formatName(species.shape.name))
                      : "—",
                  ],
                ] as const
              ).map(([label, value]) => (
                <div key={label}>
                  <dt className="font-mono text-xs tracking-widest text-slate-400 uppercase">
                    {label}
                  </dt>
                  <dd className="mt-1 font-mono text-sm font-semibold text-slate-200">
                    {value}
                  </dd>
                </div>
              ))}
              <div>
                <dt className="font-mono text-xs tracking-widest text-slate-400 uppercase">
                  {d.color}
                </dt>
                <dd className="mt-1 flex items-center gap-1.5 font-mono text-sm font-semibold text-slate-200">
                  {species.color && (
                    <span
                      aria-hidden
                      style={{
                        backgroundColor:
                          COLOR_SWATCH_HEX[species.color.name] ?? "#94a3b8",
                      }}
                      className="size-3 shrink-0 rounded-full ring-1 ring-white/25"
                    />
                  )}
                  {species.color
                    ? (COLOR_LABELS[lang][species.color.name] ??
                      formatName(species.color.name))
                    : "—"}
                </dd>
              </div>
            </div>
                </dl>
              </Panel>

              <div className="glass-aura hud-panel rounded-2xl p-5">
                <EvolutionChain
                  chain={chain}
                  currentName={species.name}
                  lang={lang}
                />
              </div>
            </div>
          ),
        }}
      />

      <section
        aria-label={d.tcgGalleryAria}
        className="glass-aura hud-panel mt-8 rounded-2xl p-5"
      >
        <h2 className="mb-4 font-display text-sm font-bold tracking-[0.25em] text-slate-300 uppercase">
          <span aria-hidden className="neon-aura mr-2">
            ▰
          </span>
          {d.tcgCards}
        </h2>
        <Suspense fallback={<CardGallerySkeleton />}>
          <CardGallery name={englishName} lang={lang} />
        </Suspense>
      </section>
    </main>
  );
}
