/**
 * Azar del modo colección.
 *
 * Por defecto se tira con `Math.random`, igual que el motor de combate
 * (`lib/battle/engine`), pero todo lo que sortea acepta un generador como
 * parámetro para que `scripts/tcg-odds.mts` pueda repetir exactamente la misma
 * tanda de doscientos mil sobres y comprobar las tablas de probabilidad.
 */

export type Rng = () => number;

/**
 * mulberry32: treinta y dos bits, rápido y con semilla. No es criptografía —
 * ni falta que hace, porque el resultado acaba en el almacenamiento del propio
 * navegador — pero mezcla lo suficiente para una tabla de botín.
 */
export function seeded(seed: number): Rng {
  let state = seed >>> 0;
  return () => {
    state = (state + 0x6d2b79f5) >>> 0;
    let t = state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
