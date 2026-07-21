"use client";

import { Search, X } from "lucide-react";
import { generationLabel, TYPE_LABELS_ES } from "@/lib/pokemon-meta";
import { SORT_LABELS_ES, SORT_OPTIONS } from "@/lib/sort";
import type { PokemonSort } from "@/types/pokemon";

const GENERATIONS = [1, 2, 3, 4, 5, 6, 7, 8, 9];

export interface FilterValues {
  q: string;
  type: string | null;
  gen: number | null;
  sort: PokemonSort;
}

interface FilterBarProps {
  values: FilterValues;
  /** Set a field to `null` to clear it (removes the param from the URL). */
  onChange: (patch: {
    q?: string | null;
    type?: string | null;
    gen?: number | null;
    sort?: PokemonSort | null;
  }) => void;
}

const controlClasses =
  "h-10 rounded-lg border border-slate-200 bg-white px-3 text-sm shadow-sm outline-none transition focus:border-slate-400 focus:ring-2 focus:ring-slate-200 dark:border-slate-700 dark:bg-slate-900 dark:focus:border-slate-500 dark:focus:ring-slate-800";

export function FilterBar({ values, onChange }: FilterBarProps) {
  const hasActiveFilters =
    values.q !== "" ||
    values.type !== null ||
    values.gen !== null ||
    values.sort !== "id-asc";

  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
      <label className="relative flex-1">
        <Search
          size={16}
          className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-slate-400"
        />
        <input
          type="search"
          value={values.q}
          onChange={(e) => onChange({ q: e.target.value || null })}
          placeholder="Buscar por nombre o cadena evolutiva (ej. pikachu)…"
          aria-label="Buscar Pokémon por nombre o cadena evolutiva"
          className={`${controlClasses} w-full pl-9`}
        />
      </label>

      <select
        value={values.type ?? ""}
        onChange={(e) => onChange({ type: e.target.value || null })}
        aria-label="Filtrar por tipo"
        className={controlClasses}
      >
        <option value="">Todos los tipos</option>
        {Object.entries(TYPE_LABELS_ES).map(([slug, label]) => (
          <option key={slug} value={slug}>
            {label}
          </option>
        ))}
      </select>

      <select
        value={values.gen ?? ""}
        onChange={(e) =>
          onChange({ gen: e.target.value ? Number(e.target.value) : null })
        }
        aria-label="Filtrar por generación"
        className={controlClasses}
      >
        <option value="">Todas las generaciones</option>
        {GENERATIONS.map((gen) => (
          <option key={gen} value={gen}>
            {generationLabel(gen)}
          </option>
        ))}
      </select>

      <select
        value={values.sort}
        onChange={(e) => onChange({ sort: e.target.value as PokemonSort })}
        aria-label="Ordenar resultados"
        className={controlClasses}
      >
        {SORT_OPTIONS.map((sort) => (
          <option key={sort} value={sort}>
            {SORT_LABELS_ES[sort]}
          </option>
        ))}
      </select>

      {hasActiveFilters && (
        <button
          type="button"
          onClick={() => onChange({ q: null, type: null, gen: null, sort: null })}
          className="inline-flex h-10 items-center gap-1.5 rounded-lg px-3 text-sm text-slate-500 transition hover:bg-slate-100 hover:text-slate-900 dark:hover:bg-slate-800 dark:hover:text-slate-100"
        >
          <X size={14} />
          Limpiar
        </button>
      )}
    </div>
  );
}
