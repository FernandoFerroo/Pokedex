"use client";

import Image from "next/image";
import { memo, type CSSProperties } from "react";
import type { PoolCard } from "@/types/tcg";
import { formatDexNumber, formatName, spriteUrl, typeAura } from "@/lib/pokemon-meta";
import { RARITY_EDGE } from "@/lib/tcg/style";
import { useT } from "@/lib/i18n/client";
import { cn } from "@/lib/utils";
import { CardBack, TcgCardFace } from "./TcgCardFace";

export interface SleeveEntry {
  id: number;
  name: string;
  types: string[];
}

interface AlbumSleeveProps {
  entry: SleeveEntry;
  /** La mejor carta conseguida de esa especie, o `null` si no hay ninguna. */
  card: PoolCard | null;
  onZoom: (card: PoolCard) => void;
}

/**
 * Una funda del archivador.
 *
 * Vacía es DOM casi vacío a propósito: dorso, silueta y numeración, sin montar
 * la carta completa que nadie va a ver. Ya no hace falta además el
 * `content-visibility` que llevaba: desde que el álbum se hojea, en pantalla
 * hay dieciséis fundas como mucho y no mil, y saltarse el pintado de lo que
 * cabe de sobra en la ventana sólo costaba reservar alto a ojo.
 */
export const AlbumSleeve = memo(function AlbumSleeve({
  entry,
  card,
  onZoom,
}: AlbumSleeveProps) {
  const t = useT().tcg;
  const dex = formatDexNumber(entry.id);

  if (!card) {
    return (
      <div
        className="tcg-sleeve tcg-sleeve--locked relative flex aspect-63/88 w-full flex-col items-center justify-center gap-1 overflow-hidden rounded-lg border"
        // Pizarra neutra y NO el aura del tipo: un halo rojo delataría que es
        // de fuego, y la sorpresa es justo lo que el álbum vende.
        style={{ "--edge": "#64748b" } as CSSProperties}
      >
        {/* El dorso de la carta, debajo de la silueta: la funda no está vacía,
            está ocupada por una carta boca abajo. Es lo que convierte el hueco
            en una promesa en vez de en un agujero.

            El mismo dorso que enseña el sobre antes de girar cada carta, y muy
            bajado de intensidad: aquí es la textura sobre la que se lee la
            silueta, no la lámina que se está a punto de girar. */}
        <span aria-hidden className="sleeve-back">
          <CardBack />
        </span>
        <Image
          src={spriteUrl(entry.id)}
          alt=""
          aria-hidden
          width={96}
          height={96}
          unoptimized
          className="mystery-sil relative h-[52%] w-auto object-contain [image-rendering:pixelated]"
        />
        <span className="relative font-pixel text-[9px] text-slate-400">
          {dex}
        </span>
        <span className="relative font-mono text-[11px] text-slate-500">
          {t.unknownName}
        </span>
        <span className="sr-only">{t.lockedAria(dex)}</span>
      </div>
    );
  }

  return (
    <button
      type="button"
      onClick={() => onZoom(card)}
      aria-label={t.slotAria(dex, formatName(entry.name), t.rarityName[card.rarity])}
      className={cn(
        "tcg-sleeve tcg-sleeve--filled group relative block w-full cursor-zoom-in overflow-hidden rounded-lg border",
        "focus-visible:ring-2 focus-visible:ring-cyan-300 focus-visible:outline-none",
        "motion-safe:transition-transform motion-safe:hover:-translate-y-0.5",
      )}
      // Dos colores y no uno: el aura del tipo tiñe el reflejo del plástico,
      // y el canto de la funda se enciende del color del NIVEL de la carta —
      // que es lo que se viene a mirar cuando se barre una hoja entera.
      style={
        {
          "--aura": typeAura(entry.types[0]),
          "--edge": RARITY_EDGE[card.rarity],
        } as CSSProperties
      }
    >
      {/* En estático: sin inclinación, sin destello y sin arcoíris animado.
          Sesenta degradados al 300 % moviéndose a la vez tiran los fotogramas. */}
      {/* El escaneo grande, aunque sea una funda: el pequeño mide 245 px de
          ancho y la funda ya pasa de eso —el doble en una pantalla retina—,
          así que con el chico la carta del álbum salía interpolada. Lo que
          viaja no es el archivo de 600 px sino el recorte que pide `sizes`,
          que es el mismo peso de antes a cambio de que se vea nítida. */}
      <TcgCardFace
        card={card}
        high
        aura={typeAura(entry.types[0])}
        sizes="(max-width: 640px) 32vw, (max-width: 1024px) 26vw, 260px"
        className="w-full"
      />
      <span className="absolute bottom-0 left-0 z-10 rounded-tr-md bg-slate-950/80 px-1 py-0.5 font-pixel text-[7px] text-slate-400">
        {dex}
      </span>
      {/* El nivel, en color y del tamaño de un alfiler. La carta ya lo dice con
          su canto y su foil, pero a tres columnas en un móvil ese acabado se
          queda en un reflejo; el punto es lo que deja barrer la rejilla y ver
          de un vistazo qué escalón ocupa cada funda. El lector de pantalla ya
          lo lleva en el nombre del botón. */}
      <span
        aria-hidden
        className="absolute top-1 right-1 z-10 size-1.5 rounded-full ring-1 ring-slate-950/70"
        style={{ background: RARITY_EDGE[card.rarity] }}
      />
    </button>
  );
});
