/** Shared stat helpers: labels, BST ranking and real in-game stat ranges. */

import { DEFAULT_LANG, type Lang } from "@/lib/i18n/config";

export const STAT_LABELS_ES: Record<string, string> = {
  hp: "PS",
  attack: "Ataque",
  defense: "Defensa",
  "special-attack": "At. Esp.",
  "special-defense": "Def. Esp.",
  speed: "Velocidad",
};

export const STAT_LABELS_EN: Record<string, string> = {
  hp: "HP",
  attack: "Attack",
  defense: "Defense",
  "special-attack": "Sp. Atk",
  "special-defense": "Sp. Def",
  speed: "Speed",
};

export const STAT_LABELS_FR: Record<string, string> = {
  hp: "PV",
  attack: "Attaque",
  defense: "Défense",
  "special-attack": "Atq. Spé.",
  "special-defense": "Déf. Spé.",
  speed: "Vitesse",
};

export const STAT_LABELS_DE: Record<string, string> = {
  hp: "KP",
  attack: "Angriff",
  defense: "Verteidigung",
  "special-attack": "Sp.-Ang.",
  "special-defense": "Sp.-Vert.",
  speed: "Initiative",
};

export const STAT_LABELS_IT: Record<string, string> = {
  hp: "PS",
  attack: "Attacco",
  defense: "Difesa",
  "special-attack": "Att. Sp.",
  "special-defense": "Dif. Sp.",
  speed: "Velocità",
};

export const STAT_LABELS_JA: Record<string, string> = {
  hp: "HP",
  attack: "こうげき",
  defense: "ぼうぎょ",
  "special-attack": "とくこう",
  "special-defense": "とくぼう",
  speed: "すばやさ",
};

export const STAT_LABELS_KO: Record<string, string> = {
  hp: "HP",
  attack: "공격",
  defense: "방어",
  "special-attack": "특공",
  "special-defense": "특방",
  speed: "스피드",
};

export const STAT_LABELS_ZH_HANS: Record<string, string> = {
  hp: "HP",
  attack: "攻击",
  defense: "防御",
  "special-attack": "特攻",
  "special-defense": "特防",
  speed: "速度",
};

export const STAT_LABELS_ZH_HANT: Record<string, string> = {
  hp: "HP",
  attack: "攻擊",
  defense: "防禦",
  "special-attack": "特攻",
  "special-defense": "特防",
  speed: "速度",
};

/** Per-language stat labels, official game terminology in each. */
export const STAT_LABELS: Record<Lang, Record<string, string>> = {
  es: STAT_LABELS_ES,
  en: STAT_LABELS_EN,
  fr: STAT_LABELS_FR,
  de: STAT_LABELS_DE,
  it: STAT_LABELS_IT,
  ja: STAT_LABELS_JA,
  ko: STAT_LABELS_KO,
  "zh-Hans": STAT_LABELS_ZH_HANS,
  "zh-Hant": STAT_LABELS_ZH_HANT,
};

export function statLabel(name: string, lang: Lang = DEFAULT_LANG): string {
  return STAT_LABELS[lang][name] ?? name;
}

const RANK_LABELS: Record<Lang, [string, string, string, string, string]> = {
  es: ["Bajo", "Medio", "Alto", "Muy alto", "Élite"],
  en: ["Low", "Medium", "High", "Very high", "Elite"],
  fr: ["Faible", "Moyen", "Élevé", "Très élevé", "Élite"],
  de: ["Niedrig", "Mittel", "Hoch", "Sehr hoch", "Elite"],
  it: ["Basso", "Medio", "Alto", "Molto alto", "Élite"],
  ja: ["低い", "普通", "高い", "非常に高い", "エリート"],
  ko: ["낮음", "보통", "높음", "매우 높음", "엘리트"],
  "zh-Hans": ["低", "中", "高", "很高", "精英"],
  "zh-Hant": ["低", "中", "高", "很高", "菁英"],
};

/** Qualitative rank for the base stat total, tuned to real BST ranges. */
export function totalRank(
  total: number,
  lang: Lang = DEFAULT_LANG,
): { label: string; className: string } {
  const labels = RANK_LABELS[lang];
  if (total < 300)
    return { label: labels[0], className: "border-slate-600 text-slate-300" };
  if (total < 450)
    return { label: labels[1], className: "border-yellow-400/50 text-yellow-300" };
  if (total < 540)
    return { label: labels[2], className: "border-emerald-400/50 text-emerald-300" };
  if (total < 600)
    return { label: labels[3], className: "border-cyan-400/50 text-cyan-300" };
  return { label: labels[4], className: "border-violet-400/50 text-violet-300" };
}

export interface StatRange {
  min: number;
  max: number;
}

export const MIN_LEVEL = 1;
export const MAX_LEVEL = 100;

/** Keeps a typed or dragged level inside the games' 1–100 range. */
export function clampLevel(level: number): number {
  return Math.min(MAX_LEVEL, Math.max(MIN_LEVEL, Math.round(level)));
}

/**
 * Real reachable stat at a given level (1–100), main-series formula:
 * floor((2·base + IV + floor(EV/4)) · nivel/100) + 5, ±10% de naturaleza
 * (HP uses +nivel+10 and ignores nature). min = IV 0, EV 0, naturaleza
 * perjudicial; max = IV 31, EV 252, naturaleza favorable.
 */
export function statRange(
  name: string,
  base: number,
  level: number,
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
