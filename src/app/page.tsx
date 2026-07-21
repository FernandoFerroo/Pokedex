import { Suspense } from "react";
import { PokedexView } from "@/components/pokemon/PokedexView";
import { getPokemonIndex } from "@/lib/index/build-index";

/** ISR: the aggregated PokéAPI index is rebuilt at most once a day. */
export const revalidate = 86400;

export default async function HomePage() {
  const index = await getPokemonIndex();

  return (
    <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-6">
      {/* useSearchParams (via nuqs) requires a Suspense boundary to prerender. */}
      <Suspense>
        <PokedexView index={index} />
      </Suspense>
    </main>
  );
}
