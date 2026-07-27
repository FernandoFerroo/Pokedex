/**
 * Contratos del modo colección: catálogo de cartas del JCC, sobres, álbum y
 * Puntos de Entrenador.
 *
 * Ojo con el vecino: `src/lib/tcgdex.ts` consulta la API del JCC en vivo para
 * la galería de la ficha de cada Pokémon. Aquí NO se llama a nadie — se lee el
 * catálogo estático que `scripts/fetch-tcg-pool.mjs` dejó commiteado.
 */

/**
 * Los seis niveles del álbum, de menor a mayor.
 *
 * El orden importa y no se puede reordenar: el índice es lo que se guarda en
 * `pool.json`, así que mover un nivel cambiaría la rareza de miles de cartas
 * ya coleccionadas. Ampliar por el final sí es seguro.
 */
export const RARITY_ORDER = [
  "common",
  "uncommon",
  "holo",
  "ex",
  "fullArt",
  "hyper",
] as const;
export type Rarity = (typeof RARITY_ORDER)[number];

/** A partir de holo, la carta se lee como premiada: foil, destello y estallido. */
export function isFoil(rarity: Rarity): boolean {
  return RARITY_ORDER.indexOf(rarity) >= RARITY_ORDER.indexOf("holo");
}

/** Los cinco sobres. Los nombres visibles viven en el diccionario. */
export const PACK_TYPES = ["bolt", "elite", "master", "special", "god"] as const;
export type PackType = (typeof PACK_TYPES)[number];

/** Sobres sin abrir. Ausente equivale a cero, igual que la mochila de combate. */
export type PackInventory = Partial<Record<PackType, number>>;

// ---------------------------------------------------------------------------
// Catálogo

/**
 * Una carta tal y como se guarda en `pool.json`, en forma de tupla para que el
 * catálogo no ocupe el triple en disco ni en la carga de la página.
 *
 * `[número de Pokédex, índice de nivel, índice de expansión, hoja, nombre]`
 */
export type PoolCardTuple = [
  dexId: number,
  tier: number,
  set: number,
  leaf: string,
  name: string,
];

export interface CardPoolFile {
  v: number;
  tiers: readonly string[];
  /** Rutas de expansión bajo assets.tcgdex.net, internadas para no repetirlas. */
  sets: readonly string[];
  cards: readonly PoolCardTuple[];
}

/** Una carta ya desempaquetada, lista para pintar. */
export interface PoolCard {
  /** Posición en `pool.cards`. ES el identificador que se persiste. */
  index: number;
  dexId: number;
  rarity: Rarity;
  /** Nombre impreso en la carta: «Charizard ex», «Dark Charizard»… */
  name: string;
  /** Escaneo para rejilla y abanico (~245 px de ancho). */
  imageUrl: string;
  /** Escaneo a tamaño completo para el visor. */
  imageHighUrl: string;
}

// ---------------------------------------------------------------------------
// Apertura

/** Una carta según sale del sobre. No se persiste. */
export interface PulledCard extends PoolCard {
  /** Verdadero si no estaba en la colección antes de abrir este sobre. */
  isNew: boolean;
  /** PE que deja por repetida. Cero cuando es nueva. */
  dust: number;
}

export interface PackResult {
  type: PackType;
  cards: PulledCard[];
  /** PE sumados por las repetidas de este sobre. */
  peGained: number;
  /** Verdadero cuando un sobre normal se ha abierto como Divino. */
  godPack: boolean;
}

// ---------------------------------------------------------------------------
// Puntos de Entrenador

export type PeReason =
  | "round"
  | "title"
  | "flawless"
  | "consolation"
  | "duplicate"
  | "purchase";

export interface PeEntry {
  /** Positivo si se gana, negativo si se gasta. */
  amount: number;
  reason: PeReason;
  /** Milisegundos de época. */
  at: number;
}

/**
 * El historial es un adorno de la tienda, no un libro contable: se corta a
 * treinta entradas. Es la única estructura de la colección que podría crecer
 * sin techo, y quien abra doscientos sobres no quiere doscientas líneas.
 */
export const PE_LEDGER_MAX = 30;

// ---------------------------------------------------------------------------
// Persistencia

export const TCG_SCHEMA = 1;

export interface TcgStats {
  packsOpened: number;
  cardsPulled: number;
  peEarned: number;
  peSpent: number;
}

export interface TcgCollection {
  v: number;
  /**
   * Qué cartas se tienen, en base64url: un carácter por cada seis posiciones
   * de `pool.cards`. Ronda el kilobyte y medio esté vacía o llena, así que
   * reescribirla en cada tirada no cuesta nada.
   */
  owned: string;
  /**
   * Especies distintas conseguidas, y cartas en total.
   *
   * Se llevan aparte a propósito: la home necesita el progreso pero no puede
   * cargar el catálogo entero sólo para contarlo. Quien abre el álbum sí lo
   * tiene, y lo recalcula al entrar por si algún guardado quedó descuadrado.
   */
  speciesOwned: number;
  cardsOwned: number;
  pe: number;
  packs: PackInventory;
  /**
   * Hitos de la colección ya cobrados, por porcentaje (`[10, 25]`).
   *
   * Se guarda lo COBRADO y no lo alcanzado: el porcentaje alcanzado ya sale de
   * `speciesOwned`, y lo que hace falta recordar es a quién se le ha pagado ya
   * el sobre para no pagárselo dos veces.
   */
  milestones: number[];
  stats: TcgStats;
  /** De más nuevo a más viejo, cortado en `PE_LEDGER_MAX`. */
  ledger: PeEntry[];
}
