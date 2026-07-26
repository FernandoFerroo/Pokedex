import type { Lang } from "@/lib/i18n/config";
import type { PokemonIndexEntry, PokemonSort } from "@/types/pokemon";

export const SORT_OPTIONS = [
  "id-asc",
  "id-desc",
  "name-asc",
  "name-desc",
] as const;

export const SORT_LABELS_ES: Record<PokemonSort, string> = {
  "id-asc": "Número: menor a mayor",
  "id-desc": "Número: mayor a menor",
  "name-asc": "Nombre: A → Z",
  "name-desc": "Nombre: Z → A",
};

export const SORT_LABELS_EN: Record<PokemonSort, string> = {
  "id-asc": "Number: low to high",
  "id-desc": "Number: high to low",
  "name-asc": "Name: A → Z",
  "name-desc": "Name: Z → A",
};

export const SORT_LABELS_FR: Record<PokemonSort, string> = {
  "id-asc": "Numéro : croissant",
  "id-desc": "Numéro : décroissant",
  "name-asc": "Nom : A → Z",
  "name-desc": "Nom : Z → A",
};

export const SORT_LABELS_DE: Record<PokemonSort, string> = {
  "id-asc": "Nummer: aufsteigend",
  "id-desc": "Nummer: absteigend",
  "name-asc": "Name: A → Z",
  "name-desc": "Name: Z → A",
};

export const SORT_LABELS_IT: Record<PokemonSort, string> = {
  "id-asc": "Numero: crescente",
  "id-desc": "Numero: decrescente",
  "name-asc": "Nome: A → Z",
  "name-desc": "Nome: Z → A",
};

export const SORT_LABELS_JA: Record<PokemonSort, string> = {
  "id-asc": "番号：小さい順",
  "id-desc": "番号：大きい順",
  "name-asc": "名前：昇順",
  "name-desc": "名前：降順",
};

export const SORT_LABELS_KO: Record<PokemonSort, string> = {
  "id-asc": "번호: 낮은 순",
  "id-desc": "번호: 높은 순",
  "name-asc": "이름: 오름차순",
  "name-desc": "이름: 내림차순",
};

export const SORT_LABELS_ZH_HANS: Record<PokemonSort, string> = {
  "id-asc": "编号：从低到高",
  "id-desc": "编号：从高到低",
  "name-asc": "名称：升序",
  "name-desc": "名称：降序",
};

export const SORT_LABELS_ZH_HANT: Record<PokemonSort, string> = {
  "id-asc": "編號：由低到高",
  "id-desc": "編號：由高到低",
  "name-asc": "名稱：遞增",
  "name-desc": "名稱：遞減",
};

/** Per-language sort labels; same shape as the label maps in pokemon-meta. */
export const SORT_LABELS: Record<Lang, Record<PokemonSort, string>> = {
  es: SORT_LABELS_ES,
  en: SORT_LABELS_EN,
  fr: SORT_LABELS_FR,
  de: SORT_LABELS_DE,
  it: SORT_LABELS_IT,
  ja: SORT_LABELS_JA,
  ko: SORT_LABELS_KO,
  "zh-Hans": SORT_LABELS_ZH_HANS,
  "zh-Hant": SORT_LABELS_ZH_HANT,
};

/**
 * Pure sort over filtered results. The index is already ordered by dex id,
 * so `id-asc` (the default, and generation order too) is the identity.
 */
export function sortPokemon(
  entries: PokemonIndexEntry[],
  sort: PokemonSort,
): PokemonIndexEntry[] {
  switch (sort) {
    case "id-asc":
      return entries;
    case "id-desc":
      return [...entries].reverse();
    case "name-asc":
      return [...entries].sort((a, b) => a.name.localeCompare(b.name, "es"));
    case "name-desc":
      return [...entries].sort((a, b) => b.name.localeCompare(a.name, "es"));
  }
}
