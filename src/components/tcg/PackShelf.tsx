"use client";

import Link from "next/link";
import { Sparkles } from "lucide-react";
import type { CSSProperties } from "react";
import { PACK_TYPES, type PackInventory, type PackType } from "@/types/tcg";
import { PACK_SIZE } from "@/lib/tcg/pull";
import { PACK_EDGE } from "@/lib/tcg/style";
import { useT } from "@/lib/i18n/client";
import { PackArt } from "./PackArt";

/** Los sobres sin abrir, listos para romper. */
export function PackShelf({
  packs,
  hydrated,
  onOpen,
}: {
  packs: PackInventory;
  /** Falso hasta que la colección se ha leído del almacenamiento. */
  hydrated: boolean;
  onOpen: (type: PackType) => void;
}) {
  const t = useT().tcg;
  const held = PACK_TYPES.filter((type) => (packs[type] ?? 0) > 0);

  // Antes de hidratar el inventario está vacío por definición, y anunciar
  // «no te queda ningún sobre» sería mentir durante un instante a alguien que
  // tiene siete. Se espera en silencio.
  if (!hydrated) {
    return (
      <ul aria-hidden className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
        {Array.from({ length: 3 }, (_, i) => (
          <li
            key={i}
            className="h-44 animate-pulse rounded-xl border border-slate-800/70 bg-hud-1/60"
          />
        ))}
      </ul>
    );
  }

  if (held.length === 0) {
    return (
      <div className="hud-panel mx-auto max-w-md rounded-xl p-6 text-center">
        <Sparkles size={32} className="mx-auto text-slate-500" />
        <h3 className="mt-3 font-display text-base font-bold text-slate-100">
          {t.shelfEmpty}
        </h3>
        <p className="mt-2 text-sm text-slate-400">{t.shelfEmptyBody}</p>
        <Link
          href="/tournament"
          className="glass-btn mt-4 inline-block rounded-full px-4 py-2 font-mono text-xs"
        >
          {t.shelfEmptyCta}
        </Link>
      </div>
    );
  }

  return (
    <>
      <h2 className="text-center font-display text-lg font-bold tracking-wide text-slate-100">
        {t.shelfTitle}
      </h2>
      <p className="text-center text-sm text-slate-400">{t.shelfSubtitle}</p>
      <ul className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
        {held.map((type) => (
          <li key={type}>
            <button
              type="button"
              onClick={() => onOpen(type)}
              // El nombre calculado a partir del contenido saldría como
              // «×3 Sobre Relámpago 5 cartas · Gen I–II», que en un lector de
              // pantalla empieza por el número y no por la acción.
              aria-label={t.openAria(t.packName[type], PACK_SIZE[type])}
              style={{ "--edge": PACK_EDGE[type] } as CSSProperties}
              className="pack-slot group"
            >
              {/* Los sobres repetidos se apilan de verdad: dos siluetas
                  asomando por detrás dicen «tienes tres» mejor que el número,
                  que además se queda. */}
              {(packs[type] ?? 0) > 1 && (
                <span aria-hidden className="pack-slot__pile" data-depth="2" />
              )}
              {(packs[type] ?? 0) > 2 && (
                <span aria-hidden className="pack-slot__pile" data-depth="1" />
              )}
              <span
                className="pack-slot__count"
                style={{
                  color: PACK_EDGE[type],
                  background: `color-mix(in srgb, ${PACK_EDGE[type]} 18%, transparent)`,
                }}
              >
                {t.packCount(packs[type] ?? 0)}
              </span>
              <PackArt type={type} className="pack-slot__art" />
              <span className="pack-slot__cta">{t.openCta}</span>
            </button>
          </li>
        ))}
      </ul>
    </>
  );
}
