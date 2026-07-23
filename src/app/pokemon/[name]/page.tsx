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
import { StatsRadar } from "@/components/pokemon/StatsRadar";
import { TypeMatchups } from "@/components/pokemon/TypeMatchups";
import { TypeBadge } from "@/components/ui/TypeBadge";
import { getDefensiveMatchups } from "@/lib/matchups";
import { idFromUrl, PokeApiError, pokeFetch } from "@/lib/pokeapi/client";
import type {
  AbilityResponse,
  EvolutionChainResponse,
  PokemonResponse,
  PokemonSpeciesResponse,
} from "@/lib/pokeapi/types";
import type { CSSProperties } from "react";
import {
  artworkUrl,
  CATEGORY_LABELS_ES,
  COLOR_LABELS_ES,
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

  // Combat matchups (1-2 cached /type fetches) and localized ability sheets
  // (≤3 cached /ability fetches) resolve in parallel once the pokemon is known.
  const [matchups, abilities] = await Promise.all([
    getDefensiveMatchups(pokemon.types.map(({ type }) => type.name)),
    Promise.all(
      pokemon.abilities.map(async ({ ability, is_hidden }) => {
        const detail = await pokeFetch<AbilityResponse>(
          `/ability/${ability.name}`,
        );
        return {
          isHidden: is_hidden,
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
    <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-6">
      <BackButton />

      <div
        style={
          {
            "--aura": typeAura(pokemon.types[0]?.type.name),
          } as CSSProperties
        }
        className="mt-4 grid gap-6 md:grid-cols-[minmax(0,320px)_1fr]"
      >
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

        <div className="flex flex-col gap-4">
          <div>
            <p className="neon-aura font-pixel text-[10px]">
              {formatDexNumber(species.id)}
            </p>
            <div className="mt-1 flex flex-wrap items-baseline gap-x-3 gap-y-1">
              <h1 className="font-display text-3xl font-bold tracking-wide text-white">
                {formatName(species.name)}
              </h1>
              <span className="rounded border border-slate-700/80 px-2 py-0.5 font-mono text-xs tracking-wider text-slate-400 uppercase">
                {generationLabel(generation)}
              </span>
            </div>
            <div className="mt-1.5 flex flex-wrap items-center gap-2">
              {genus && (
                <p className="font-mono text-sm text-slate-400">{genus}</p>
              )}
              {category !== "normal" && (
                <span className="rounded border border-red-500/40 bg-red-500/10 px-1.5 py-0.5 font-mono text-[10px] font-semibold tracking-widest text-red-300 uppercase">
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
              <p className="font-mono text-[10px] tracking-[0.2em] text-emerald-500 uppercase">
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

          <dl className="flex flex-wrap gap-3 text-sm">
            {[
              ["Altura", `${pokemon.height / 10} m`],
              ["Peso", `${pokemon.weight / 10} kg`],
              ["Captura", `${species.capture_rate}/255`],
              ["Felicidad", `${species.base_happiness ?? "—"}`],
              ["Exp. base", `${pokemon.base_experience ?? "—"}`],
              ["Crecimiento", growthLabel(species.growth_rate?.name)],
            ].map(([label, value]) => (
              <div
                key={label}
                className="rounded-md border border-slate-800 bg-black/40 px-4 py-2"
              >
                <dt className="font-mono text-[10px] tracking-widest text-slate-500 uppercase">
                  {label}
                </dt>
                <dd className="mt-0.5 font-mono text-sm font-semibold text-[var(--aura)]">
                  {value}
                </dd>
              </div>
            ))}
          </dl>

          <StatsRadar
            stats={pokemon.stats.map((s) => ({
              name: s.stat.name,
              value: s.base_stat,
            }))}
            type={pokemon.types[0]?.type.name ?? "normal"}
          />
        </div>
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-3">
        <section
          aria-label="Análisis de combate"
          className="rounded-xl border border-slate-800/80 bg-[#070b14]/90 p-5"
        >
          <h2 className="mb-4 font-pixel text-[10px] text-slate-400">
            <span aria-hidden className="mr-1.5 text-red-500">
              ►
            </span>
            Análisis de combate
          </h2>
          <TypeMatchups matchups={matchups} />
        </section>

        <section
          aria-label="Habilidades"
          className="rounded-xl border border-slate-800/80 bg-[#070b14]/90 p-5"
        >
          <h2 className="mb-4 font-pixel text-[10px] text-slate-400">
            <span aria-hidden className="mr-1.5 text-red-500">
              ►
            </span>
            Habilidades
          </h2>
          <ul className="flex flex-col gap-3.5">
            {abilities.map((ability) => (
              <li key={ability.label}>
                <p className="flex flex-wrap items-center gap-2 text-sm font-semibold text-slate-100">
                  {ability.label}
                  {ability.isHidden && (
                    <span className="rounded border border-violet-500/40 bg-violet-500/10 px-1.5 py-0.5 font-mono text-[9px] tracking-widest text-violet-300 uppercase">
                      Oculta
                    </span>
                  )}
                </p>
                {ability.description && (
                  <p className="mt-1 text-xs leading-relaxed text-slate-400">
                    {ability.description}
                  </p>
                )}
              </li>
            ))}
          </ul>
        </section>

        <section
          aria-label="Crianza y perfil"
          className="rounded-xl border border-slate-800/80 bg-[#070b14]/90 p-5"
        >
          <h2 className="mb-4 font-pixel text-[10px] text-slate-400">
            <span aria-hidden className="mr-1.5 text-red-500">
              ►
            </span>
            Crianza y perfil
          </h2>
          <dl className="flex flex-col gap-3.5 text-sm">
            <div>
              <dt className="font-mono text-[10px] tracking-widest text-slate-500 uppercase">
                Género
              </dt>
              <dd className="mt-1.5">
                {femalePct === null ? (
                  <span className="font-mono text-xs text-slate-400">
                    Sin género
                  </span>
                ) : (
                  <>
                    <div className="flex h-1.5 overflow-hidden rounded-full bg-slate-800">
                      <span
                        style={{ width: `${100 - femalePct}%` }}
                        className="bg-sky-400"
                      />
                      <span
                        style={{ width: `${femalePct}%` }}
                        className="bg-pink-400"
                      />
                    </div>
                    <p className="mt-1 font-mono text-[11px] text-slate-400">
                      <span className="text-sky-300">♂ {100 - femalePct}%</span>
                      {" · "}
                      <span className="text-pink-300">♀ {femalePct}%</span>
                    </p>
                  </>
                )}
              </dd>
            </div>

            <div>
              <dt className="font-mono text-[10px] tracking-widest text-slate-500 uppercase">
                Grupos huevo
              </dt>
              <dd className="mt-1.5 flex flex-wrap gap-1">
                {species.egg_groups.length === 0 ? (
                  <span className="font-mono text-xs text-slate-400">—</span>
                ) : (
                  species.egg_groups.map((group) => (
                    <span
                      key={group.name}
                      className="rounded border border-slate-700 bg-black/40 px-1.5 py-0.5 font-mono text-[10px] tracking-wider text-slate-300 uppercase"
                    >
                      {EGG_GROUP_LABELS_ES[group.name] ?? formatName(group.name)}
                    </span>
                  ))
                )}
              </dd>
            </div>

            {species.hatch_counter !== null && (
              <div>
                <dt className="font-mono text-[10px] tracking-widest text-slate-500 uppercase">
                  Ciclos de huevo
                </dt>
                <dd className="mt-1 font-mono text-xs text-slate-300">
                  {species.hatch_counter} ciclos · ~
                  {((species.hatch_counter + 1) * 255).toLocaleString("es-ES")}{" "}
                  pasos
                </dd>
              </div>
            )}

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
                [
                  "Color",
                  species.color
                    ? (COLOR_LABELS_ES[species.color.name] ??
                      formatName(species.color.name))
                    : "—",
                ],
              ] as const
            ).map(([label, value]) => (
              <div key={label}>
                <dt className="font-mono text-[10px] tracking-widest text-slate-500 uppercase">
                  {label}
                </dt>
                <dd className="mt-1 font-mono text-xs text-slate-300">
                  {value}
                </dd>
              </div>
            ))}
          </dl>
        </section>
      </div>

      <div className="mt-8 rounded-xl border border-slate-800/80 bg-[#070b14]/90 p-5">
        <EvolutionChain chain={chain} currentName={species.name} />
      </div>

      <section
        aria-label="Galería de cartas del JCC"
        className="mt-8 rounded-xl border border-slate-800/80 bg-[#070b14]/90 p-5"
      >
        <h2 className="mb-4 font-pixel text-[10px] text-slate-400">
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
