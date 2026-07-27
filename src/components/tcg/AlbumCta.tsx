"use client";

import Link from "next/link";
import { ArrowRight, Layers, PackageOpen, Sparkles } from "lucide-react";
import { useT } from "@/lib/i18n/client";
import { useTcg } from "@/components/tcg/TcgProvider";
// De `totals` y NO de `pool`: este banner vive en la portada, y `pool.ts`
// importa el catálogo entero. Aquí sólo hace falta el denominador.
import { ALBUM_SIZE } from "@/lib/tcg/totals";

/**
 * Banner de la portada del modo colección: el quinto nivel exclusivo, con el
 * mismo marco fundido, el mismo barrido de luz y la misma composición que sus
 * hermanos, vestido de platino — oro, jade, brasa y azul ya estaban cogidos, y
 * el blanco es el que mejor lleva el troquelado de una carta rara.
 *
 * Antes llevaba el marco dorado del torneo con el interior en violeta, que es
 * lo único que rompía la familia de cinco: dos niveles con el mismo filo.
 *
 * Los acentos no son colores literales sino `--ice` (y `--ice-on` para el texto
 * sobre un relleno macizo de ese acento), que `.mythic-frame` define y el tema
 * claro invierte: el blanco es el único nivel que sobre papel desaparecería.
 *
 * La ficha de «sobres sin abrir» es el gancho más fuerte de vuelta al modo, y
 * por eso va la primera.
 */
export function AlbumCta() {
  const t = useT().tcg;
  const { collection, hydrated, packsWaiting } = useTcg();

  return (
    <Link
      href="/album"
      aria-label={t.ctaAria(collection.speciesOwned, ALBUM_SIZE)}
      className="group mythic-frame mythic-sweep relative grid w-full grid-cols-[1fr_auto] items-center gap-x-4 gap-y-3.5 overflow-hidden rounded-xl px-3 py-2.5 transition max-sm:min-h-[46px] max-sm:gap-x-2 max-sm:px-2 max-sm:py-1.5 lg:grid-cols-[1fr_auto_1fr] sm:gap-5 sm:px-6 sm:py-5"
    >
      {/* Izquierda: identidad */}
      <span className="flex w-full min-w-0 items-center gap-2.5 justify-self-start text-left sm:gap-3.5">
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-[color-mix(in_srgb,var(--ice)_50%,transparent)] bg-gradient-to-b from-[color-mix(in_srgb,var(--ice)_25%,transparent)] to-[color-mix(in_srgb,var(--ice)_5%,transparent)] text-[var(--ice)] shadow-[0_0_14px_-4px_color-mix(in_srgb,var(--ice)_80%,transparent)] max-sm:h-7 max-sm:w-7 sm:h-12 sm:w-12">
          <Layers size={23} className="max-sm:h-[17px] max-sm:w-[17px]" />
        </span>
        <span className="flex min-w-0 flex-col gap-0.5">
          <span className="flex items-center gap-2 font-display text-base font-bold tracking-wide whitespace-nowrap max-sm:whitespace-normal max-sm:text-[12px] max-sm:leading-[1.15] sm:gap-2.5 sm:text-lg">
            <span className="mythic-text truncate max-sm:overflow-visible max-sm:whitespace-normal">
              {t.ctaTitle}
            </span>
            <span className="rounded-sm border border-[color-mix(in_srgb,var(--ice)_60%,transparent)] bg-[color-mix(in_srgb,var(--ice)_15%,transparent)] px-2 py-0.5 font-mono text-[11px] font-bold tracking-[0.2em] text-[var(--ice)] max-sm:hidden">
              {t.ctaBadge}
            </span>
            {/* Sólo tras hidratar: el conteo sale de localStorage, así que
                antes la ficha sencillamente no está. */}
            {hydrated && packsWaiting > 0 && (
              <span className="inline-flex items-center gap-1 rounded-sm bg-[var(--ice)] px-2 py-0.5 font-mono text-[11px] font-bold tracking-[0.1em] text-[var(--ice-on)] max-sm:hidden">
                <PackageOpen size={11} />
                {t.ctaPacks(packsWaiting)}
              </span>
            )}
          </span>
          <span className="cta-tagline hidden font-mono text-sm tracking-widest whitespace-nowrap text-[color-mix(in_srgb,var(--ice)_55%,transparent)] uppercase md:block">
            {t.ctaTagline}
          </span>
        </span>
      </span>

      {/* Centro: cinco dorsos y la carta brillante, el mismo compás de seis
          ranuras que sus hermanos. */}
      <span aria-hidden className="hidden items-center gap-1.5 lg:flex lg:gap-2">
        {Array.from({ length: 5 }, (_, i) => (
          <span
            key={i}
            className="h-12 w-9 rounded-md border border-dashed border-[color-mix(in_srgb,var(--ice)_25%,transparent)] bg-black/40 transition group-hover:border-[color-mix(in_srgb,var(--ice)_50%,transparent)]"
          />
        ))}
        <span className="flex h-12 w-9 items-center justify-center rounded-md border border-[color-mix(in_srgb,var(--ice)_60%,transparent)] bg-[color-mix(in_srgb,var(--ice)_10%,transparent)] text-[var(--ice)] transition group-hover:border-[var(--ice)]">
          <Sparkles size={16} />
        </span>
      </span>

      {/* Derecha: progreso y la llamada. */}
      <span className="relative z-[32] flex items-center gap-3 justify-self-end max-sm:gap-1.5">
        <span className="inline-flex items-center gap-2 rounded-md border border-[color-mix(in_srgb,var(--ice)_40%,transparent)] bg-black/30 px-3 py-2.5 font-mono text-sm font-bold tracking-wider text-[color-mix(in_srgb,var(--ice)_80%,transparent)] uppercase max-sm:hidden sm:px-4">
          {hydrated
            ? t.ctaProgress(collection.speciesOwned, ALBUM_SIZE)
            : `— / ${ALBUM_SIZE}`}
        </span>
        {/* El chip macizo es el que más se aleja de sus hermanos: en oscuro es
            blanco puro con tinta encima, no un degradado de color sobre blanco.
            Es a propósito — sobre negro, el blanco macizo ES el lujo. */}
        <span className="inline-flex items-center gap-2 rounded-md bg-gradient-to-b from-[var(--ice)] to-[color-mix(in_srgb,var(--ice)_75%,#94a3b8)] px-3 py-2 font-mono text-sm font-bold tracking-wider text-[var(--ice-on)] uppercase shadow-[0_0_18px_-4px_color-mix(in_srgb,var(--ice)_80%,transparent)] transition group-hover:to-[var(--ice)] group-hover:shadow-[0_0_24px_color-mix(in_srgb,var(--ice)_55%,transparent)] sm:px-5 sm:py-2.5">
          {t.ctaOpen}
          <ArrowRight
            size={15}
            className="transition-transform group-hover:translate-x-0.5"
          />
        </span>
      </span>
    </Link>
  );
}
