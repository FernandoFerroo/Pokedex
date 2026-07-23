/**
 * Pokémon del día: selección determinista a partir de la fecha, de modo que
 * cambia a las 00:00 (hora peninsular española) y es la misma para todos los
 * usuarios y servidores durante ese día.
 */

/** Species in the National Dex (Gen I–IX). */
const SPECIES_COUNT = 1025;

/** Today's date as YYYY-MM-DD in Europe/Madrid — flips at local midnight. */
export function dailyDateKey(now: Date = new Date()): string {
  // en-CA formats as YYYY-MM-DD.
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Europe/Madrid",
  }).format(now);
}

/** FNV-1a: tiny, deterministic and well-mixed for short strings. */
export function fnv1a(input: string): number {
  let hash = 0x811c9dc5;
  for (let i = 0; i < input.length; i++) {
    hash ^= input.charCodeAt(i);
    hash = Math.imul(hash, 0x01000193) >>> 0;
  }
  return hash >>> 0;
}

/** National Dex id (1-based) featured on the given date key. */
export function dailyDexId(dateKey: string): number {
  return (fnv1a(dateKey) % SPECIES_COUNT) + 1;
}
