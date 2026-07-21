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
  const [{ q, type, gen, sort }, setFilters] = useFilters();

  const results = useMemo(
    () =>
      sortPokemon(filterPokemon(index, { query: q, type, generation: gen }), sort),
    [index, q, type, gen, sort],
  );

  return (
    <div className="flex flex-col gap-4">
      <div className="sticky top-14 z-10 -mx-4 bg-slate-50/85 px-4 py-3 backdrop-blur dark:bg-slate-950/85">
        <FilterBar values={{ q, type, gen, sort }} onChange={setFilters} />
      </div>

      <p
        className="font-mono text-xs text-slate-500 dark:text-slate-400"
        role="status"
      >
        {results.length === index.entries.length
          ? `${index.entries.length} Pokémon · Generaciones I–IX`
          : `${results.length} de ${index.entries.length} Pokémon`}
      </p>

      {results.length === 0 ? (
        <div className="rounded-xl border border-dashed border-slate-300 py-16 text-center dark:border-slate-700">
          <p className="font-medium">No se encontraron Pokémon</p>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            Prueba con otro nombre o ajusta los filtros de tipo y generación.
          </p>
        </div>
      ) : (
        <ul
          key={`${q}|${type}|${gen}|${sort}`}
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
