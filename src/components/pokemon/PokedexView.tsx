"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useFavorites } from "@/components/favorites/FavoritesProvider";
import { FilterBar } from "@/components/filters/FilterBar";
import type { FilterPatch } from "@/components/filters/FilterBar";
import { Pagination } from "@/components/pokemon/Pagination";
import { PokemonCard } from "@/components/pokemon/PokemonCard";
import { useFilters } from "@/hooks/use-filters";
import { useT } from "@/lib/i18n/client";
import { filterPokemon } from "@/lib/search/evolution-search";
import { sortPokemon } from "@/lib/sort";
import { cn } from "@/lib/utils";
import type { PokemonIndex } from "@/types/pokemon";

/** Multiple of every grid column count (2/3/4/5/6), so rows always fill. */
const PAGE_SIZE = 60;

/** Height covered by the sticky header + filter bar, so jumps land below. */
const STICKY_OFFSET = 160;

/** `?x=pikachu,eevee` -> ["pikachu", "eevee"]. */
export function parseExcluded(value: string | null): string[] {
  return value
    ? value
        .split(",")
        .map((name) => name.trim().toLowerCase())
        .filter(Boolean)
    : [];
}

interface PokedexViewProps {
  index: PokemonIndex;
}

/**
 * The whole result set scrolls as one continuous list (up and down, start to
 * end). The sticky pager at the bottom is a quick-jump map: its numbers
 * teleport to each 60-entry section, and the active number tracks whichever
 * section is currently on screen. `?page=` records the last jump so shared
 * links land on the same section.
 */
export function PokedexView({ index }: PokedexViewProps) {
  const t = useT();
  const [filters, setFilters] = useFilters();
  const {
    q,
    type,
    gen,
    sort,
    color,
    habitat,
    shape,
    egg,
    cat,
    stage,
    fav,
    x,
    xfam,
    page,
  } = filters;
  const { favorites } = useFavorites();

  const results = useMemo(() => {
    const filtered = filterPokemon(index, {
      query: q,
      type,
      generation: gen,
      color,
      habitat,
      shape,
      eggGroup: egg,
      category: cat,
      stage,
      exclude: parseExcluded(x),
      excludeFamily: xfam === true,
    });
    // Favoritos viven en localStorage (no en el índice), así que se aplican
    // como una pasada extra sobre el resultado del resto de filtros.
    const withFav = fav
      ? filtered.filter((entry) => favorites.includes(entry.id))
      : filtered;
    return sortPokemon(withFav, sort);
  }, [
    index,
    q,
    type,
    gen,
    sort,
    color,
    habitat,
    shape,
    egg,
    cat,
    stage,
    fav,
    x,
    xfam,
    favorites,
  ]);

  const totalPages = Math.max(1, Math.ceil(results.length / PAGE_SIZE));

  // First <li> of each section, for jump targets and scroll tracking.
  const boundariesRef = useRef<(HTMLLIElement | null)[]>([]);

  // Which section is on screen right now (drives the pager highlight).
  const [currentSection, setCurrentSection] = useState(1);
  useEffect(() => {
    let raf = 0;
    const measure = () => {
      raf = 0;
      const marker = window.scrollY + STICKY_OFFSET + 20;
      let section = 1;
      boundariesRef.current.slice(0, totalPages).forEach((el, i) => {
        if (el && el.offsetTop <= marker) section = i + 1;
      });
      // The last section can be shorter than the viewport, so it may never
      // reach the marker — hitting the end of the document counts as being
      // on the last page.
      const atEnd =
        window.innerHeight + window.scrollY >=
        document.documentElement.scrollHeight - 4;
      if (atEnd) section = totalPages;
      setCurrentSection((prev) => (prev === section ? prev : section));
    };
    const schedule = () => {
      if (!raf) raf = requestAnimationFrame(measure);
    };
    window.addEventListener("scroll", schedule, { passive: true });
    schedule();
    return () => {
      window.removeEventListener("scroll", schedule);
      if (raf) cancelAnimationFrame(raf);
    };
  }, [totalPages, results]);

  // Scroll so the section's first card sits under the sticky bars. With
  // [content-visibility:auto], offscreen sections have estimated heights
  // that settle as they render, so keep re-aligning frame by frame until
  // the boundary stops moving — otherwise long jumps land a section short.
  const scrollToBoundary = useCallback((target: number) => {
    let attempts = 15;
    const align = () => {
      const el = boundariesRef.current[target - 1];
      if (!el) return;
      const desired = Math.max(
        0,
        el.getBoundingClientRect().top + window.scrollY - STICKY_OFFSET,
      );
      if (Math.abs(desired - window.scrollY) > 2) {
        window.scrollTo({ top: desired });
      }
      if (--attempts > 0) requestAnimationFrame(align);
    };
    align();
  }, []);

  const jumpToSection = (target: number) => {
    scrollToBoundary(target);
    setFilters({ page: target === 1 ? null : target });
  };

  // A shared/refreshed URL with ?page=N lands on that section once the list
  // has painted. Run only on mount — afterwards the user drives the scroll.
  const didInitialJump = useRef(false);
  useEffect(() => {
    if (didInitialJump.current) return;
    didInitialJump.current = true;
    const target = Math.min(Math.max(page, 1), totalPages);
    if (target > 1) {
      requestAnimationFrame(() => scrollToBoundary(target));
    }
  }, [page, totalPages, scrollToBoundary]);

  /** Any filter/sort change lands you back on page 1. */
  const handleFiltersChange = (patch: FilterPatch) =>
    setFilters({ ...patch, page: null });

  const listKey = [
    q,
    type,
    gen,
    sort,
    color,
    habitat,
    shape,
    egg,
    cat,
    stage,
    fav,
    x,
    xfam,
  ]
    .map(String)
    .join("|");

  return (
    <div className="flex flex-col gap-4 max-sm:gap-2">
      {/* `top` tracks the header's own height, which drops to h-16 on phones. */}
      <div className="sticky top-16 z-10 -mx-4 bg-hud-0/85 px-4 py-3 backdrop-blur max-sm:py-1.5 sm:top-20">
        <FilterBar values={filters} onChange={handleFiltersChange} />
      </div>

      {/* En móvil la línea de estado solo aparece cuando dice algo que no se
          ve ya: con el listado completo se oculta para que las primeras filas
          entren en pantalla, como en escritorio. */}
      <p
        className={cn(
          "font-mono text-[13px] tracking-widest text-emerald-400/90 uppercase",
          results.length === index.entries.length && "max-sm:hidden",
        )}
        role="status"
      >
        <span aria-hidden className="mr-2 text-slate-600">
          &gt;_
        </span>
        {results.length === index.entries.length
          ? t.list.statusAll(index.entries.length)
          : t.list.statusFiltered(results.length, index.entries.length)}
        {totalPages > 1 && ` · ${t.list.statusPage(currentSection, totalPages)}`}
        <span aria-hidden className="cursor-blink ml-1.5">
          ▊
        </span>
      </p>

      {results.length === 0 ? (
        <div className="rounded-xl border border-dashed border-slate-700 bg-black/40 py-16 text-center">
          <p className="glitch font-pixel text-sm text-red-400">
            {t.list.noResultsTitle}
          </p>
          <p className="mt-4 text-sm text-slate-300">{t.list.noResultsBody}</p>
        </div>
      ) : (
        <>
          <ul
            key={listKey}
            // Phones get three real entries per row instead of six thumbnails:
            // at 375px that is a ~112px card, enough for the artwork plus the
            // number, name and type chips the desktop card shows. Desktop
            // (lg/xl) is untouched.
            className="grid grid-cols-3 gap-2 motion-safe:animate-[fade-in_250ms_ease-out] min-[520px]:grid-cols-4 sm:gap-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6"
          >
            {results.map((entry, i) => (
              <li
                key={entry.id}
                ref={
                  i % PAGE_SIZE === 0
                    ? (el) => {
                        boundariesRef.current[i / PAGE_SIZE] = el;
                      }
                    : undefined
                }
                // Only the first viewport-full staggers; the rest pop in at once.
                style={{ animationDelay: `${Math.min(i, 17) * 30}ms` }}
                className="motion-safe:animate-[card-in_400ms_ease-out_both]"
              >
                <PokemonCard entry={entry} />
              </li>
            ))}
          </ul>

          {totalPages > 1 && (
            <div className="sticky bottom-0 z-10 -mx-4 border-t border-slate-800/60 bg-hud-0/85 px-4 backdrop-blur">
              <Pagination
                current={currentSection}
                total={totalPages}
                onChange={jumpToSection}
              />
            </div>
          )}
        </>
      )}
    </div>
  );
}
