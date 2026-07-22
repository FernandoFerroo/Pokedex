"use client";

import { useMemo } from "react";
import { FilterBar } from "@/components/filters/FilterBar";
import { PokemonCard } from "@/components/pokemon/PokemonCard";
import { useFilters } from "@/hooks/use-filters";
import { filterPokemon } from "@/lib/search/evolution-search";
import { sortPokemon } from "@/lib/sort";
import type { PokemonIndex } from "@/types/pokemon";

interface PokedexViewProps {
  index: PokemonIndex;
}

export function PokedexView({ index }: PokedexViewProps) {
  const [filters, setFilters] = useFilters();
  const { q, type, gen, sort, color, habitat, shape, egg, cat, stage } =
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

  const listKey = [q, type, gen, sort, color, habitat, shape, egg, cat, stage]
    .map(String)
    .join("|");

  return (
    <div className="flex flex-col gap-4">
      <div className="sticky top-16 z-10 -mx-4 bg-[#020204]/85 px-4 py-3 backdrop-blur">
        <FilterBar values={filters} onChange={setFilters} />
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
        <ul
          key={listKey}
          className="grid grid-cols-2 gap-3 motion-safe:animate-[fade-in_250ms_ease-out] sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6"
        >
          {results.map((entry) => (
            <li key={entry.id}>
              <PokemonCard entry={entry} />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
