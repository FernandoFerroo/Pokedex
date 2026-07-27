/**
 * Los hitos del álbum: cada tramo de la colección paga un sobre.
 *
 * Existen porque el álbum es el único modo cuyo progreso no se cobra. El torneo
 * paga por copa, la tienda por PE, y llenar la funda mil no daba nada más que
 * la funda mil — con lo que la parte más larga del juego era la única sin
 * premio. Marcados sobre la barra, además, convierten un «1,5 %» que no dice
 * nada en una siguiente meta concreta.
 *
 * Van por ESPECIES y no por cartas: es lo que cuenta la barra, y es el número
 * que no se puede inflar abriendo sobres del mismo sobre una y otra vez.
 *
 * Módulo aparte, y sin tocar `pool.json`: lo importan la colección (que vive en
 * el layout raíz) y el álbum, y arrastrar el catálogo hasta el provider lo
 * metería en el paquete de todas las páginas.
 */
import type { PackInventory } from "@/types/tcg";
import { ALBUM_SIZE } from "./totals";

export interface Milestone {
  /**
   * Porcentaje entero del álbum. ES la clave que se persiste, así que cambiar
   * uno le regala el hito nuevo a quien ya había cobrado el viejo. Añadir
   * escalones intermedios sí es seguro.
   */
  pct: number;
  /** Especies necesarias para alcanzarlo. */
  species: number;
  /** Lo que se cobra al llegar. */
  packs: PackInventory;
}

/**
 * La escalera, de menor a mayor.
 *
 * El reparto está calibrado contra la tienda —60 PE el Relámpago, 480 el
 * Especial ex— para que cada escalón valga más que el anterior: si al 50 % se
 * pagara menos que al 25 %, seguir coleccionando sería un castigo.
 *
 * El Sobre Divino se reserva para el álbum completo. Es la otra puerta a un
 * premio que la tienda no vende, y las mil especies cuestan bastante más que
 * la Copa Maestra impecable que abre la primera.
 */
export const MILESTONES: readonly Milestone[] = [
  { pct: 10, packs: { elite: 1 } },
  { pct: 25, packs: { special: 1 } },
  { pct: 50, packs: { master: 3 } },
  { pct: 75, packs: { special: 2 } },
  { pct: 100, packs: { god: 1 } },
].map(({ pct, packs }) => ({
  pct,
  // Hacia arriba: al 25 % de 1025 le tocan 257 especies, no 256,25. Con
  // `floor` el hito del 100 % se cobraría antes de llenar el álbum.
  species: Math.ceil((pct / 100) * ALBUM_SIZE),
  packs,
}));

/** Los porcentajes válidos, para descartar basura al leer el almacenamiento. */
export const MILESTONE_PCTS: readonly number[] = MILESTONES.map((m) => m.pct);

/** Hitos alcanzados con esas especies y todavía sin cobrar. */
export function unclaimedMilestones(
  species: number,
  claimed: readonly number[],
): Milestone[] {
  return MILESTONES.filter(
    (milestone) =>
      species >= milestone.species && !claimed.includes(milestone.pct),
  );
}

/** El siguiente hito por alcanzar, o `null` si ya están todos. */
export function nextMilestone(species: number): Milestone | null {
  return MILESTONES.find((milestone) => species < milestone.species) ?? null;
}
