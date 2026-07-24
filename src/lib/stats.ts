/** Shared stat helpers: labels, BST ranking and real in-game stat ranges. */

export const STAT_LABELS_ES: Record<string, string> = {
  hp: "PS",
  attack: "Ataque",
  defense: "Defensa",
  "special-attack": "At. Esp.",
  "special-defense": "Def. Esp.",
  speed: "Velocidad",
};

/** Qualitative rank for the base stat total, tuned to real BST ranges. */
export function totalRank(total: number): { label: string; className: string } {
  if (total < 300)
    return { label: "Bajo", className: "border-slate-600 text-slate-300" };
  if (total < 450)
    return { label: "Medio", className: "border-yellow-400/50 text-yellow-300" };
  if (total < 540)
    return { label: "Alto", className: "border-emerald-400/50 text-emerald-300" };
  if (total < 600)
    return { label: "Muy alto", className: "border-cyan-400/50 text-cyan-300" };
  return { label: "Élite", className: "border-violet-400/50 text-violet-300" };
}

export interface StatRange {
  min: number;
  max: number;
}

/**
 * Real reachable stat at a given level, main-series formula:
 * floor((2·base + IV + floor(EV/4)) · nivel/100) + 5, ±10% de naturaleza
 * (HP uses +nivel+10 and ignores nature). min = IV 0, EV 0, naturaleza
 * perjudicial; max = IV 31, EV 252, naturaleza favorable.
 */
export function statRange(
  name: string,
  base: number,
  level: 50 | 100,
): StatRange {
  if (name === "hp") {
    // Shedinja: always 1 PS by species rule, the formula does not apply.
    if (base === 1) return { min: 1, max: 1 };
    return {
      min: Math.floor((2 * base * level) / 100) + level + 10,
      max: Math.floor(((2 * base + 31 + 63) * level) / 100) + level + 10,
    };
  }
  return {
    min: Math.floor((Math.floor((2 * base * level) / 100) + 5) * 0.9),
    max: Math.floor((Math.floor(((2 * base + 31 + 63) * level) / 100) + 5) * 1.1),
  };
}
