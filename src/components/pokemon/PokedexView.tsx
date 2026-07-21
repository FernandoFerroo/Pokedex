"use client";

import { useMemo } from "react";
import { FilterBar } from "@/components/filters/FilterBar";
import { PokemonCard } from "@/components/pokemon/PokemonCard";
import { useFilters } from "@/hooks/use-filters";
import { filterPokemon } from "@/lib/search/evolution-search";
import type { PokemonIndex } from "@/types/pokemon";

interface PokedexViewProps {
  index: PokemonIndex;
}

export function PokedexView({ index }: PokedexViewProps) {
  const [{ q, type, gen }, setFilters] = useFilters();

  const results = useMemo(
    () => filterPokemon(index, { query: q, type, generation: gen }),
    [index, q, type, gen],
  );

  return (
    <div className="flex flex-col gap-4">
      <FilterBar values={{ q, type, gen }} onChange={setFilters} />

      <p className="text-sm text-slate-500 dark:text-slate-400" role="status">
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
        <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
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
