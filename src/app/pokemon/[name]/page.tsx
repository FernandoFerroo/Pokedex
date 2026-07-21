import type { Metadata } from "next";
import Image from "next/image";
import { notFound } from "next/navigation";
import { BackButton } from "@/components/pokemon/BackButton";
import { EvolutionChain } from "@/components/pokemon/EvolutionChain";
import { StatsPanel } from "@/components/pokemon/StatsPanel";
import { TypeBadge } from "@/components/ui/TypeBadge";
import { idFromUrl, PokeApiError, pokeFetch } from "@/lib/pokeapi/client";
import type {
  EvolutionChainResponse,
  PokemonResponse,
  PokemonSpeciesResponse,
} from "@/lib/pokeapi/types";
import {
  artworkUrl,
  formatDexNumber,
  formatName,
  generationFromName,
  generationLabel,
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
  const image =
    pokemon.sprites.other?.["official-artwork"]?.front_default ??
    artworkUrl(pokemon.id);

  return (
    <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-6">
      <BackButton />

      <div className="mt-4 grid gap-6 md:grid-cols-[minmax(0,320px)_1fr]">
        <div className="flex items-center justify-center rounded-2xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900">
          <div className="relative aspect-square w-full max-w-[280px]">
            <Image
              src={image}
              alt={formatName(species.name)}
              fill
              priority
              sizes="280px"
              className="object-contain"
            />
          </div>
        </div>

        <div className="flex flex-col gap-4">
          <div>
            <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
              <h1 className="text-3xl font-bold tracking-tight">
                {formatName(species.name)}
              </h1>
              <span className="font-mono text-lg font-medium text-slate-400 dark:text-slate-500">
                {formatDexNumber(species.id)}
              </span>
            </div>
            <div className="mt-2 flex flex-wrap items-center gap-1.5">
              <span className="rounded-md border border-slate-200 px-2.5 py-1 text-sm font-medium text-slate-600 dark:border-slate-700 dark:text-slate-300">
                {generationLabel(generation)}
              </span>
              {pokemon.types.map(({ type }) => (
                <TypeBadge key={type.name} type={type.name} size="md" />
              ))}
            </div>
          </div>

          {flavorText && (
            <p className="text-sm leading-relaxed text-slate-600 dark:text-slate-400">
              {flavorText}
            </p>
          )}

          <dl className="flex gap-6 text-sm">
            <div>
              <dt className="text-slate-500 dark:text-slate-400">Altura</dt>
              <dd className="font-semibold">{pokemon.height / 10} m</dd>
            </div>
            <div>
              <dt className="text-slate-500 dark:text-slate-400">Peso</dt>
              <dd className="font-semibold">{pokemon.weight / 10} kg</dd>
            </div>
          </dl>

          <StatsPanel
            stats={pokemon.stats.map((s) => ({
              name: s.stat.name,
              value: s.base_stat,
            }))}
          />
        </div>
      </div>

      <div className="mt-8 rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
        <EvolutionChain chain={chain} currentName={species.name} />
      </div>
    </main>
  );
}
