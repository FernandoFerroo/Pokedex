import { ArrowRight, Star } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import type { CSSProperties } from "react";
import { TypeBadge } from "@/components/ui/TypeBadge";
import { dailyDateKey, dailyDexId, fnv1a } from "@/lib/daily";
import { getDict } from "@/lib/i18n";
import { LOCALE, type Lang } from "@/lib/i18n/config";
import { getLang } from "@/lib/i18n/server";
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
  HABITAT_LABELS,
  typeAura,
} from "@/lib/pokemon-meta";

type HomeDict = ReturnType<typeof getDict>["home"];

/**
 * Candidate curious facts, built from PokéAPI data; one is picked
 * deterministically per day so the banner stays fresh without being random.
 */
function buildFacts(
  species: PokemonSpeciesResponse,
  pokemon: PokemonResponse,
  mainFlavor: string | undefined,
  lang: Lang,
  t: HomeDict,
): string[] {
  const facts: string[] = [];

  // A second Pokédex entry from a different game version.
  const altFlavor = species.flavor_text_entries
    .filter((f) => f.language.name === lang)
    .map((f) => f.flavor_text.replace(/\s+/g, " "))
    .find((text) => text !== mainFlavor);
  if (altFlavor) facts.push(altFlavor);

  facts.push(t.factCapture(species.capture_rate));

  if (species.habitat && HABITAT_LABELS[lang][species.habitat.name]) {
    facts.push(
      t.factHabitat(HABITAT_LABELS[lang][species.habitat.name].toLowerCase()),
    );
  }

  if (species.gender_rate === -1) {
    facts.push(t.factGenderless);
  } else if (species.gender_rate === 8) {
    facts.push(t.factAllFemale);
  } else if (species.gender_rate === 0) {
    facts.push(t.factAllMale);
  }

  if (pokemon.base_experience !== null) {
    facts.push(t.factBaseExp(pokemon.base_experience));
  }

  return facts;
}

export async function DailyBanner() {
  const lang = await getLang();
  const t = getDict(lang).home;

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

  const otherLang: Lang = lang === "en" ? "es" : "en";
  const flavorText = (
    species.flavor_text_entries.find((f) => f.language.name === lang) ??
    species.flavor_text_entries.find((f) => f.language.name === otherLang)
  )?.flavor_text.replace(/\s+/g, " ");

  const facts = buildFacts(species, pokemon, flavorText, lang, t);
  // Different hash salt than the id pick, so fact choice varies independently.
  const fact = facts[fnv1a(`${dateKey}:fact`) % facts.length];

  const star = pokemon.stats.reduce((best, s) =>
    s.base_stat > best.base_stat ? s : best,
  );

  const image =
    pokemon.sprites.other?.["official-artwork"]?.front_default ??
    artworkUrl(pokemon.id);
  const displayDate = new Intl.DateTimeFormat(LOCALE[lang], {
    timeZone: "Europe/Madrid",
    day: "2-digit",
    month: "long",
  }).format(new Date());

  return (
    <section
      aria-label={t.dailyTitle}
      style={{ "--aura": typeAura(pokemon.types[0]?.type.name) } as CSSProperties}
      className="aura-card relative mb-2 overflow-hidden rounded-xl border bg-gradient-to-br from-hud-1 via-hud-2 to-hud-3 p-4 max-sm:p-2.5 sm:mb-6 sm:p-8"
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
      <div className="relative mb-2 flex flex-wrap items-center justify-between gap-2 max-sm:mb-1 sm:mb-3.5">
        <h2 className="font-pixel text-[11px] whitespace-nowrap text-red-400 max-sm:text-[9px] sm:text-[13px]">
          <span aria-hidden className="mr-1.5">
            ►
          </span>
          <span className="neon-red">{t.dailyTitle}</span>
        </h2>
        <span className="font-mono text-[10px] tracking-[0.25em] whitespace-nowrap text-slate-400 uppercase max-sm:text-[9px] max-sm:tracking-[0.15em] sm:text-xs">
          {displayDate}
        </span>
      </div>

      {/* The artwork keeps its own right-hand column on every size, so the
          phone layout mirrors the desktop composition instead of stacking. */}
      <div className="relative grid grid-cols-[minmax(0,1fr)_5.5rem] items-center gap-4 max-sm:grid-cols-[minmax(0,1fr)_4.5rem] max-sm:gap-2.5 sm:grid-cols-[minmax(0,1fr)_10rem] sm:gap-6 md:grid-cols-[minmax(0,1fr)_240px]">
        <div className="flex flex-col gap-2 max-sm:gap-0.5 sm:gap-3.5">
          <div>
            <p className="neon-aura font-pixel text-xs max-sm:text-[10px]">
              {formatDexNumber(species.id)}
            </p>
            <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1.5 max-sm:mt-0.5 max-sm:gap-x-2 max-sm:gap-y-1">
              <p className="font-display text-xl font-extrabold tracking-wide text-slate-50 max-sm:text-base sm:text-4xl">
                {formatName(species.name)}
              </p>
              <span className="rounded border border-slate-700/80 px-2 py-0.5 font-mono text-xs tracking-wider text-slate-300 uppercase max-sm:px-1 max-sm:py-0 max-sm:text-[9px]">
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
            <p className="max-w-prose font-mono text-sm leading-relaxed text-slate-300/85 max-sm:hidden">
              {flavorText}
            </p>
          )}

          {fact && (
            <div className="max-w-prose rounded-r-md border-l-2 border-amber-400/60 bg-amber-400/[0.06] p-3 max-sm:hidden">
              <p className="font-mono text-xs tracking-[0.2em] text-amber-400 uppercase">
                {t.funFact}
              </p>
              <p className="mt-1 font-mono text-[13px] leading-relaxed text-amber-100/80">
                {fact}
              </p>
            </div>
          )}

          <div className="mt-1 flex flex-wrap items-center gap-3 max-sm:mt-0.5">
            <span
              className="inline-flex items-center gap-2 rounded-md border px-3 py-2 max-sm:hidden"
              style={{
                borderColor: "color-mix(in srgb, var(--aura) 45%, transparent)",
                background: "color-mix(in srgb, var(--aura) 12%, transparent)",
              }}
            >
              <Star size={13} className="text-[var(--aura)]" />
              <span className="font-mono text-xs tracking-widest text-slate-300 uppercase">
                {t.starStat}
              </span>
              <span className="font-mono text-sm font-bold text-[var(--aura)]">
                {t.statLabels[star.stat.name] ?? star.stat.name} · {star.base_stat}
              </span>
            </span>

            <Link
              href={`/pokemon/${species.name}`}
              className="inline-flex items-center gap-1.5 rounded-md bg-red-500 px-3 py-2 font-mono text-xs font-bold tracking-wider text-white uppercase transition hover:bg-[#f87171] hover:shadow-[0_0_22px_rgba(239,68,68,0.55)] max-sm:gap-1 max-sm:px-2 max-sm:py-1 max-sm:text-[10px] sm:px-4 sm:py-2.5"
            >
              {t.viewEntry}
              <ArrowRight size={14} className="max-sm:h-3 max-sm:w-3" />
            </Link>
          </div>
        </div>

        <div className="relative aspect-square w-full">
          <Image
            src={image}
            alt={t.artworkAlt(formatName(species.name))}
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

export function DailyBannerSkeleton({ lang }: { lang: Lang }) {
  const t = getDict(lang).home;
  return (
    <div className="mb-2 flex h-72 animate-pulse items-center justify-center rounded-xl border border-slate-800/80 bg-hud-2/90 max-sm:mb-2 max-sm:h-24 sm:mb-6">
      <span className="font-pixel text-xs text-slate-600">
        {t.skeletonTuning}
      </span>
    </div>
  );
}
