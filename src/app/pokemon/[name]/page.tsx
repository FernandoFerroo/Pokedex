import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { BackButton } from "@/components/pokemon/BackButton";
import {
  CardGallery,
  CardGallerySkeleton,
} from "@/components/pokemon/CardGallery";
import { CryButton } from "@/components/pokemon/CryButton";
import { EvolutionChain } from "@/components/pokemon/EvolutionChain";
import { SpriteViewer } from "@/components/pokemon/SpriteViewer";
import { StatsDashboard } from "@/components/pokemon/StatsDashboard";
import { TypeMatchups } from "@/components/pokemon/TypeMatchups";
import { CurrentPokemonTracker } from "@/components/team/TeamProvider";
import { TypeBadge } from "@/components/ui/TypeBadge";
import { getDefensiveMatchups } from "@/lib/matchups";
import { idFromUrl, PokeApiError, pokeFetch } from "@/lib/pokeapi/client";
import type {
  AbilityResponse,
  ChainLink,
  EvolutionChainResponse,
  ItemResponse,
  PokemonResponse,
  PokemonSpeciesResponse,
} from "@/lib/pokeapi/types";
import Image from "next/image";
import type { CSSProperties } from "react";
import {
  artworkUrl,
  CATEGORY_LABELS_ES,
  COLOR_LABELS_ES,
  COLOR_SWATCH_HEX,
  EGG_GROUP_LABELS_ES,
  formatDexNumber,
  formatName,
  generationFromName,
  generationLabel,
  growthLabel,
  HABITAT_LABELS_ES,
  SHAPE_LABELS_ES,
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
  const displayName = formatName(decodeURIComponent(name));
  return {
    title: displayName,
    description: `Ficha completa de ${displayName}: tipos, estadísticas, debilidades y resistencias, habilidades, crianza, evoluciones y cartas del JCC.`,
  };
}

export default async function PokemonDetailPage({ params }: PageProps) {
  const { name } = await params;
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

  // Combat matchups (1-2 cached /type fetches), localized ability sheets
  // (≤3 cached /ability fetches) and held-item names resolve in parallel
  // once the pokemon is known.
  const [matchups, abilities, heldItems] = await Promise.all([
    getDefensiveMatchups(pokemon.types.map(({ type }) => type.name)),
    Promise.all(
      pokemon.abilities.map(async ({ ability, is_hidden }) => {
        const detail = await pokeFetch<AbilityResponse>(
          `/ability/${ability.name}`,
        );
        const holders = detail.pokemon.map((p) => p.pokemon.name);
        return {
          isHidden: is_hidden,
          holdersCount: holders.length,
          isLineExclusive:
            holders.length > 0 && holders.every(belongsToLine),
          label:
            detail.names.find((n) => n.language.name === "es")?.name ??
            formatName(ability.name),
          description: (
            detail.flavor_text_entries.find((f) => f.language.name === "es") ??
            detail.flavor_text_entries.find((f) => f.language.name === "en")
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
            detail.names.find((n) => n.language.name === "es")?.name ??
            formatName(item.name),
          sprite: detail.sprites.default,
        };
      }),
    ),
  ]);

  const generation = generationFromName(species.generation.name);
  const flavorEntry =
    species.flavor_text_entries.find((f) => f.language.name === "es") ??
    species.flavor_text_entries.find((f) => f.language.name === "en");
  const flavorText = flavorEntry?.flavor_text.replace(/\s+/g, " ");
  const flavorVersion = flavorEntry
    ? versionLabel(flavorEntry.version.name)
    : null;
  const genus =
    species.genera.find((g) => g.language.name === "es")?.genus ??
    species.genera.find((g) => g.language.name === "en")?.genus;
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
      ? "Muy fácil"
      : species.capture_rate >= 120
        ? "Fácil"
        : species.capture_rate >= 45
          ? "Media"
          : species.capture_rate >= 10
            ? "Difícil"
            : "Muy difícil";
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

  return (
    <main
      style={
        {
          "--aura": typeAura(pokemon.types[0]?.type.name),
        } as CSSProperties
      }
      className="mx-auto w-full max-w-5xl flex-1 px-4 py-6"
    >
      {/* Marca esta especie como la "seleccionada" para el cajón del equipo. */}
      <CurrentPokemonTracker
        member={{
          id: species.id,
          name: species.name,
          types: pokemon.types.map(({ type }) => type.name),
        }}
      />
      <BackButton />

      <div className="mt-4 grid gap-6 md:grid-cols-[minmax(0,320px)_1fr]">
        <div className="aura-card relative rounded-xl border bg-gradient-to-b from-[#0a101d] to-[#050810] p-6">
          <span
            aria-hidden
            className="hud-corners pointer-events-none absolute inset-2 opacity-60"
          />
          {crySrc && (
            <div className="absolute top-3 right-3 z-10">
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
          {/* Ghost dex number: giant aura-tinted watermark behind the sheet. */}
          <span
            aria-hidden
            className="pointer-events-none absolute -top-6 right-0 font-display text-[7rem] leading-none font-extrabold text-[var(--aura)] opacity-[0.07] select-none sm:text-[9rem]"
          >
            {String(species.id).padStart(4, "0")}
          </span>
          <div>
            <p className="neon-aura font-pixel text-xs">
              {formatDexNumber(species.id)}
            </p>
            <div className="mt-1 flex flex-wrap items-baseline gap-x-3 gap-y-1">
              <h1 className="font-display text-3xl font-bold tracking-wide text-white">
                {formatName(species.name)}
              </h1>
              <span className="rounded border border-slate-700/80 px-2 py-0.5 font-mono text-xs tracking-wider text-slate-300 uppercase">
                {generationLabel(generation)}
              </span>
            </div>
            <div className="mt-1.5 flex flex-wrap items-center gap-2">
              {genus && (
                <p className="font-mono text-sm text-slate-300">{genus}</p>
              )}
              {category !== "normal" && (
                <span className="rounded border border-red-500/40 bg-red-500/10 px-1.5 py-0.5 font-mono text-xs font-semibold tracking-widest text-red-300 uppercase">
                  {CATEGORY_LABELS_ES[category]}
                </span>
              )}
            </div>
            <div
              aria-hidden
              className="mt-2 h-px w-24 bg-gradient-to-r from-[var(--aura)] to-transparent"
            />
            <div className="mt-3 flex flex-wrap items-center gap-1.5">
              {pokemon.types.map(({ type }) => (
                <TypeBadge key={type.name} type={type.name} size="md" />
              ))}
            </div>
          </div>

          {flavorText && (
            <div className="rounded-r-md border-l-2 border-emerald-500/50 bg-emerald-500/[0.05] p-3">
              <p className="font-mono text-xs tracking-[0.2em] text-emerald-500 uppercase">
                Registro de la Pokédex
                {flavorVersion && (
                  <span className="text-emerald-500/60"> · {flavorVersion}</span>
                )}
              </p>
              <p className="mt-1.5 font-mono text-sm leading-relaxed text-emerald-100/80">
                {flavorText}
              </p>
            </div>
          )}

          <dl className="grid grid-cols-2 gap-2 text-sm sm:grid-cols-3">
            {[
              ["Altura", `${pokemon.height / 10} m`],
              ["Peso", `${pokemon.weight / 10} kg`],
              ["Exp. base", `${pokemon.base_experience ?? "—"}`],
              ["Crecimiento", growthLabel(species.growth_rate?.name)],
            ].map(([label, value]) => (
              <div
                key={label}
                className="rounded-md border border-slate-800 bg-black/40 px-3 py-2"
              >
                <dt className="font-mono text-xs tracking-widest text-slate-400 uppercase">
                  {label}
                </dt>
                <dd className="mt-0.5 font-mono text-sm font-semibold text-[var(--aura)]">
                  {value}
                </dd>
              </div>
            ))}
            {(
              [
                ["Captura", species.capture_rate, captureEase],
                ["Felicidad", species.base_happiness, null],
              ] as const
            ).map(([label, value, note]) => (
              <div
                key={label}
                className="rounded-md border border-slate-800 bg-black/40 px-3 py-2"
              >
                <dt className="font-mono text-xs tracking-widest text-slate-400 uppercase">
                  {label}
                </dt>
                <dd className="mt-0.5">
                  <p className="font-mono text-sm font-semibold text-[var(--aura)]">
                    {value ?? "—"}
                    <span className="text-slate-500">/255</span>
                    {note && (
                      <span className="ml-1.5 text-xs font-normal text-slate-300">
                        {note}
                      </span>
                    )}
                  </p>
                  <div className="mt-1 h-1 overflow-hidden rounded-full bg-slate-800">
                    <div
                      className="h-full rounded-full bg-[var(--aura)] motion-safe:animate-[bar-grow_600ms_ease-out]"
                      style={{
                        width: `${Math.min(100, ((value ?? 0) / 255) * 100)}%`,
                      }}
                    />
                  </div>
                </dd>
              </div>
            ))}
          </dl>
        </div>
      </div>

      <section
        aria-label="Estadísticas base"
        className="mt-8 hud-panel rounded-xl border border-slate-800/80 bg-[#070b14]/90 p-5"
      >
        <h2 className="mb-4 font-pixel text-xs text-slate-300">
          <span aria-hidden className="mr-1.5 text-red-500">
            ►
          </span>
          Estadísticas base
        </h2>
        <StatsDashboard
          stats={pokemon.stats.map((s) => ({
            name: s.stat.name,
            value: s.base_stat,
            effort: s.effort,
          }))}
          type={pokemon.types[0]?.type.name ?? "normal"}
        />
      </section>

      <div className="mt-8 grid items-start gap-6 lg:grid-cols-3">
        <section
          aria-label="Análisis de combate"
          className="hud-panel rounded-xl border border-slate-800/80 bg-[#070b14]/90 p-5"
        >
          <h2 className="mb-4 font-pixel text-xs text-slate-300">
            <span aria-hidden className="mr-1.5 text-red-500">
              ►
            </span>
            Análisis de combate
          </h2>
          <TypeMatchups matchups={matchups} />
        </section>

        <section
          aria-label="Habilidades"
          className="hud-panel rounded-xl border border-slate-800/80 bg-[#070b14]/90 p-5"
        >
          <h2 className="mb-4 font-pixel text-xs text-slate-300">
            <span aria-hidden className="mr-1.5 text-red-500">
              ►
            </span>
            Habilidades
          </h2>
          <ul className="flex flex-col divide-y divide-slate-800/60">
            {abilities.map((ability, index) => (
              <li key={ability.label} className="py-3.5 first:pt-0 last:pb-0">
                <div className="flex flex-wrap items-baseline gap-x-2.5 gap-y-1">
                  <span
                    aria-hidden
                    className="font-pixel text-xs text-[var(--aura)] opacity-80"
                  >
                    {String(index + 1).padStart(2, "0")}
                  </span>
                  <h3 className="text-base font-semibold text-slate-100">
                    {ability.label}
                  </h3>
                  {ability.isHidden && (
                    <span className="font-mono text-xs font-semibold tracking-widest text-violet-300 uppercase [text-shadow:0_0_10px_rgba(167,139,250,0.45)]">
                      ● Oculta
                    </span>
                  )}
                  {ability.holdersCount === 1 ? (
                    <span className="font-mono text-xs font-semibold tracking-widest text-amber-300 uppercase [text-shadow:0_0_10px_rgba(251,191,36,0.5)]">
                      ◆ Única
                    </span>
                  ) : (
                    ability.isLineExclusive && (
                      <span className="font-mono text-xs font-semibold tracking-widest text-cyan-300 uppercase [text-shadow:0_0_10px_rgba(34,211,238,0.45)]">
                        ◆ Exclusiva de su línea
                      </span>
                    )
                  )}
                  <span className="ml-auto font-mono text-xs text-slate-500">
                    {ability.holdersCount}{" "}
                    {ability.holdersCount === 1 ? "portador" : "portadores"}
                  </span>
                </div>
                {ability.description && (
                  <p className="mt-1.5 border-l-2 border-[color-mix(in_srgb,var(--aura)_35%,transparent)] pl-3 text-sm leading-relaxed text-slate-300">
                    {ability.description}
                  </p>
                )}
              </li>
            ))}
          </ul>
        </section>

        <section
          aria-label="Crianza y perfil"
          className="hud-panel rounded-xl border border-slate-800/80 bg-[#070b14]/90 p-5"
        >
          <h2 className="mb-4 font-pixel text-xs text-slate-300">
            <span aria-hidden className="mr-1.5 text-red-500">
              ►
            </span>
            Crianza y perfil
          </h2>
          <dl className="flex flex-col divide-y divide-slate-800/60 text-sm">
            <div className="py-3.5 first:pt-0 last:pb-0">
              <dt className="font-mono text-xs tracking-widest text-slate-400 uppercase">
                Género
              </dt>
              <dd className="mt-2">
                {femalePct === null ? (
                  <span className="font-mono text-sm text-slate-300">
                    Sin género
                  </span>
                ) : (
                  <div className="flex items-center gap-2.5 font-mono text-xs">
                    <span className="shrink-0 text-sky-300">
                      ♂ {100 - femalePct}%
                    </span>
                    <div className="flex h-2 flex-1 overflow-hidden rounded-full bg-slate-800">
                      <span
                        style={{ width: `${100 - femalePct}%` }}
                        className="bg-sky-400 shadow-[0_0_8px_rgba(56,189,248,0.6)]"
                      />
                      <span
                        style={{ width: `${femalePct}%` }}
                        className="bg-pink-400 shadow-[0_0_8px_rgba(244,114,182,0.6)]"
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
                Grupos huevo
              </dt>
              <dd className="mt-1 font-mono text-sm font-semibold tracking-wide text-slate-200 uppercase">
                {species.egg_groups.length === 0
                  ? "—"
                  : species.egg_groups.map((group, index) => (
                      <span key={group.name}>
                        {index > 0 && (
                          <span
                            aria-hidden
                            className="mx-2 text-xs text-[var(--aura)]"
                          >
                            ◆
                          </span>
                        )}
                        {EGG_GROUP_LABELS_ES[group.name] ??
                          formatName(group.name)}
                      </span>
                    ))}
              </dd>
            </div>

            {species.hatch_counter !== null && (
              <div className="py-3.5 first:pt-0 last:pb-0">
                <dt className="font-mono text-xs tracking-widest text-slate-400 uppercase">
                  Ciclos de huevo
                </dt>
                <dd className="mt-1 font-mono text-sm text-slate-400">
                  <span className="font-semibold text-slate-200">
                    {species.hatch_counter} ciclos
                  </span>{" "}
                  · ~
                  {((species.hatch_counter + 1) * 255).toLocaleString("es-ES")}{" "}
                  pasos
                </dd>
              </div>
            )}

            {heldItems.length > 0 && (
              <div className="py-3.5 first:pt-0 last:pb-0">
                <dt className="font-mono text-xs tracking-widest text-slate-400 uppercase">
                  Objetos en estado salvaje
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
                    "Hábitat",
                    species.habitat
                      ? (HABITAT_LABELS_ES[species.habitat.name] ??
                        formatName(species.habitat.name))
                      : "Desconocido",
                  ],
                  [
                    "Forma corporal",
                    species.shape
                      ? (SHAPE_LABELS_ES[species.shape.name] ??
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
                  Color
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
                    ? (COLOR_LABELS_ES[species.color.name] ??
                      formatName(species.color.name))
                    : "—"}
                </dd>
              </div>
            </div>
          </dl>
        </section>
      </div>

      <div className="mt-8 hud-panel rounded-xl border border-slate-800/80 bg-[#070b14]/90 p-5">
        <EvolutionChain chain={chain} currentName={species.name} />
      </div>

      <section
        aria-label="Galería de cartas del JCC"
        className="mt-8 hud-panel rounded-xl border border-slate-800/80 bg-[#070b14]/90 p-5"
      >
        <h2 className="mb-4 font-pixel text-xs text-slate-300">
          <span aria-hidden className="mr-1.5 text-red-500">
            ►
          </span>
          Cartas del JCC
        </h2>
        <Suspense fallback={<CardGallerySkeleton />}>
          <CardGallery name={englishName} />
        </Suspense>
      </section>
    </main>
  );
}
