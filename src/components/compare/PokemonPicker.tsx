"use client";

import Image from "next/image";
import { useEffect, useId, useMemo, useRef, useState } from "react";
import { LayoutGrid, Search, X } from "lucide-react";
import { SIDE_A_COLOR, SIDE_B_COLOR } from "@/components/compare/DualRadar";
import { SpeciesGridPicker } from "@/components/compare/SpeciesGridPicker";
import { filterEntries, useTeamIndex } from "@/components/team/TeamDrawer";
import { useI18n } from "@/lib/i18n/client";
import {
  artworkUrl,
  formatDexNumber,
  formatName,
  typeLabel,
} from "@/lib/pokemon-meta";
import { cn } from "@/lib/utils";
import type { CSSProperties } from "react";
import type { TeamMember } from "@/types/team";

/** Results shown at once — enough to scan, short enough to stay on screen. */
const MAX_RESULTS = 8;

interface PokemonPickerProps {
  /** Which corner of the arena this picker fills. */
  side: "a" | "b";
  /** Localized side label, e.g. "Pokémon A". */
  sideLabel: string;
  /** Currently chosen species slug, if any. */
  value: string | null;
  /** Display name of the current pick (localized species name once loaded). */
  valueLabel: string | null;
  /** National id of the current pick — drives the thumbnail. */
  valueId: number | null;
  onSelect: (entry: TeamMember) => void;
  onClear: () => void;
}

/**
 * Autocomplete species selector for one side of the versus screen: a search
 * box backed by the same cached `/api/team-index` payload the team drawer
 * uses, with thumbnails in the dropdown and full keyboard support (arrows to
 * move, Enter to pick, Escape to close).
 */
export function PokemonPicker({
  side,
  sideLabel,
  value,
  valueLabel,
  valueId,
  onSelect,
  onClear,
}: PokemonPickerProps) {
  const { lang, dict } = useI18n();
  const t = dict.compare;
  const { entries, failed } = useTeamIndex();
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  /** Full-Pokédex grid: pick by artwork instead of by name. */
  const [gridOpen, setGridOpen] = useState(false);
  const [active, setActive] = useState(0);
  const listId = useId();
  const boxRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const results = useMemo(() => {
    if (!entries || query.trim().length < 1) return [];
    return filterEntries(entries, query).slice(0, MAX_RESULTS);
  }, [entries, query]);

  // Click outside closes the dropdown without touching the current pick.
  useEffect(() => {
    if (!open) return;
    const onPointerDown = (event: PointerEvent) => {
      if (!boxRef.current?.contains(event.target as Node)) setOpen(false);
    };
    window.addEventListener("pointerdown", onPointerDown);
    return () => window.removeEventListener("pointerdown", onPointerDown);
  }, [open]);

  const pick = (entry: TeamMember) => {
    onSelect(entry);
    setQuery("");
    setOpen(false);
    setGridOpen(false);
  };

  const onKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "Escape") {
      setOpen(false);
      return;
    }
    if (results.length === 0) return;
    if (event.key === "ArrowDown") {
      event.preventDefault();
      setActive((i) => (i + 1) % results.length);
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      setActive((i) => (i - 1 + results.length) % results.length);
    } else if (event.key === "Enter") {
      event.preventDefault();
      pick(results[Math.min(active, results.length - 1)]);
    }
  };

  const accent = side === "a" ? SIDE_A_COLOR : SIDE_B_COLOR;

  return (
    <div
      ref={boxRef}
      style={{ "--side": accent } as CSSProperties}
      className="relative w-full"
    >
      <p className="mb-1.5 font-mono text-xs tracking-[0.25em] text-[var(--side)] uppercase max-sm:mb-1 max-sm:text-[9px] max-sm:tracking-[0.12em]">
        {sideLabel}
      </p>

      {value ? (
        // Chosen: a compact chip that re-opens the search when clicked.
        <div className="flex items-center gap-2.5 rounded-lg border border-[color-mix(in_srgb,var(--side)_45%,transparent)] bg-black/40 p-2 shadow-[0_0_18px_-8px_var(--side)] max-sm:gap-1 max-sm:p-1">
          <span className="relative h-10 w-10 shrink-0 max-sm:h-7 max-sm:w-7">
            {valueId !== null && (
              <Image
                src={artworkUrl(valueId)}
                alt=""
                fill
                sizes="40px"
                className="object-contain"
              />
            )}
          </span>
          <span className="min-w-0 flex-1">
            <span className="block truncate font-mono text-sm font-semibold text-slate-100 max-sm:text-[11px]">
              {valueLabel ?? formatName(value)}
            </span>
            {valueId !== null && (
              <span className="block font-pixel text-[12px] text-slate-500 max-sm:text-[8px]">
                {formatDexNumber(valueId)}
              </span>
            )}
          </span>
          <button
            type="button"
            onClick={() => {
              onClear();
              setQuery("");
              setOpen(true);
              requestAnimationFrame(() => inputRef.current?.focus());
            }}
            aria-label={t.clearAria(valueLabel ?? formatName(value))}
            className="shrink-0 rounded-md p-1.5 text-slate-400 transition hover:bg-[color-mix(in_srgb,var(--side)_18%,transparent)] hover:text-[var(--side)]"
          >
            <X size={16} />
          </button>
        </div>
      ) : (
        <label className="relative block">
          <Search
            size={17}
            className="pointer-events-none absolute top-1/2 left-3.5 -translate-y-1/2 text-slate-400 max-sm:left-1.5 max-sm:h-3.5 max-sm:w-3.5"
          />
          <input
            ref={inputRef}
            type="text"
            role="combobox"
            aria-expanded={open && results.length > 0}
            aria-controls={listId}
            aria-autocomplete="list"
            aria-activedescendant={
              open && results.length > 0 ? `${listId}-${active}` : undefined
            }
            autoComplete="off"
            value={query}
            onChange={(event) => {
              setQuery(event.target.value);
              setActive(0);
              setOpen(true);
            }}
            onFocus={() => setOpen(true)}
            onKeyDown={onKeyDown}
            placeholder={t.searchPlaceholder}
            aria-label={t.searchAria(sideLabel)}
            className="h-12 w-full rounded-lg border border-slate-700/80 bg-hud-1/90 pr-4 pl-11 font-mono text-sm text-slate-200 outline-none transition focus:border-[color-mix(in_srgb,var(--side)_70%,transparent)] focus:shadow-[0_0_16px_-2px_var(--side)] max-sm:h-10 max-sm:pr-1.5 max-sm:pl-6"
          />
        </label>
      )}

      {/* La otra vía de elegir, con el mismo peso visual que el buscador: una
          barra a lo ancho que dice lo que hace. Está siempre presente — con
          un Pokémon ya elegido sirve para cambiarlo sin borrarlo antes. */}
      <button
        type="button"
        onClick={() => setGridOpen(true)}
        aria-label={t.chooseAria(sideLabel)}
        className="mt-2 inline-flex h-14 w-full items-center justify-center gap-2.5 rounded-lg border-2 border-[color-mix(in_srgb,var(--side)_55%,transparent)] bg-[color-mix(in_srgb,var(--side)_12%,transparent)] px-4 font-mono text-sm font-bold tracking-wider text-[var(--side)] uppercase shadow-[0_0_18px_-8px_var(--side)] transition hover:bg-[color-mix(in_srgb,var(--side)_22%,transparent)] hover:shadow-[0_0_22px_-4px_var(--side)] max-sm:mt-1 max-sm:h-9 max-sm:gap-1 max-sm:px-1.5 max-sm:text-[9px] max-sm:leading-[1.15] max-sm:tracking-normal"
      >
        <LayoutGrid size={19} className="shrink-0 max-sm:h-3 max-sm:w-3" />
        {value ? t.pickByImageChange : t.pickByImage}
      </button>

      {failed && (
        <p className="mt-2 font-mono text-xs text-red-400">{t.indexFailed}</p>
      )}
      {!entries && !failed && open && (
        <p className="mt-2 font-mono text-sm text-slate-300">
          {t.loadingIndex}
        </p>
      )}
      {entries && open && !value && query.trim() && results.length === 0 && (
        <p className="mt-2 font-mono text-sm text-slate-300">
          {t.noResults(query.trim())}
        </p>
      )}

      {open && !value && results.length > 0 && (
        <ul
          id={listId}
          role="listbox"
          aria-label={t.resultsAria}
          className="absolute top-full right-0 left-0 z-20 mt-2 max-h-80 overflow-y-auto rounded-lg border border-slate-700/80 bg-hud-3/98 p-1.5 shadow-[0_18px_44px_rgba(0,0,0,0.8)] backdrop-blur"
        >
          {results.map((entry, index) => (
            <li key={entry.id} id={`${listId}-${index}`} role="option" aria-selected={index === active}>
              <button
                type="button"
                onClick={() => pick(entry)}
                onMouseEnter={() => setActive(index)}
                className={cn(
                  "flex w-full items-center gap-2.5 rounded-md p-1.5 text-left transition",
                  index === active
                    ? "bg-[color-mix(in_srgb,var(--side)_16%,transparent)]"
                    : "hover:bg-white/5",
                )}
              >
                <span className="relative h-10 w-10 shrink-0">
                  <Image
                    src={artworkUrl(entry.id)}
                    alt=""
                    fill
                    sizes="40px"
                    className="object-contain"
                  />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate font-mono text-sm font-semibold text-slate-100">
                    {formatName(entry.name)}
                  </span>
                  <span className="block truncate font-mono text-xs text-slate-400">
                    {entry.types.map((type) => typeLabel(type, lang)).join(" / ")}
                  </span>
                </span>
                <span className="shrink-0 font-pixel text-[12px] text-slate-500">
                  {formatDexNumber(entry.id)}
                </span>
              </button>
            </li>
          ))}
        </ul>
      )}

      {gridOpen && (
        <SpeciesGridPicker
          sideLabel={sideLabel}
          accent={accent}
          selected={value}
          onSelect={pick}
          onClose={() => setGridOpen(false)}
        />
      )}
    </div>
  );
}
