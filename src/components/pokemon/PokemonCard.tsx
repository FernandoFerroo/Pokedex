import Image from "next/image";
import Link from "next/link";
import type { CSSProperties } from "react";
import { TypeBadge } from "@/components/ui/TypeBadge";
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
  return (
    <Link
      href={`/pokemon/${entry.name}`}
      style={{ "--aura": typeAura(entry.types[0]) } as CSSProperties}
      className="aura-card group relative flex flex-col overflow-hidden rounded-lg border bg-gradient-to-b from-[#0a101d] to-[#050810] p-3 motion-safe:hover:-translate-y-0.5 [content-visibility:auto] [contain-intrinsic-size:auto_230px]"
    >
      {/* Targeting reticle + scan beam, revealed while hovering the entry */}
      <span
        aria-hidden
        className="hud-corners pointer-events-none absolute inset-1.5 z-10 opacity-0 transition-opacity duration-300 group-hover:opacity-100"
      />
      <span aria-hidden className="scan-beam z-10" />

      <div className="flex items-center justify-between text-slate-400">
        <span className="font-pixel text-[11px] transition-colors group-hover:text-[var(--aura)]">
          {formatDexNumber(entry.id)}
        </span>
        <span className="rounded border border-slate-700/80 px-1.5 py-0.5 font-mono text-xs tracking-wider text-slate-300 uppercase">
          {generationLabel(entry.generation)}
        </span>
      </div>
      <div className="aura-halo relative mx-auto aspect-square w-full max-w-[130px]">
        <Image
          src={artworkUrl(entry.id)}
          alt={formatName(entry.name)}
          fill
          sizes="(max-width: 640px) 40vw, 130px"
          className="aura-sprite object-contain p-1 transition-transform duration-200 group-hover:scale-[1.06]"
        />
      </div>
      <p className="truncate text-base font-semibold tracking-tight text-slate-100 transition-colors group-hover:text-white">
        {formatName(entry.name)}
      </p>
      <div className="mt-1.5 flex flex-wrap gap-1">
        {entry.types.map((type) => (
          <TypeBadge key={type} type={type} />
        ))}
      </div>
    </Link>
  );
}
