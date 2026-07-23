"use client";

import { useState } from "react";
import { Heart, Search, SlidersHorizontal, X } from "lucide-react";
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
  fav: boolean | null;
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
  fav?: boolean | null;
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
  fav: null,
};

const controlClasses =
  "h-10 rounded-md border border-slate-700/80 bg-[#0a101d]/90 px-3 font-mono text-sm text-slate-200 outline-none transition focus:border-red-500/70 focus:shadow-[0_0_14px_-2px_rgba(239,68,68,0.55)]";

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
    values.fav === true ||
    advancedCount > 0;

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <label className="relative flex-1">
          <Search
            size={20}
            className="pointer-events-none absolute top-1/2 left-4 -translate-y-1/2 text-slate-300"
          />
          <input
            type="search"
            value={values.q}
            onChange={(e) => onChange({ q: e.target.value || null })}
            placeholder="Buscar por nombre o cadena evolutiva (ej. pikachu)…"
            aria-label="Buscar Pokémon por nombre o cadena evolutiva"
            className="h-14 w-full rounded-md border border-slate-700/80 bg-[#0a101d]/90 pr-4 pl-12 font-mono text-base text-slate-200 outline-none transition focus:border-red-500/70 focus:shadow-[0_0_14px_-2px_rgba(239,68,68,0.55)]"
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

        {/* Solo favoritos: toggle con corazón, a la izquierda de «Más filtros». */}
        <button
          type="button"
          onClick={() => onChange({ fav: values.fav ? null : true })}
          aria-pressed={values.fav === true}
          aria-label="Mostrar solo favoritos"
          className={`inline-flex h-10 items-center gap-1.5 rounded-md border px-3 font-mono text-sm transition ${
            values.fav
              ? "border-pink-400/70 bg-pink-400/15 text-pink-300 shadow-[0_0_14px_-2px_rgba(244,114,182,0.6)]"
              : "border-slate-700/80 bg-[#0a101d]/90 text-slate-300 hover:border-pink-400/60 hover:text-pink-300 hover:shadow-[0_0_14px_-2px_rgba(244,114,182,0.45)]"
          }`}
        >
          <Heart size={14} fill={values.fav ? "currentColor" : "none"} />
          Favoritos
        </button>

        <button
          type="button"
          onClick={() => setShowAdvanced((open) => !open)}
          aria-expanded={showAdvanced}
          className="inline-flex h-10 items-center gap-1.5 rounded-md border border-slate-700/80 bg-[#0a101d]/90 px-3 font-mono text-sm text-slate-300 transition hover:border-cyan-400/60 hover:text-cyan-300 hover:shadow-[0_0_14px_-2px_rgba(34,211,238,0.45)]"
        >
          <SlidersHorizontal size={14} />
          Más filtros
          {advancedCount > 0 && (
            <span className="inline-flex h-5 min-w-5 items-center justify-center rounded bg-red-500 px-1 font-mono text-xs font-bold text-black shadow-[0_0_10px_rgba(239,68,68,0.7)]">
              {advancedCount}
            </span>
          )}
        </button>

        {hasActiveFilters && (
          <button
            type="button"
            onClick={() => onChange(CLEAR_ALL)}
            className="inline-flex h-10 items-center gap-1.5 rounded-md px-3 font-mono text-sm text-slate-400 transition hover:bg-red-500/10 hover:text-red-400"
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
