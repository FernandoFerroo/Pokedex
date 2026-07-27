"use client";

import { useState } from "react";
import { Heart, Search, SlidersHorizontal, X } from "lucide-react";
import { useI18n } from "@/lib/i18n/client";
import {
  CATEGORY_LABELS,
  COLOR_LABELS,
  EGG_GROUP_LABELS,
  formatName,
  generationLabel,
  HABITAT_LABELS,
  SHAPE_LABELS,
  STAGE_LABELS,
  TYPE_LABELS,
} from "@/lib/pokemon-meta";
import { SORT_LABELS, SORT_OPTIONS } from "@/lib/sort";
import { cn } from "@/lib/utils";
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
  /** Comma-separated species slugs left out of the results. */
  x: string | null;
  /** Whether `x` also removes each named species' evolution family. */
  xfam: boolean | null;
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
  x?: string | null;
  xfam?: boolean | null;
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
  x: null,
  xfam: null,
};

const controlClasses =
  "h-10 rounded-md border border-slate-700/80 bg-hud-1/90 px-3 font-mono text-sm text-slate-200 outline-none transition focus:border-red-500/70 focus:shadow-[0_0_14px_-2px_rgba(239,68,68,0.55)]";

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
  const { lang, dict } = useI18n();
  const t = dict.list;
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
  // On phones everything except the search collapses behind one toggle, so
  // the sticky bar stays short and the list underneath remains visible.
  const [mobileOpen, setMobileOpen] = useState(false);

  // Excluded species live as chips under the bar, not as a control.
  const excluded = (values.x ?? "")
    .split(",")
    .map((name) => name.trim())
    .filter(Boolean);

  const controlCount =
    advancedCount +
    excluded.length +
    [
      values.type !== null,
      values.gen !== null,
      values.sort !== "id-asc",
      values.fav === true,
    ].filter(Boolean).length;

  const hasActiveFilters = values.q !== "" || controlCount > 0;

  /** Drops one species from the exclusion list (clearing it when last). */
  const removeExcluded = (name: string) => {
    const rest = excluded.filter((n) => n !== name);
    onChange({
      x: rest.length > 0 ? rest.join(",") : null,
      xfam: rest.length > 0 ? values.xfam : null,
    });
  };

  return (
    <div
      className={cn(
        "flex flex-col gap-3",
        mobileOpen && "max-sm:max-h-[calc(100dvh-9rem)] max-sm:overflow-y-auto",
      )}
    >
      {/* `sm:contents` below hoists every control into this row, and selects
          will not shrink past their label, so the six of them overflow a
          tablet-width viewport. Wrapping sends the overflow to a second line
          instead of pushing the page into a horizontal scroll. */}
      <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
        <div className="flex items-center gap-2 sm:contents">
          <label className="relative min-w-0 flex-1">
            <Search
              size={20}
              className="pointer-events-none absolute top-1/2 left-4 -translate-y-1/2 text-slate-300"
            />
            <input
              type="search"
              value={values.q}
              onChange={(e) => onChange({ q: e.target.value || null })}
              placeholder={t.searchPlaceholder}
              aria-label={t.searchAria}
              className="h-12 w-full rounded-md border border-slate-700/80 bg-hud-1/90 pr-4 pl-12 font-mono text-base text-slate-200 outline-none transition focus:border-red-500/70 focus:shadow-[0_0_14px_-2px_rgba(239,68,68,0.55)] sm:h-14"
            />
          </label>

          {/* Mobile-only toggle: shows/hides every control below the search. */}
          <button
            type="button"
            onClick={() => setMobileOpen((open) => !open)}
            aria-expanded={mobileOpen}
            aria-label={t.filtersToggleAria}
            className={cn(
              "inline-flex h-12 shrink-0 items-center gap-1.5 rounded-md border px-3 font-mono text-sm transition sm:hidden",
              mobileOpen || controlCount > 0
                ? "border-cyan-400/60 bg-cyan-400/10 text-cyan-300 shadow-[0_0_14px_-2px_rgba(34,211,238,0.45)]"
                : "border-slate-700/80 bg-hud-1/90 text-slate-300",
            )}
          >
            <SlidersHorizontal size={16} />
            {t.filtersToggle}
            {controlCount > 0 && (
              <span className="inline-flex h-5 min-w-5 items-center justify-center rounded bg-red-500 px-1 font-mono text-xs font-bold text-black shadow-[0_0_10px_rgba(239,68,68,0.7)]">
                {controlCount}
              </span>
            )}
          </button>
        </div>

        <div
          className={cn(
            "flex-col gap-3 sm:contents",
            mobileOpen ? "flex" : "hidden sm:contents",
          )}
        >
        <FilterSelect
          value={values.type}
          placeholder={t.allTypes}
          labels={TYPE_LABELS[lang]}
          ariaLabel={t.filterByType}
          onSelect={(type) => onChange({ type })}
        />

        <select
          value={values.gen ?? ""}
          onChange={(e) =>
            onChange({ gen: e.target.value ? Number(e.target.value) : null })
          }
          aria-label={t.filterByGeneration}
          className={controlClasses}
        >
          <option value="">{t.allGenerations}</option>
          {GENERATIONS.map((gen) => (
            <option key={gen} value={gen}>
              {generationLabel(gen)}
            </option>
          ))}
        </select>

        <select
          value={values.sort}
          onChange={(e) => onChange({ sort: e.target.value as PokemonSort })}
          aria-label={t.sortResults}
          className={controlClasses}
        >
          {SORT_OPTIONS.map((sort) => (
            <option key={sort} value={sort}>
              {SORT_LABELS[lang][sort]}
            </option>
          ))}
        </select>

        {/* Solo favoritos: toggle con corazón, a la izquierda de «Más filtros». */}
        <button
          type="button"
          onClick={() => onChange({ fav: values.fav ? null : true })}
          aria-pressed={values.fav === true}
          aria-label={t.favoritesOnlyAria}
          className={`inline-flex h-10 items-center gap-1.5 rounded-md border px-3 font-mono text-sm transition ${
            values.fav
              ? "border-pink-400/70 bg-pink-400/15 text-pink-300 shadow-[0_0_14px_-2px_rgba(244,114,182,0.6)]"
              : "border-slate-700/80 bg-hud-1/90 text-slate-300 hover:border-pink-400/60 hover:text-pink-300 hover:shadow-[0_0_14px_-2px_rgba(244,114,182,0.45)]"
          }`}
        >
          <Heart size={14} fill={values.fav ? "currentColor" : "none"} />
          {t.favoritesButton}
        </button>

        <button
          type="button"
          onClick={() => setShowAdvanced((open) => !open)}
          aria-expanded={showAdvanced}
          className="inline-flex h-10 items-center gap-1.5 rounded-md border border-slate-700/80 bg-hud-1/90 px-3 font-mono text-sm text-slate-300 transition hover:border-cyan-400/60 hover:text-cyan-300 hover:shadow-[0_0_14px_-2px_rgba(34,211,238,0.45)]"
        >
          <SlidersHorizontal size={14} />
          {t.moreFilters}
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
            {t.clearFilters}
          </button>
        )}
        </div>
      </div>

      {showAdvanced && (
        <div
          className={cn(
            "grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6",
            !mobileOpen && "max-sm:hidden",
          )}
        >
          <FilterSelect
            value={values.color}
            placeholder={t.allColors}
            labels={COLOR_LABELS[lang]}
            ariaLabel={t.filterByColor}
            onSelect={(color) => onChange({ color })}
          />
          <FilterSelect
            value={values.habitat}
            placeholder={t.allHabitats}
            labels={HABITAT_LABELS[lang]}
            ariaLabel={t.filterByHabitat}
            onSelect={(habitat) => onChange({ habitat })}
          />
          <FilterSelect
            value={values.egg}
            placeholder={t.allEggGroups}
            labels={EGG_GROUP_LABELS[lang]}
            ariaLabel={t.filterByEggGroup}
            onSelect={(egg) => onChange({ egg })}
          />
          <FilterSelect
            value={values.cat}
            placeholder={t.allCategories}
            labels={CATEGORY_LABELS[lang]}
            ariaLabel={t.filterByCategory}
            onSelect={(cat) => onChange({ cat: cat as PokemonCategory | null })}
          />
          <FilterSelect
            value={values.stage}
            placeholder={t.allStages}
            labels={STAGE_LABELS[lang]}
            ariaLabel={t.filterByStage}
            onSelect={(stage) =>
              onChange({ stage: stage as StageFilter | null })
            }
          />
          <FilterSelect
            value={values.shape}
            placeholder={t.allShapes}
            labels={SHAPE_LABELS[lang]}
            ariaLabel={t.filterByShape}
            onSelect={(shape) => onChange({ shape })}
          />
        </div>
      )}

      {/* Exclusiones («…menos Pikachu»): normalmente las pone el Profesor Oak,
          así que se muestran como chips retirables para no dejar filtros
          invisibles que el usuario no sepa deshacer. */}
      {excluded.length > 0 && (
        <div className="flex flex-wrap items-center gap-2">
          <span className="font-mono text-xs tracking-widest text-red-400/90 uppercase">
            {values.xfam ? t.excludingFamilies : t.excluding}
          </span>
          {excluded.map((name) => (
            <button
              key={name}
              type="button"
              onClick={() => removeExcluded(name)}
              aria-label={t.excludeRemoveAria(formatName(name))}
              className="inline-flex items-center gap-1.5 rounded-md border border-red-500/50 bg-red-500/10 px-2.5 py-1 font-mono text-xs text-red-300 transition hover:border-red-400 hover:bg-red-500/20"
            >
              {formatName(name)}
              <X size={12} />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
