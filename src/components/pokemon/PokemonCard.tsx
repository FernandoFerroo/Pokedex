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
      className="aura-card group flex flex-col rounded-xl border border-slate-200 bg-white p-3 motion-safe:hover:-translate-y-0.5 dark:border-slate-800/70 dark:bg-[#0b1120] [content-visibility:auto] [contain-intrinsic-size:auto_230px]"
    >
      <div className="flex items-center justify-between text-[11px] font-medium tracking-wide text-slate-400 dark:text-slate-500">
        <span className="font-mono">{formatDexNumber(entry.id)}</span>
        <span className="rounded-md border border-slate-200 px-1.5 py-0.5 font-mono text-slate-500 dark:border-slate-700 dark:text-slate-400">
          {generationLabel(entry.generation)}
        </span>
      </div>
      <div className="relative mx-auto aspect-square w-full max-w-[130px]">
        <Image
          src={artworkUrl(entry.id)}
          alt={formatName(entry.name)}
          fill
          sizes="(max-width: 640px) 40vw, 130px"
          className="aura-sprite object-contain p-1 transition-transform duration-200 group-hover:scale-[1.04]"
        />
      </div>
      <p className="truncate text-sm font-semibold tracking-tight">
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
