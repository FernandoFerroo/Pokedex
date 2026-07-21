"use client";

import { useState } from "react";
import { Search, SlidersHorizontal, X } from "lucide-react";
import {
  CATEGORY_LABELS_ES,
  COLOR_LABELS_ES,
  EGG_GROUP_LABELS_ES,
  generationLabel,
  HABITAT_LABELS_ES,
  SHAPE_LABELS_ES,
  STAGE_LABELS_ES,
  TYPE_LABELS_ES,
} from "@/lib/pokemon-meta";
import { SORT_LABELS_ES, SORT_OPTIONS } from "@/lib/sort";
import type {
  PokemonCategory,
  PokemonSort,
  StageFilter,
} from "@/types/pokemon";

const GENERATIONS = [1, 2, 3, 4, 5, 6, 7, 8, 9];

export interface FilterValues {
  q: string;
  type: string | null;
  gen: number | null;
  sort: PokemonSort;
  color: string | null;
  habitat: string | null;
  shape: string | null;
  egg: string | null;
  cat: PokemonCategory | null;
  stage: StageFilter | null;
}

export interface FilterPatch {
  q?: string | null;
  type?: string | null;
  gen?: number | null;
  sort?: PokemonSort | null;
  color?: string | null;
  habitat?: string | null;
  shape?: string | null;
  egg?: string | null;
  cat?: PokemonCategory | null;
  stage?: StageFilter | null;
}

interface FilterBarProps {
  values: FilterValues;
  /** Set a field to `null` to clear it (removes the param from the URL). */
  onChange: (patch: FilterPatch) => void;
}

const CLEAR_ALL: FilterPatch = {
  q: null,
  type: null,
  gen: null,
  sort: null,
  color: null,
  habitat: null,
  shape: null,
  egg: null,
  cat: null,
  stage: null,
};

const controlClasses =
  "h-10 rounded-lg border border-slate-200 bg-white px-3 text-sm shadow-sm outline-none transition focus:border-slate-400 focus:ring-2 focus:ring-slate-200 dark:border-slate-700 dark:bg-[#0b1120] dark:focus:border-slate-500 dark:focus:ring-slate-800";

/** Placeholder + labels -> a themed <select> bound to one filter field. */
function FilterSelect({
  value,
  placeholder,
  labels,
  ariaLabel,
  onSelect,
}: {
  value: string | null;
  placeholder: string;
  labels: Record<string, string>;
  ariaLabel: string;
  onSelect: (value: string | null) => void;
}) {
  return (
    <select
      value={value ?? ""}
      onChange={(e) => onSelect(e.target.value || null)}
      aria-label={ariaLabel}
      className={controlClasses}
    >
      <option value="">{placeholder}</option>
      {Object.entries(labels).map(([slug, label]) => (
        <option key={slug} value={slug}>
          {label}
        </option>
      ))}
    </select>
  );
}

export function FilterBar({ values, onChange }: FilterBarProps) {
  const advancedCount = [
    values.color,
    values.habitat,
    values.shape,
    values.egg,
    values.cat,
    values.stage,
  ].filter((v) => v !== null).length;

  // Open by default when the URL arrives with an advanced filter active.
  const [showAdvanced, setShowAdvanced] = useState(advancedCount > 0);

  const hasActiveFilters =
    values.q !== "" ||
    values.type !== null ||
    values.gen !== null ||
    values.sort !== "id-asc" ||
    advancedCount > 0;

  return (
    <div className="flex flex-col gap-3">
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

        <FilterSelect
          value={values.type}
          placeholder="Todos los tipos"
          labels={TYPE_LABELS_ES}
          ariaLabel="Filtrar por tipo"
          onSelect={(type) => onChange({ type })}
        />

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

        <button
          type="button"
          onClick={() => setShowAdvanced((open) => !open)}
          aria-expanded={showAdvanced}
          className="inline-flex h-10 items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 text-sm shadow-sm transition hover:bg-slate-100 dark:border-slate-700 dark:bg-[#0b1120] dark:hover:bg-slate-800"
        >
          <SlidersHorizontal size={14} />
          Más filtros
          {advancedCount > 0 && (
            <span className="inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-slate-900 px-1 text-xs font-medium text-white dark:bg-slate-100 dark:text-slate-900">
              {advancedCount}
            </span>
          )}
        </button>

        {hasActiveFilters && (
          <button
            type="button"
            onClick={() => onChange(CLEAR_ALL)}
            className="inline-flex h-10 items-center gap-1.5 rounded-lg px-3 text-sm text-slate-500 transition hover:bg-slate-100 hover:text-slate-900 dark:hover:bg-slate-800 dark:hover:text-slate-100"
          >
            <X size={14} />
            Limpiar
          </button>
        )}
      </div>

      {showAdvanced && (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
          <FilterSelect
            value={values.color}
            placeholder="Todos los colores"
            labels={COLOR_LABELS_ES}
            ariaLabel="Filtrar por color"
            onSelect={(color) => onChange({ color })}
          />
          <FilterSelect
            value={values.habitat}
            placeholder="Todos los hábitats"
            labels={HABITAT_LABELS_ES}
            ariaLabel="Filtrar por hábitat (solo Gen I–III)"
            onSelect={(habitat) => onChange({ habitat })}
          />
          <FilterSelect
            value={values.egg}
            placeholder="Todos los grupos huevo"
            labels={EGG_GROUP_LABELS_ES}
            ariaLabel="Filtrar por grupo huevo"
            onSelect={(egg) => onChange({ egg })}
          />
          <FilterSelect
            value={values.cat}
            placeholder="Todas las categorías"
            labels={CATEGORY_LABELS_ES}
            ariaLabel="Filtrar por categoría"
            onSelect={(cat) => onChange({ cat: cat as PokemonCategory | null })}
          />
          <FilterSelect
            value={values.stage}
            placeholder="Todas las etapas"
            labels={STAGE_LABELS_ES}
            ariaLabel="Filtrar por etapa evolutiva"
            onSelect={(stage) =>
              onChange({ stage: stage as StageFilter | null })
            }
          />
          <FilterSelect
            value={values.shape}
            placeholder="Todas las formas"
            labels={SHAPE_LABELS_ES}
            ariaLabel="Filtrar por forma corporal"
            onSelect={(shape) => onChange({ shape })}
          />
        </div>
      )}
    </div>
  );
}
