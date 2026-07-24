import { ArrowRight, Star } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import type { CSSProperties } from "react";
import { TypeBadge } from "@/components/ui/TypeBadge";
import { dailyDateKey, dailyDexId, fnv1a } from "@/lib/daily";
import { pokeFetch } from "@/lib/pokeapi/client";
import type {
  PokemonResponse,
  PokemonSpeciesResponse,
} from "@/lib/pokeapi/types";
import {
  artworkUrl,
  formatDexNumber,
  formatName,
  generationFromName,
  generationLabel,
  HABITAT_LABELS_ES,
  typeAura,
} from "@/lib/pokemon-meta";

const STAT_LABELS: Record<string, string> = {
  hp: "PS",
  attack: "Ataque",
  defense: "Defensa",
  "special-attack": "At. Esp.",
  "special-defense": "Def. Esp.",
  speed: "Velocidad",
};

/**
 * Candidate curious facts, built from PokéAPI data; one is picked
 * deterministically per day so the banner stays fresh without being random.
 */
function buildFacts(
  species: PokemonSpeciesResponse,
  pokemon: PokemonResponse,
  mainFlavor: string | undefined,
): string[] {
  const facts: string[] = [];

  // A second Pokédex entry from a different game version.
  const altFlavor = species.flavor_text_entries
    .filter((f) => f.language.name === "es")
    .map((f) => f.flavor_text.replace(/\s+/g, " "))
    .find((text) => text !== mainFlavor);
  if (altFlavor) facts.push(altFlavor);

  const { capture_rate } = species;
  facts.push(
    `Su ratio de captura es ${capture_rate}/255: ${
      capture_rate <= 45
        ? "de los más difíciles de atrapar"
        : capture_rate >= 190
          ? "cae en casi cualquier Poké Ball"
          : "un desafío moderado con la Poké Ball adecuada"
    }.`,
  );

  if (species.habitat && HABITAT_LABELS_ES[species.habitat.name]) {
    facts.push(
      `En Kanto se le avistaba sobre todo en un hábitat de tipo ${HABITAT_LABELS_ES[species.habitat.name].toLowerCase()}.`,
    );
  }

  if (species.gender_rate === -1) {
    facts.push("No se le conoce género: es una especie asexuada.");
  } else if (species.gender_rate === 8) {
    facts.push("Todos los ejemplares conocidos son hembras.");
  } else if (species.gender_rate === 0) {
    facts.push("Todos los ejemplares conocidos son machos.");
  }

  if (pokemon.base_experience !== null) {
    facts.push(
      `Derrotarlo otorga ${pokemon.base_experience} puntos de experiencia base.`,
    );
  }

  return facts;
}

export async function DailyBanner() {
  const dateKey = dailyDateKey();
  const id = dailyDexId(dateKey);

  const species = await pokeFetch<PokemonSpeciesResponse>(
    `/pokemon-species/${id}`,
  );
  const variety =
    species.varieties.find((v) => v.is_default) ?? species.varieties[0];
  const pokemon = await pokeFetch<PokemonResponse>(
    `/pokemon/${variety.pokemon.name}`,
  );

  const flavorText = (
    species.flavor_text_entries.find((f) => f.language.name === "es") ??
    species.flavor_text_entries.find((f) => f.language.name === "en")
  )?.flavor_text.replace(/\s+/g, " ");

  const facts = buildFacts(species, pokemon, flavorText);
  // Different hash salt than the id pick, so fact choice varies independently.
  const fact = facts[fnv1a(`${dateKey}:fact`) % facts.length];

  const star = pokemon.stats.reduce((best, s) =>
    s.base_stat > best.base_stat ? s : best,
  );

  const image =
    pokemon.sprites.other?.["official-artwork"]?.front_default ??
    artworkUrl(pokemon.id);
  const displayDate = new Intl.DateTimeFormat("es-ES", {
    timeZone: "Europe/Madrid",
    day: "2-digit",
    month: "long",
  }).format(new Date());

  return (
    <section
      aria-label="Pokémon del día"
      style={{ "--aura": typeAura(pokemon.types[0]?.type.name) } as CSSProperties}
      className="aura-card relative mb-6 overflow-hidden rounded-xl border bg-gradient-to-br from-[#0a101d] via-[#070b14] to-[#050810] p-5 sm:p-8"
    >
      <span
        aria-hidden
        className="hud-corners pointer-events-none absolute inset-2 opacity-60"
      />
      {/* Soft aura pool bleeding in from the artwork side */}
      <span
        aria-hidden
        className="pointer-events-none absolute -top-24 -right-20 h-96 w-96 rounded-full opacity-25 blur-3xl"
        style={{ background: "var(--aura)" }}
      />

      {/* Full-width header row: title left, date right, on every size. */}
      <div className="relative mb-3.5 flex flex-wrap items-center justify-between gap-2">
        <h2 className="font-pixel text-[11px] whitespace-nowrap text-red-400 sm:text-[13px]">
          <span aria-hidden className="mr-1.5">
            ►
          </span>
          <span className="neon-red">Pokémon del día</span>
        </h2>
        <span className="font-mono text-[10px] tracking-[0.25em] whitespace-nowrap text-slate-400 uppercase sm:text-xs">
          {displayDate}
        </span>
      </div>

      {/* The artwork keeps its own right-hand column on every size, so the
          phone layout mirrors the desktop composition instead of stacking. */}
      <div className="relative grid grid-cols-[minmax(0,1fr)_6.5rem] items-center gap-4 sm:grid-cols-[minmax(0,1fr)_10rem] sm:gap-6 md:grid-cols-[minmax(0,1fr)_240px]">
        <div className="flex flex-col gap-3.5">
          <div>
            <p className="neon-aura font-pixel text-xs">
              {formatDexNumber(species.id)}
            </p>
            <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1.5">
              <p className="font-display text-2xl font-extrabold tracking-wide text-white sm:text-4xl">
                {formatName(species.name)}
              </p>
              <span className="rounded border border-slate-700/80 px-2 py-0.5 font-mono text-xs tracking-wider text-slate-300 uppercase">
                {generationLabel(generationFromName(species.generation.name))}
              </span>
              <span className="flex gap-1.5">
                {pokemon.types.map(({ type }) => (
                  <TypeBadge key={type.name} type={type.name} size="md" />
                ))}
              </span>
            </div>
          </div>

          {flavorText && (
            <p className="max-w-prose font-mono text-sm leading-relaxed text-slate-300/85 max-sm:line-clamp-3">
              {flavorText}
            </p>
          )}

          {fact && (
            <div className="max-w-prose rounded-r-md border-l-2 border-amber-400/60 bg-amber-400/[0.06] p-3">
              <p className="font-mono text-xs tracking-[0.2em] text-amber-400 uppercase">
                Dato curioso
              </p>
              <p className="mt-1 font-mono text-[13px] leading-relaxed text-amber-100/80">
                {fact}
              </p>
            </div>
          )}

          <div className="mt-1 flex flex-wrap items-center gap-3">
            <span
              className="inline-flex items-center gap-2 rounded-md border px-3 py-2"
              style={{
                borderColor: "color-mix(in srgb, var(--aura) 45%, transparent)",
                background: "color-mix(in srgb, var(--aura) 12%, transparent)",
              }}
            >
              <Star size={13} className="text-[var(--aura)]" />
              <span className="font-mono text-xs tracking-widest text-slate-300 uppercase">
                Stat estrella
              </span>
              <span className="font-mono text-sm font-bold text-[var(--aura)]">
                {STAT_LABELS[star.stat.name] ?? star.stat.name} · {star.base_stat}
              </span>
            </span>

            <Link
              href={`/pokemon/${species.name}`}
              className="inline-flex items-center gap-1.5 rounded-md bg-red-500 px-4 py-2.5 font-mono text-xs font-bold tracking-wider text-white uppercase transition hover:bg-red-400 hover:shadow-[0_0_22px_rgba(239,68,68,0.55)]"
            >
              Explorar ficha
              <ArrowRight size={14} />
            </Link>
          </div>
        </div>

        <div className="relative aspect-square w-full">
          <Image
            src={image}
            alt={`Ilustración de ${formatName(species.name)}`}
            fill
            priority
            sizes="(max-width: 768px) 240px, 240px"
            className="aura-sprite object-contain"
          />
        </div>
      </div>
    </section>
  );
}

export function DailyBannerSkeleton() {
  return (
    <div className="mb-6 flex h-72 animate-pulse items-center justify-center rounded-xl border border-slate-800/80 bg-[#070b14]/90">
      <span className="font-pixel text-xs text-slate-600">
        Sintonizando Pokémon del día…
      </span>
    </div>
  );
}
