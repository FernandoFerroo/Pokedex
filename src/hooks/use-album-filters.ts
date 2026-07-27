"use client";

import {
  parseAsInteger,
  parseAsNumberLiteral,
  parseAsString,
  parseAsStringLiteral,
  useQueryStates,
} from "nuqs";
import { RARITY_ORDER } from "@/types/tcg";

/** Las tres vistas de `/album`. Comprar y abrir es el mismo bucle, así que la
 *  tienda es una vista y no una ruta: una navegación entre medias lo rompe. */
export const ALBUM_VIEWS = ["album", "packs", "shop"] as const;
export type AlbumView = (typeof ALBUM_VIEWS)[number];

const OWNERSHIP = ["owned", "missing"] as const;
export type Ownership = (typeof OWNERSHIP)[number];

/**
 * Fundas por hoja del archivador: la lámina de nueve de toda la vida, la de
 * dieciséis y la de treinta y seis. Nada más — el número de hoja va en la URL,
 * y dejarlo libre haría que «hoja 40» apuntase a un sitio distinto según con
 * qué lámina se abriera.
 *
 * Los tres son cuadrados perfectos porque la hoja se pinta como tal: la raíz
 * cuadrada del tamaño ES el número de columnas.
 */
export const SHEET_SIZES = [9, 16, 36] as const;
export type SheetSize = (typeof SHEET_SIZES)[number];

/**
 * De salida, la lámina de dieciséis.
 *
 * Es el punto medio de las tres: con mil especies, la de nueve son ciento
 * catorce hojas —pasarlas todas es más trabajo que mirarlas— y la de treinta y
 * seis reparte el ancho entre seis columnas, que es justo lo que dejaba la
 * carta del tamaño de un sello. A cuatro por cuatro el álbum cabe en sesenta y
 * cinco hojas y la funda mide lo que mide una carta en la mano, que es a lo que
 * se viene. Las otras dos siguen a un clic.
 */
export const DEFAULT_SHEET: SheetSize = 16;

/**
 * Los filtros del álbum, en la URL.
 *
 * En la URL y no en estado local por la misma razón que en la Pokédex: «lo que
 * me falta de Gen V tipo fuego» es exactamente el enlace que alguien comparte
 * o guarda, y ampliar una carta no puede perder el filtro al volver atrás.
 *
 * No se reutiliza `useFilters`: arrastra catorce parámetros, una ordenación
 * atada a la rejilla de la Pokédex y una semántica de exclusión que aquí no
 * significa nada — y chocaría en `?gen=` y `?type=`.
 */
export function useAlbumFilters() {
  return useQueryStates(
    {
      view: parseAsStringLiteral(ALBUM_VIEWS).withDefault("album"),
      q: parseAsString.withDefault(""),
      gen: parseAsInteger,
      type: parseAsString,
      rarity: parseAsStringLiteral(RARITY_ORDER),
      /** Sin valor: el álbum entero. */
      owned: parseAsStringLiteral(OWNERSHIP),
      /** Hoja abierta, empezando en 1. Se recorta al pintar, no al escribir:
       *  quitar un filtro puede dejar fuera de rango una hoja perfectamente
       *  válida, y devolver a la 1 a quien sólo cambió de lámina molesta. */
      page: parseAsInteger.withDefault(1),
      sheet: parseAsNumberLiteral(SHEET_SIZES).withDefault(DEFAULT_SHEET),
    },
    { history: "replace" },
  );
}
