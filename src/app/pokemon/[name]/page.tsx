import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { BackButton } from "@/components/pokemon/BackButton";
import {
  CardGallery,
  CardGallerySkeleton,
} from "@/components/pokemon/CardGallery";
import { EvolutionChain } from "@/components/pokemon/EvolutionChain";
import { SpriteViewer } from "@/components/pokemon/SpriteViewer";
import { StatsRadar } from "@/components/pokemon/StatsRadar";
import { TypeBadge } from "@/components/ui/TypeBadge";
import { idFromUrl, PokeApiError, pokeFetch } from "@/lib/pokeapi/client";
import type {
  EvolutionChainResponse,
  PokemonResponse,
  PokemonSpeciesResponse,
} from "@/lib/pokeapi/types";
import type { CSSProperties } from "react";
import {
  artworkUrl,
  formatDexNumber,
  formatName,
  generationFromName,
  generationLabel,
  typeAura,
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
  return { title: formatName(decodeURIComponent(name)) };
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

  const generation = generationFromName(species.generation.name);
  const flavorText = (
    species.flavor_text_entries.find((f) => f.language.name === "es") ??
    species.flavor_text_entries.find((f) => f.language.name === "en")
  )?.flavor_text.replace(/\s+/g, " ");
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
              <h1 className="text-3xl font-bold tracking-tight text-white">
                {formatName(species.name)}
              </h1>
              <span className="rounded border border-slate-700/80 px-2 py-0.5 font-mono text-xs tracking-wider text-slate-400 uppercase">
                {generationLabel(generation)}
              </span>
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
              </p>
              <p className="mt-1.5 font-mono text-sm leading-relaxed text-emerald-100/80">
                {flavorText}
              </p>
            </div>
          )}

          <dl className="flex gap-3 text-sm">
            {[
              ["Altura", `${pokemon.height / 10} m`],
              ["Peso", `${pokemon.weight / 10} kg`],
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
