"use client";

import {
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
} from "lucide-react";
import type { CSSProperties } from "react";
import type { PoolCard } from "@/types/tcg";
import { SHEET_SIZES, type SheetSize } from "@/hooks/use-album-filters";
import { useT } from "@/lib/i18n/client";
import { cn } from "@/lib/utils";
import { AlbumSleeve, type SleeveEntry } from "./AlbumSleeve";

export interface BinderSlot {
  entry: SleeveEntry;
  /** La carta que enseña la funda, o `null` si aún está vacía. */
  card: PoolCard | null;
}

/**
 * El archivador, hoja a hoja.
 *
 * Mil fundas en una sola tira no son un álbum: son una lista. Paginar de nueve
 * en nueve —la lámina de toda la vida— devuelve el gesto de pasar página, y de
 * paso deja que cada funda ocupe lo que ocupa una carta de verdad en lugar de
 * los cincuenta píxeles a los que obligaba pintarlas todas.
 *
 * La hoja se rellena con bolsillos vacíos hasta el final: una lámina de
 * plástico tiene nueve huecos aunque sólo lleve cuatro cartas, y sin ellos la
 * última página se quedaría descuadrada.
 */
export function AlbumBinder({
  slots,
  page,
  pageCount,
  size,
  onPage,
  onSize,
  onZoom,
}: {
  /** Las fundas de ESTA hoja, ya recortadas. */
  slots: BinderSlot[];
  /** Hoja abierta, empezando en 1 y ya dentro de rango. */
  page: number;
  pageCount: number;
  size: SheetSize;
  onPage: (page: number) => void;
  onSize: (size: SheetSize) => void;
  onZoom: (card: PoolCard) => void;
}) {
  const t = useT().tcg;
  const cols = Math.sqrt(size);
  const empty = Math.max(0, size - slots.length);

  /**
   * En pantalla estrecha la hoja se dobla en menos columnas.
   *
   * Seis en un teléfono dejan cartas de cincuenta píxeles, y una carta del JCC
   * a ese tamaño no es una carta: es un sello. Tres tampoco llegaban —ochenta
   * píxeles en un móvil de 375, con el nombre y el número ilegibles—, así que
   * el teléfono se queda en dos y la tableta pequeña en tres. La hoja SIGUE
   * siendo la misma —dieciséis fundas, hoja 7 de 65 aquí y en el escritorio— y
   * sólo se dobla en más filas, que es justo lo que no puede cambiar con el
   * ancho porque el número de hoja viaja en la URL.
   */
  const narrowCols = Math.min(cols, 2);
  const midCols = Math.min(cols, 3);

  const arrow = (
    to: number,
    label: string,
    Icon: typeof ChevronLeft,
    small?: boolean,
  ) => {
    // Sin `to` alcanzable no hay a dónde ir: es el caso de la hoja 1 con la
    // flecha de atrás, y el de un filtro que ha dejado una sola hoja.
    const disabled = to === page;
    return (
      <button
        type="button"
        onClick={() => onPage(to)}
        disabled={disabled}
        aria-label={label}
        className={cn("binder__arrow", small && "binder__arrow--sm")}
      >
        <Icon size={small ? 16 : 22} aria-hidden />
      </button>
    );
  };

  return (
    // Ancho atado al número de columnas y no fijo: así la carta mide lo mismo
    // en las tres láminas. Con un tope único, la de tres columnas repartía el
    // mismo ancho entre tres cartas y salían del tamaño de un posavasos.
    //
    // El tope por columna es de carta y no de miniatura: a 11,5 rem la funda
    // se quedaba en 160 px —por debajo del escaneo, así que ni siquiera se
    // veía nítida— y el álbum era un muestrario de sellos. A 16,5 rem la carta
    // llega a los 240 y pico, que es a lo que se mira una carta de verdad.
    <div
      className="mx-auto mt-3"
      style={{ maxWidth: `${cols * 16.5}rem` }}
    >
      {/* Las flechas flanquean la hoja también en el móvil: encogen, no se
          bajan debajo. Hojear es el gesto de esta pantalla, y con los botones
          fuera de la vista deja de estar a mano. */}
      <div className="grid grid-cols-[auto_1fr_auto] items-center gap-1 sm:gap-3">
        {arrow(Math.max(1, page - 1), t.prevPage, ChevronLeft)}

        {/* La hoja se vuelve a montar al cambiar de página para que el pase
            se anime desde el principio; sin la clave, React reutilizaría los
            mismos nodos y no habría gesto ninguno. */}
        <section
          key={page}
          aria-label={t.sheetAria(page, pageCount)}
          className="binder-sheet"
        >
          <ol
            className="binder-sheet__grid"
            style={
              {
                "--cols": cols,
                "--cols-narrow": narrowCols,
                "--cols-mid": midCols,
              } as CSSProperties
            }
          >
            {slots.map(({ entry, card }) => (
              <li key={entry.id}>
                <AlbumSleeve entry={entry} card={card} onZoom={onZoom} />
              </li>
            ))}
            {Array.from({ length: empty }, (_, i) => (
              <li key={`empty-${i}`} aria-hidden className="binder-pocket" />
            ))}
          </ol>
        </section>

        {arrow(Math.min(pageCount, page + 1), t.nextPage, ChevronRight)}
      </div>

      <div className="mt-3 flex flex-wrap items-center justify-center gap-x-3 gap-y-2">
        <div className="flex items-center gap-1.5">
          {arrow(1, `${t.prevPage} · 1`, ChevronsLeft, true)}
          <p role="status" className="binder__page">
            {t.pageLabel(page, pageCount)}
          </p>
          {arrow(pageCount, `${t.nextPage} · ${pageCount}`, ChevronsRight, true)}
        </div>

        <div
          role="group"
          aria-label={t.sheetSizeLabel}
          className="binder__sizes"
        >
          {SHEET_SIZES.map((option) => {
            const side = Math.sqrt(option);
            return (
              <button
                key={option}
                type="button"
                onClick={() => onSize(option)}
                aria-pressed={size === option}
                className="binder__size"
              >
                {side}×{side}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
