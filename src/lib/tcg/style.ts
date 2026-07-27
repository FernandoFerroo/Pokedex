/**
 * Los colores del modo colección, en un solo sitio.
 *
 * El torneo aprendió por las malas que repartir el color de cada copa entre
 * tres archivos acaba en tres tonos que dejan de parecerse; aquí el acento de
 * cada sobre y de cada nivel vive una única vez.
 */
import { RARITY_ORDER, type PackType, type Rarity } from "@/types/tcg";

/**
 * Acento de cada sobre.
 *
 * Lo manda la MASCOTA, no la copa que lo paga. Un sobre con Pikachu impreso y
 * el canto verde es un sobre que se contradice a sí mismo: el color es lo
 * primero que se ve de la fila de la tienda y tiene que decir de qué va el
 * envoltorio —amarillo eléctrico, esmeralda de dragón, oro y púrpura de
 * legendario, cian psíquico— antes de que nadie lea un nombre.
 */
export const PACK_EDGE: Record<PackType, string> = {
  bolt: "#facc15",
  elite: "#10b981",
  master: "#a855f7",
  special: "#22d3ee",
  god: "#f472b6",
};

/**
 * La portada de cada sobre.
 *
 * Un sobre del JCC no es una pastilla de color: es una lámina metalizada con
 * un Pokémon estelar impreso, un fondo de rayos detrás y una banda de rasgado
 * arriba. Aquí vive esa identidad — el tono profundo del envoltorio y el
 * Pokémon que lo protagoniza—, y `PackArt` la pinta. La mascota sólo tiene que
 * pegar con el color y el rango del sobre: desde que los sobres reparten las
 * nueve generaciones, cualquier Pokémon puede salir de cualquiera de ellos.
 */
export const PACK_ART: Record<
  PackType,
  { deep: string; glint: string; mascot: number }
> = {
  bolt: { deep: "#3f2d02", glint: "#fef08a", mascot: 25 },
  elite: { deep: "#03251a", glint: "#6ee7b7", mascot: 384 },
  // El único con dos metales: púrpura de fondo y oro en el destello, que es lo
  // que llevan encima Zacian y Zamazenta.
  master: { deep: "#2e1065", glint: "#fcd34d", mascot: 888 },
  special: { deep: "#1e1b4b", glint: "#a5b4fc", mascot: 150 },
  god: { deep: "#4c0519", glint: "#fbcfe8", mascot: 493 },
};

/** Acento de cada nivel, para insignias, filtros y estallidos. */
export const RARITY_EDGE: Record<Rarity, string> = {
  common: "#94a3b8",
  uncommon: "#cbd5e1",
  holo: "#67e8f9",
  ex: "#fbbf24",
  fullArt: "#e2e8f0",
  hyper: "#c084fc",
};

/** Nivel más alto de una lista. Es el que luce la funda del álbum. */
export function bestRarity(rarities: readonly Rarity[]): Rarity {
  return rarities.reduce(
    (best, rarity) =>
      RARITY_ORDER.indexOf(rarity) > RARITY_ORDER.indexOf(best) ? rarity : best,
    RARITY_ORDER[0],
  );
}
