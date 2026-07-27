import Image from "next/image";
import Link from "next/link";
import type { CSSProperties } from "react";
import { FavoriteButton } from "@/components/favorites/FavoriteButton";
import { AddToTeamButton } from "@/components/team/AddToTeamButton";
import { TypeBadge } from "@/components/ui/TypeBadge";
import { useT } from "@/lib/i18n/client";
import {
  artworkUrl,
  formatDexNumber,
  formatName,
  generationLabel,
  typeAura,
} from "@/lib/pokemon-meta";
import type { PokemonIndexEntry } from "@/types/pokemon";

interface PokemonCardProps {
  entry: PokemonIndexEntry;
}

export function PokemonCard({ entry }: PokemonCardProps) {
  const a11y = useT().a11y;
  return (
    <Link
      href={`/pokemon/${entry.name}`}
      style={{ "--aura": typeAura(entry.types[0]) } as CSSProperties}
      className="aura-card group relative flex flex-col overflow-hidden rounded-lg border bg-gradient-to-b from-hud-1 to-hud-3 p-2 motion-safe:hover:-translate-y-0.5 [content-visibility:auto] [contain-intrinsic-size:auto_120px] max-sm:rounded-md max-sm:p-1 max-sm:[contain-intrinsic-size:auto_86px] sm:p-3 sm:[contain-intrinsic-size:auto_230px]"
    >
      {/* Targeting reticle + scan beam, revealed while hovering the entry */}
      <span
        aria-hidden
        className="hud-corners pointer-events-none absolute inset-1.5 z-10 opacity-0 transition-opacity duration-300 group-hover:opacity-100"
      />
      <span aria-hidden className="scan-beam z-10" />

      <div className="flex items-center justify-between text-slate-400">
        <span className="font-pixel text-[10px] transition-colors group-hover:text-[var(--aura)] max-sm:text-[7px] sm:text-xs">
          {formatDexNumber(entry.id)}
        </span>
        {/* The generation chip is the first thing to go when the card is only
            ~112px wide — the number and the name carry the identity. */}
        <span className="rounded border border-slate-700/80 px-1.5 py-0.5 font-mono text-xs tracking-wider text-slate-300 uppercase max-sm:hidden">
          {generationLabel(entry.generation)}
        </span>
      </div>
      {/* Favorito y alta directa al equipo, sin pasar por la ficha: corazón
          arriba, «+» debajo. Con seis por fila el móvil no tiene sitio — dos
          botones taparían la ilustración entera —, así que allí se retiran y
          las dos acciones viven en la ficha del Pokémon, a un toque. */}
      <span className="absolute top-7 right-1 z-20 flex flex-col gap-1 opacity-80 transition-opacity duration-200 group-hover:opacity-100 focus-within:opacity-100 max-sm:hidden sm:top-9 sm:right-2 sm:gap-1.5 sm:opacity-0">
        <FavoriteButton id={entry.id} name={entry.name} />
        <AddToTeamButton
          member={{ id: entry.id, name: entry.name, types: entry.types }}
        />
      </span>
      {/* En móvil la altura del sprite manda sobre el ancho de la columna: una
          caja fija de 40px deja la ficha en ~86px de alto, lo justo para que
          entren tres filas completas bajo los filtros. */}
      <div className="aura-halo relative mx-auto aspect-square w-full max-w-[130px] max-sm:aspect-auto max-sm:h-10">
        <Image
          src={artworkUrl(entry.id)}
          alt={a11y.artOf(formatName(entry.name))}
          fill
          sizes="(max-width: 640px) 17vw, 130px"
          className="aura-sprite object-contain p-1 transition-transform duration-200 group-hover:scale-[1.06] max-sm:p-0"
        />
      </div>
      <p className="truncate text-sm font-semibold tracking-tight text-slate-100 transition-colors group-hover:text-slate-50 max-sm:text-[8px] max-sm:leading-tight sm:text-base">
        {formatName(entry.name)}
      </p>
      {/* `mt-auto` pins the chips to the bottom edge, so a single-type card
          lines its chip up with its dual-type neighbours' in the same row.
          A 54px card only has room for the primary type — the one that gives
          the card its aura — so the secondary chip steps aside on phones. */}
      <div className="mt-auto flex flex-wrap gap-1 pt-1 max-sm:gap-0.5 max-sm:pt-0.5 sm:pt-1.5">
        {entry.types.map((type, i) => (
          <TypeBadge
            key={type}
            type={type}
            compactOnMobile
            className={i > 0 ? "max-sm:hidden" : undefined}
          />
        ))}
      </div>
    </Link>
  );
}
