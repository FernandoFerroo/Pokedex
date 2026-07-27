/**
 * Qué cartas tiene el jugador, en una cadena.
 *
 * Guardar `{ "base1-4": true, … }` para una colección completa serían cientos
 * de kilobytes reescritos en cada tirada. Aquí cada carta del catálogo es un
 * bit y cada seis bits un carácter de base64url: la colección entera cabe en
 * mil doscientos setenta caracteres, y sin una sola comilla que escapar al
 * meterla en JSON.
 *
 * La máscara **crece sola**: nace vacía y se alarga cuando hace falta marcar
 * una carta que cae más allá de su final. Eso es lo que permite que el
 * almacenamiento y el provider no sepan cuántas cartas tiene el catálogo, y
 * por tanto que `pool.json` no acabe en el paquete de todas las páginas — sólo
 * lo carga el álbum, que es quien de verdad lo necesita.
 */

/** base64url: los 64 caracteres son seguros en JSON, en URL y en una cookie. */
const ALPHABET =
  "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_";

const VALUE_OF = new Map<string, number>(
  Array.from(ALPHABET, (char, index) => [char, index]),
);

const BITS = 6;
const ZERO = ALPHABET[0];

/** Una colección recién empezada. */
export const EMPTY_MASK = "";

/** Caracteres que hacen falta para `total` cartas. */
export function maskLength(total: number): number {
  return Math.ceil(total / BITS);
}

export function emptyMask(total = 0): string {
  return ZERO.repeat(maskLength(total));
}

export function hasCard(mask: string, index: number): boolean {
  if (index < 0) return false;
  const value = VALUE_OF.get(mask[Math.floor(index / BITS)] ?? "") ?? 0;
  return (value & (1 << index % BITS)) !== 0;
}

/** Devuelve una máscara nueva con esas cartas marcadas, alargándola si hace falta. */
export function withCards(mask: string, indices: Iterable<number>): string {
  const wanted = Array.from(indices).filter((index) => index >= 0);
  if (wanted.length === 0) return mask;
  const needed = Math.max(...wanted.map((index) => Math.floor(index / BITS) + 1));
  const chars = mask.padEnd(Math.max(mask.length, needed), ZERO).split("");
  for (const index of wanted) {
    const slot = Math.floor(index / BITS);
    const value = VALUE_OF.get(chars[slot]) ?? 0;
    chars[slot] = ALPHABET[value | (1 << index % BITS)];
  }
  return chars.join("");
}

/** Cuántas cartas hay marcadas en total. */
export function countCards(mask: string): number {
  let total = 0;
  for (const char of mask) {
    let value = VALUE_OF.get(char) ?? 0;
    while (value) {
      total += value & 1;
      value >>= 1;
    }
  }
  return total;
}

/** Recorre los índices marcados, sin materializar un array de miles. */
export function* ownedIndices(mask: string): Generator<number> {
  for (let slot = 0; slot < mask.length; slot++) {
    const value = VALUE_OF.get(mask[slot]) ?? 0;
    if (!value) continue;
    for (let bit = 0; bit < BITS; bit++) {
      if (value & (1 << bit)) yield slot * BITS + bit;
    }
  }
}

/**
 * Limpia una máscara recién leída del almacenamiento.
 *
 * Sólo valida caracteres, no longitud: una máscara corta es una colección
 * pequeña, y una más larga de lo que pide el catálogo actual son cartas de una
 * expansión que ya no está — se conservan, por si vuelve, en vez de tirarlas.
 */
export function normalizeMask(value: unknown): string {
  if (typeof value !== "string") return EMPTY_MASK;
  return Array.from(value, (char) => (VALUE_OF.has(char) ? char : ZERO)).join("");
}
