"use client";

import { useEffect, useMemo, useRef } from "react";
import { FilterBar } from "@/components/filters/FilterBar";
import type { FilterPatch } from "@/components/filters/FilterBar";
import { Pagination } from "@/components/pokemon/Pagination";
import { PokemonCard } from "@/components/pokemon/PokemonCard";
import { useFilters } from "@/hooks/use-filters";
import { filterPokemon } from "@/lib/search/evolution-search";
import { sortPokemon } from "@/lib/sort";
import type { PokemonIndex } from "@/types/pokemon";

/** Multiple of every grid column count (2/3/4/5/6), so rows always fill. */
const PAGE_SIZE = 60;

interface PokedexViewProps {
  index: PokemonIndex;
}

export function PokedexView({ index }: PokedexViewProps) {
  const [filters, setFilters] = useFilters();
  const { q, type, gen, sort, color, habitat, shape, egg, cat, stage, page } =
    filters;

  const results = useMemo(
    () =>
      sortPokemon(
        filterPokemon(index, {
          query: q,
          type,
          generation: gen,
          color,
          habitat,
          shape,
          eggGroup: egg,
          category: cat,
          stage,
        }),
        sort,
      ),
    [index, q, type, gen, sort, color, habitat, shape, egg, cat, stage],
  );

  const totalPages = Math.max(1, Math.ceil(results.length / PAGE_SIZE));
  const currentPage = Math.min(Math.max(page, 1), totalPages);
  const pageResults = results.slice(
    (currentPage - 1) * PAGE_SIZE,
    currentPage * PAGE_SIZE,
  );

  /** Any filter/sort change lands you back on page 1. */
  const handleFiltersChange = (patch: FilterPatch) =>
    setFilters({ ...patch, page: null });

  const goToPage = (next: number) => {
    setFilters({ page: next === 1 ? null : next });
    window.scrollTo({ top: 0 });
  };

  // Wheel-through pagination: scrolling down while already at the bottom of
  // the list flips to the next page. Refs keep the listener registered once
  // with fresh values; the cooldown stops trackpad momentum from skipping
  // several pages in one gesture.
  const wheelState = useRef({ page: currentPage, total: totalPages, until: 0 });
  const goToPageRef = useRef(goToPage);
  useEffect(() => {
    wheelState.current.page = currentPage;
    wheelState.current.total = totalPages;
    goToPageRef.current = goToPage;
  });

  useEffect(() => {
    const onWheel = (e: WheelEvent) => {
      const s = wheelState.current;
      if (e.deltaY <= 0 || s.page >= s.total) return;
      const atBottom =
        window.innerHeight + window.scrollY >=
        document.documentElement.scrollHeight - 6;
      if (!atBottom) return;
      const now = Date.now();
      if (now < s.until) return;
      s.until = now + 900;
      goToPageRef.current(s.page + 1);
    };
    window.addEventListener("wheel", onWheel, { passive: true });
    return () => window.removeEventListener("wheel", onWheel);
  }, []);

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
    currentPage,
  ]
    .map(String)
    .join("|");

  return (
    <div className="flex flex-col gap-4">
      <div className="sticky top-20 z-10 -mx-4 bg-[#020204]/85 px-4 py-3 backdrop-blur">
        <FilterBar values={filters} onChange={handleFiltersChange} />
      </div>

      <p
        className="font-mono text-[11px] tracking-widest text-emerald-400/90 uppercase"
        role="status"
      >
        <span aria-hidden className="mr-2 text-slate-600">
          &gt;_
        </span>
        {results.length === index.entries.length
          ? `${index.entries.length} entradas registradas · Gen I–IX`
          : `${results.length} / ${index.entries.length} entradas encontradas`}
        {totalPages > 1 && ` · pág. ${currentPage}/${totalPages}`}
        <span aria-hidden className="cursor-blink ml-1.5">
          ▊
        </span>
      </p>

      {results.length === 0 ? (
        <div className="rounded-xl border border-dashed border-slate-700 bg-black/40 py-16 text-center">
          <p className="glitch font-pixel text-sm text-red-400">
            ¡SIN RESULTADOS!
          </p>
          <p className="mt-4 text-sm text-slate-400">
            El Pokémon salvaje huyó… Prueba con otro nombre o ajusta los
            filtros activos.
          </p>
        </div>
      ) : (
        <>
          <ul
            key={listKey}
            className="grid grid-cols-2 gap-3 motion-safe:animate-[fade-in_250ms_ease-out] sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6"
          >
            {pageResults.map((entry) => (
              <li key={entry.id}>
                <PokemonCard entry={entry} />
              </li>
            ))}
          </ul>
          <Pagination
            current={currentPage}
            total={totalPages}
            onChange={goToPage}
          />
        </>
      )}
    </div>
  );
}
